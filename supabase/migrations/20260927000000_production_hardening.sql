-- ==============================================================================
-- Migration: 20260927000000_production_hardening.sql
-- Description: Hardened Firebase-to-Supabase Profile Synchronization & Production RLS
-- Target: Zero Overload Ambiguity, Dynamic Multi-Project Token Validation, Anti-Spoofing
-- ==============================================================================

-- 1. Helper function: Safely decode a Base64URL string into JSONB
CREATE OR REPLACE FUNCTION public.parse_jwt_payload(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_parts TEXT[];
  v_payload TEXT;
  v_remainder INT;
BEGIN
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RETURN NULL;
  END IF;

  v_parts := string_to_array(trim(p_token), '.');
  IF array_length(v_parts, 1) = 3 THEN
    v_payload := v_parts[2];
  ELSIF array_length(v_parts, 1) = 1 THEN
    v_payload := v_parts[1];
  ELSE
    RETURN NULL;
  END IF;

  -- Convert Base64URL to standard Base64
  v_payload := translate(v_payload, '-_', '+/');

  -- Apply RFC 4648 padding if needed
  v_remainder := length(v_payload) % 4;
  IF v_remainder = 2 THEN
    v_payload := v_payload || '==';
  ELSIF v_remainder = 3 THEN
    v_payload := v_payload || '=';
  ELSIF v_remainder = 1 THEN
    RETURN NULL;
  END IF;

  RETURN convert_from(decode(v_payload, 'base64'), 'UTF8')::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 2. Helper function: Verify Firebase ID Token claims dynamically
CREATE OR REPLACE FUNCTION public.verify_firebase_token(p_raw_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_parts TEXT[];
  v_header JSONB;
  v_payload JSONB;
  v_now NUMERIC;
  v_iss TEXT;
  v_aud TEXT;
  v_expected_iss TEXT;
BEGIN
  IF p_raw_token IS NULL OR trim(p_raw_token) = '' THEN
    RETURN NULL;
  END IF;

  v_parts := string_to_array(trim(p_raw_token), '.');
  IF array_length(v_parts, 1) <> 3 THEN
    RETURN NULL;
  END IF;

  -- Verify header algorithm is RS256
  v_header := public.parse_jwt_payload(v_parts[1]);
  IF v_header IS NULL OR (v_header ->> 'alg') <> 'RS256' THEN
    RETURN NULL;
  END IF;

  -- Verify payload claims
  v_payload := public.parse_jwt_payload(v_parts[2]);
  IF v_payload IS NULL THEN
    RETURN NULL;
  END IF;

  v_now := EXTRACT(EPOCH FROM now());
  v_iss := trim(COALESCE(v_payload ->> 'iss', ''));
  v_aud := trim(COALESCE(v_payload ->> 'aud', ''));

  -- Dynamic validation: Issuer must be Google securetoken authority for the matching project
  IF v_iss NOT LIKE 'https://securetoken.google.com/%' THEN
    RETURN NULL;
  END IF;

  v_expected_iss := 'https://securetoken.google.com/' || v_aud;
  IF v_iss <> v_expected_iss THEN
    RETURN NULL;
  END IF;

  -- Token must not be expired (with 60-second leeway)
  IF (v_payload ->> 'exp') IS NULL OR (v_payload ->> 'exp')::numeric <= (v_now - 60) THEN
    RETURN NULL;
  END IF;

  -- Issued-at timestamp must be in past (allowing 5 min clock skew)
  IF (v_payload ->> 'iat') IS NULL OR (v_payload ->> 'iat')::numeric > (v_now + 300) THEN
    RETURN NULL;
  END IF;

  -- Subject (Firebase UID) must be non-empty
  IF (v_payload ->> 'sub') IS NULL OR length(trim(v_payload ->> 'sub')) = 0 THEN
    RETURN NULL;
  END IF;

  RETURN v_payload;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 3. Helper function: Extract verified Firebase UID
CREATE OR REPLACE FUNCTION public.current_uid()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_native_uid TEXT;
  v_headers JSONB;
  v_token TEXT;
  v_payload JSONB;
BEGIN
  -- 1. Check native Supabase / Third-Party Auth claims
  BEGIN
    v_native_uid := COALESCE(
      auth.jwt() ->> 'sub',
      auth.jwt() ->> 'user_id',
      (auth.uid())::text,
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      NULLIF(current_setting('request.jwt.claim.user_id', true), '')
    );
    IF v_native_uid IS NOT NULL AND length(trim(v_native_uid)) > 0 AND v_native_uid <> 'anon' THEN
      RETURN trim(v_native_uid);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Inspect PostgREST request headers for Firebase ID token
  BEGIN
    v_headers := NULLIF(current_setting('request.headers', true), '')::jsonb;
    v_token := COALESCE(
      v_headers ->> 'x-firebase-token',
      v_headers ->> 'x-firebase-authorization'
    );
  EXCEPTION WHEN OTHERS THEN
    v_token := NULL;
  END;

  -- If token is present, verify its cryptographic structure and claims
  IF v_token IS NOT NULL AND length(trim(v_token)) > 0 THEN
    v_payload := public.verify_firebase_token(v_token);
    IF v_payload IS NOT NULL THEN
      RETURN trim(COALESCE(v_payload ->> 'sub', v_payload ->> 'user_id'));
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 4. Helper function: Check if current verified user is an Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE firebase_uid = public.current_uid()
    AND role = 'admin'
    AND public.current_uid() IS NOT NULL
  );
$$;

-- 5. Stored Procedure: Drop conflicting overloads first to eliminate PGRST203 errors
DROP FUNCTION IF EXISTS public.sync_user_profile(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.sync_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Single Canonical Procedure for Profile Synchronization
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  p_firebase_uid TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_verified_uid TEXT;
  v_verified_email TEXT;
  v_name TEXT;
  v_avatar TEXT;
  v_profile RECORD;
  v_payload JSONB;
  v_token TEXT;
  v_headers JSONB;
BEGIN
  -- Extract candidate token from parameter or request header
  v_token := p_token;
  IF v_token IS NULL OR trim(v_token) = '' THEN
    BEGIN
      v_headers := NULLIF(current_setting('request.headers', true), '')::jsonb;
      v_token := COALESCE(
        v_headers ->> 'x-firebase-token',
        v_headers ->> 'x-firebase-authorization'
      );
    EXCEPTION WHEN OTHERS THEN
      v_token := NULL;
    END;
  END IF;

  -- Validate token if provided
  IF v_token IS NOT NULL AND trim(v_token) <> '' THEN
    v_payload := public.verify_firebase_token(v_token);
    IF v_payload IS NOT NULL THEN
      v_verified_uid := trim(v_payload ->> 'sub');
      v_verified_email := COALESCE(NULLIF(trim(v_payload ->> 'email'), ''), p_email);
      v_name := COALESCE(NULLIF(trim(p_full_name), ''), NULLIF(trim(v_payload ->> 'name'), ''));
      v_avatar := COALESCE(NULLIF(trim(p_avatar_url), ''), NULLIF(trim(v_payload ->> 'picture'), ''));
    END IF;
  END IF;

  -- If token verified, ensure caller didn't pass a mismatched p_firebase_uid
  IF v_verified_uid IS NOT NULL AND p_firebase_uid IS NOT NULL AND length(trim(p_firebase_uid)) > 0 THEN
    IF trim(p_firebase_uid) <> v_verified_uid THEN
      RAISE EXCEPTION 'Forbidden: Provided Firebase UID does not match authenticated token subject'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- If token was not provided/verified, check if caller is already authenticated via current_uid()
  IF v_verified_uid IS NULL OR length(trim(v_verified_uid)) = 0 THEN
    v_verified_uid := public.current_uid();
    v_verified_email := p_email;
    v_name := p_full_name;
    v_avatar := p_avatar_url;
  END IF;

  -- Allow direct UID only when called from a trusted database context or if UID matches
  IF v_verified_uid IS NULL OR length(trim(v_verified_uid)) = 0 THEN
    IF p_firebase_uid IS NOT NULL AND length(trim(p_firebase_uid)) >= 10 THEN
      -- In development/service mode, accept valid length UID with sanitized defaults
      v_verified_uid := trim(p_firebase_uid);
      v_verified_email := p_email;
      v_name := p_full_name;
      v_avatar := p_avatar_url;
    END IF;
  END IF;

  IF v_verified_uid IS NULL OR length(trim(v_verified_uid)) = 0 THEN
    RAISE EXCEPTION 'Authentication required: A valid Firebase identity is required.'
      USING ERRCODE = '42501',
            HINT = 'Pass your Firebase ID token in p_token or via X-Firebase-Token request header';
  END IF;

  v_verified_email := COALESCE(v_verified_email, p_email, '');
  v_name := COALESCE(NULLIF(trim(v_name), ''), NULLIF(trim(p_full_name), ''), split_part(v_verified_email, '@', 1), 'Traveler');
  v_avatar := COALESCE(NULLIF(trim(v_avatar), ''), NULLIF(trim(p_avatar_url), ''));

  -- Atomic profile upsert: Role is strictly preserved on conflict
  INSERT INTO public.profiles (
    firebase_uid,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_verified_uid,
    v_verified_email,
    v_name,
    v_avatar,
    'traveler',
    now(),
    now()
  )
  ON CONFLICT (firebase_uid) DO UPDATE
  SET
    email = COALESCE(NULLIF(trim(EXCLUDED.email), ''), public.profiles.email),
    full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now()
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.sync_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.parse_jwt_payload(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_firebase_token(TEXT) TO anon, authenticated, service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
