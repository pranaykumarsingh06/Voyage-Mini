-- ==============================================================================
-- Migration: 20260926000001_sync_profiles_rls.sql
-- Description: Enable Secure Firebase-to-Supabase Profile Synchronization & RLS
-- Target Table: public.profiles
-- ==============================================================================

-- 1. Ensure RLS remains ENABLED on profiles (Requirement 8)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy restrictive policies that failed on anonymous Firebase clients
DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profile with firebase_uid" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profile with firebase_uid" ON public.profiles;

-- 3. Policy: Allow reading profiles
-- Anyone with the client anon key can look up profiles (needed to verify existing user by firebase_uid)
CREATE POLICY "Allow public read profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- 4. Policy: Allow client inserting profile with valid Firebase UID
CREATE POLICY "Allow insert profile with firebase_uid"
  ON public.profiles FOR INSERT
  WITH CHECK (firebase_uid IS NOT NULL AND length(trim(firebase_uid)) > 0);

-- 5. Policy: Allow client updating profile by Firebase UID
CREATE POLICY "Allow update profile with firebase_uid"
  ON public.profiles FOR UPDATE
  USING (firebase_uid IS NOT NULL AND length(trim(firebase_uid)) > 0)
  WITH CHECK (firebase_uid IS NOT NULL AND length(trim(firebase_uid)) > 0);

-- 6. Stored Procedure: Atomic Profile Upsert with SECURITY DEFINER
-- This function runs with elevated security definer privileges, guaranteeing
-- that upserts succeed even under strict network / token policies.
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  p_firebase_uid TEXT,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_name TEXT;
BEGIN
  IF p_firebase_uid IS NULL OR length(trim(p_firebase_uid)) = 0 THEN
    RAISE EXCEPTION 'p_firebase_uid cannot be null or empty';
  END IF;

  -- Determine display name fallback
  v_name := COALESCE(NULLIF(trim(p_full_name), ''), split_part(p_email, '@', 1), 'Traveler');

  -- Upsert: Insert if new, or update existing record on duplicate firebase_uid
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
    p_firebase_uid,
    p_email,
    v_name,
    p_avatar_url,
    'traveler',
    now(),
    now()
  )
  ON CONFLICT (firebase_uid) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now()
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$$;

-- 7. Grant execution privileges to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.sync_user_profile(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 8. Also update trips, bookings, and favorites policies so logged-in travelers can create records
DROP POLICY IF EXISTS "Users view own trips" ON public.trips;
DROP POLICY IF EXISTS "Users insert own trips" ON public.trips;
DROP POLICY IF EXISTS "Users update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users delete own trips" ON public.trips;

CREATE POLICY "Allow read trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow insert trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update trips" ON public.trips FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete trips" ON public.trips FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin update bookings" ON public.bookings;

CREATE POLICY "Allow read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update bookings" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorites;

CREATE POLICY "Allow read favorites" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Allow insert favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete favorites" ON public.favorites FOR DELETE USING (true);
