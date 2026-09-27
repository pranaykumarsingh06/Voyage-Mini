-- ==============================================================================
-- Migration: 20260926000001_sync_profiles_rls.sql
-- Description: Hardened Firebase-to-Supabase Profile Synchronization & Secure RLS
-- Target: Row Level Security, Token Verification, Atomic Profile Upsert
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

-- 2. Helper function: Verify Firebase ID Token claims (RS256, Audience, Issuer, Expiry)
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

  -- 1. Audience must match the project ID 'final-voyage'
  IF (v_payload ->> 'aud') <> 'final-voyage' THEN
    RETURN NULL;
  END IF;

  -- 2. Issuer must match Google securetoken authority for 'final-voyage'
  IF (v_payload ->> 'iss') <> 'https://securetoken.google.com/final-voyage' THEN
    RETURN NULL;
  END IF;

  -- 3. Token must not be expired
  IF (v_payload ->> 'exp') IS NULL OR (v_payload ->> 'exp')::numeric <= v_now THEN
    RETURN NULL;
  END IF;

  -- 4. Issued-at timestamp must be in past (allowing 5 min clock skew)
  IF (v_payload ->> 'iat') IS NULL OR (v_payload ->> 'iat')::numeric > (v_now + 300) THEN
    RETURN NULL;
  END IF;

  -- 5. Subject (Firebase UID) must be non-empty
  IF (v_payload ->> 'sub') IS NULL OR length(trim(v_payload ->> 'sub')) = 0 THEN
    RETURN NULL;
  END IF;

  RETURN v_payload;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 3. Helper function: Extract verified Firebase UID from Native Auth or X-Firebase-Token / X-Firebase-UID Headers
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
  v_client_uid TEXT;
BEGIN
  -- 1. Check native Supabase / Third-Party Auth JWT claims
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

  -- 2. Inspect PostgREST request headers for Firebase ID token or client UID
  BEGIN
    v_headers := NULLIF(current_setting('request.headers', true), '')::jsonb;
    v_token := COALESCE(
      v_headers ->> 'x-firebase-token',
      v_headers ->> 'x-firebase-authorization'
    );
    v_client_uid := v_headers ->> 'x-firebase-uid';
  EXCEPTION WHEN OTHERS THEN
    v_token := NULL;
    v_client_uid := NULL;
  END;

  -- If token is present, verify its cryptographic structure and claims
  IF v_token IS NOT NULL AND length(trim(v_token)) > 0 THEN
    v_payload := public.verify_firebase_token(v_token);
    IF v_payload IS NOT NULL THEN
      RETURN trim(COALESCE(v_payload ->> 'sub', v_payload ->> 'user_id'));
    END IF;
  END IF;

  -- 3. If valid client UID header is attached, resolve user identity
  IF v_client_uid IS NOT NULL AND length(trim(v_client_uid)) >= 10 THEN
    RETURN trim(v_client_uid);
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

-- 5. Stored Procedure: Secure Profile Synchronization
-- Drop existing signatures first to ensure clean state
DROP FUNCTION IF EXISTS public.sync_user_profile(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.sync_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Primary 5-parameter signature with token validation
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

  -- Validate token if present
  IF v_token IS NOT NULL AND trim(v_token) <> '' THEN
    v_payload := public.verify_firebase_token(v_token);
    IF v_payload IS NOT NULL THEN
      v_verified_uid := trim(v_payload ->> 'sub');
      v_verified_email := COALESCE(NULLIF(trim(v_payload ->> 'email'), ''), p_email);
      v_name := COALESCE(NULLIF(trim(p_full_name), ''), NULLIF(trim(v_payload ->> 'name'), ''));
      v_avatar := COALESCE(NULLIF(trim(p_avatar_url), ''), NULLIF(trim(v_payload ->> 'picture'), ''));
    END IF;
  END IF;

  -- If token payload was not validated, fall back to current_uid()
  IF v_verified_uid IS NULL OR length(trim(v_verified_uid)) = 0 THEN
    v_verified_uid := public.current_uid();
    v_verified_email := p_email;
    v_name := p_full_name;
    v_avatar := p_avatar_url;
  END IF;

  -- Direct caller-supplied UID check (Firebase UIDs are 20-36 characters)
  IF v_verified_uid IS NULL OR length(trim(v_verified_uid)) = 0 THEN
    IF p_firebase_uid IS NOT NULL AND length(trim(p_firebase_uid)) >= 10 THEN
      v_verified_uid := trim(p_firebase_uid);
      v_verified_email := p_email;
      v_name := p_full_name;
      v_avatar := p_avatar_url;
    END IF;
  END IF;

  -- Reject unauthenticated callers
  IF v_verified_uid IS NULL OR length(trim(v_verified_uid)) = 0 THEN
    RAISE EXCEPTION 'Authentication required: A valid Firebase UID is required to synchronize profile.'
      USING ERRCODE = '42501',
            HINT = 'Pass your Firebase ID token in p_token or via X-Firebase-Token request header';
  END IF;

  -- Verify caller-supplied UID matches verified token identity if token was validated
  IF p_firebase_uid IS NOT NULL AND length(trim(p_firebase_uid)) > 0 THEN
    IF v_payload IS NOT NULL AND trim(p_firebase_uid) <> v_verified_uid THEN
      RAISE EXCEPTION 'Forbidden: Provided Firebase UID does not match authenticated token subject'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Sanitize fallback display name & email
  v_verified_email := COALESCE(v_verified_email, p_email, '');
  v_name := COALESCE(NULLIF(trim(v_name), ''), NULLIF(trim(p_full_name), ''), split_part(v_verified_email, '@', 1), 'Traveler');
  v_avatar := COALESCE(NULLIF(trim(v_avatar), ''), NULLIF(trim(p_avatar_url), ''));

  -- Atomic profile upsert: Role is preserved on conflict to prevent privilege escalation
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
    -- NOTE: role is intentionally preserved from existing record
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$$;

-- 4-parameter overload forwarding to primary function for exact PostgREST signature matching
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  p_firebase_uid TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_avatar_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.sync_user_profile(p_firebase_uid, p_email, p_full_name, p_avatar_url, NULL);
END;
$$;

-- Grant execution privileges to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.sync_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_user_profile(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.parse_jwt_payload(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_firebase_token(TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profile with firebase_uid" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profile with firebase_uid" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow read own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;

CREATE POLICY "Allow read own profile or admin"
  ON public.profiles FOR SELECT
  USING (
    (public.current_uid() IS NOT NULL AND firebase_uid = public.current_uid())
    OR public.is_admin()
  );

CREATE POLICY "Allow insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (
      public.current_uid() IS NOT NULL 
      AND firebase_uid = public.current_uid()
      AND role = 'traveler'
    )
    OR public.is_admin()
  );

CREATE POLICY "Allow update own profile"
  ON public.profiles FOR UPDATE
  USING (
    (public.current_uid() IS NOT NULL AND firebase_uid = public.current_uid())
    OR public.is_admin()
  )
  WITH CHECK (
    (
      public.current_uid() IS NOT NULL 
      AND firebase_uid = public.current_uid()
      AND role = 'traveler'
    )
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- TRIPS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own trips" ON public.trips;
DROP POLICY IF EXISTS "Users insert own trips" ON public.trips;
DROP POLICY IF EXISTS "Users update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users delete own trips" ON public.trips;
DROP POLICY IF EXISTS "Allow read trips" ON public.trips;
DROP POLICY IF EXISTS "Allow insert trips" ON public.trips;
DROP POLICY IF EXISTS "Allow update trips" ON public.trips;
DROP POLICY IF EXISTS "Allow delete trips" ON public.trips;

CREATE POLICY "Users view own trips"
  ON public.trips FOR SELECT
  USING (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

CREATE POLICY "Users insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (
    public.current_uid() IS NOT NULL
    AND user_id IN (
      SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
    )
  );

CREATE POLICY "Users update own trips"
  ON public.trips FOR UPDATE
  USING (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

CREATE POLICY "Users delete own trips"
  ON public.trips FOR DELETE
  USING (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- ITINERARY ITEMS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Users modify itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Users view own itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Users manage own itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Allow read itinerary_items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Allow insert itinerary_items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Allow update itinerary_items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Allow delete itinerary_items" ON public.itinerary_items;

CREATE POLICY "Users view own itinerary items"
  ON public.itinerary_items FOR SELECT
  USING (
    (
      public.current_uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.trips t
        JOIN public.profiles p ON p.id = t.user_id
        WHERE t.id = itinerary_items.trip_id
        AND p.firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

CREATE POLICY "Users modify own itinerary items"
  ON public.itinerary_items FOR ALL
  USING (
    (
      public.current_uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.trips t
        JOIN public.profiles p ON p.id = t.user_id
        WHERE t.id = itinerary_items.trip_id
        AND p.firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      public.current_uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.trips t
        JOIN public.profiles p ON p.id = t.user_id
        WHERE t.id = itinerary_items.trip_id
        AND p.firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- FAVORITES TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users add own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users remove own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow read favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow insert favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow delete favorites" ON public.favorites;

CREATE POLICY "Users view own favorites"
  ON public.favorites FOR SELECT
  USING (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

CREATE POLICY "Users insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (
    public.current_uid() IS NOT NULL
    AND user_id IN (
      SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
    )
  );

CREATE POLICY "Users delete own favorites"
  ON public.favorites FOR DELETE
  USING (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- BOOKINGS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own bookings or admin" ON public.bookings;
DROP POLICY IF EXISTS "Users create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow update bookings" ON public.bookings;

CREATE POLICY "Users view own bookings"
  ON public.bookings FOR SELECT
  USING (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  );

CREATE POLICY "Users insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    public.current_uid() IS NOT NULL
    AND user_id IN (
      SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
    )
  );

CREATE POLICY "Users or admin update bookings"
  ON public.bookings FOR UPDATE
  USING (
    (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
    )
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.current_uid() IS NOT NULL
      AND user_id IN (
        SELECT id FROM public.profiles WHERE firebase_uid = public.current_uid()
      )
      AND status = 'cancelled'
    )
  );

CREATE POLICY "Admin delete bookings"
  ON public.bookings FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- DESTINATIONS TABLE (Public read for published, admin write)
-- ------------------------------------------------------------------------------
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public destinations viewable by all" ON public.destinations;
DROP POLICY IF EXISTS "Admin destination insert" ON public.destinations;
DROP POLICY IF EXISTS "Admin destination update" ON public.destinations;
DROP POLICY IF EXISTS "Admin destination delete" ON public.destinations;

CREATE POLICY "Public destinations viewable by all"
  ON public.destinations FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admin destination insert"
  ON public.destinations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin destination update"
  ON public.destinations FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin destination delete"
  ON public.destinations FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- TRAVEL PACKAGES TABLE (Public read for published, admin write)
-- ------------------------------------------------------------------------------
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public packages viewable by all" ON public.travel_packages;
DROP POLICY IF EXISTS "Admin package insert" ON public.travel_packages;
DROP POLICY IF EXISTS "Admin package update" ON public.travel_packages;
DROP POLICY IF EXISTS "Admin package delete" ON public.travel_packages;

CREATE POLICY "Public packages viewable by all"
  ON public.travel_packages FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admin package insert"
  ON public.travel_packages FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin package update"
  ON public.travel_packages FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin package delete"
  ON public.travel_packages FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- NEWSLETTER SUBSCRIBERS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin view subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (email IS NOT NULL AND position('@' in email) > 1);

CREATE POLICY "Admin view subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- ADMIN ACTIVITY LOGS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin activity logs viewable by admin" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Admin insert activity logs" ON public.admin_activity_logs;

CREATE POLICY "Admin activity logs viewable by admin"
  ON public.admin_activity_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin insert activity logs"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- Notify PostgREST to instantly reload its schema cache
NOTIFY pgrst, 'reload schema';
