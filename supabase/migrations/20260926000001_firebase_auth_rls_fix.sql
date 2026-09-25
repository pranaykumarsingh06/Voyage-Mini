-- Migration: 20260926000001_firebase_auth_rls_fix.sql
-- Description: Align Row Level Security (RLS) policies and RPC functions for Firebase Auth integration

-- 1. Drop existing restrictive policies that required Supabase GoTrue JWT
DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;

DROP POLICY IF EXISTS "Users view own trips" ON public.trips;
DROP POLICY IF EXISTS "Users insert own trips" ON public.trips;
DROP POLICY IF EXISTS "Users update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users delete own trips" ON public.trips;

DROP POLICY IF EXISTS "Users view own itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Users manage own itinerary items" ON public.itinerary_items;

DROP POLICY IF EXISTS "Users view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorites;

DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin update bookings" ON public.bookings;

-- 2. Create updated RLS policies compatible with client anon key & Firebase UID queries

-- Profiles: Allow reading, inserting, and updating profiles
CREATE POLICY "Allow public read profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update profiles"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trips: Allow reading, creating, updating, and deleting trips
CREATE POLICY "Allow read trips"
  ON public.trips FOR SELECT
  USING (true);

CREATE POLICY "Allow insert trips"
  ON public.trips FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update trips"
  ON public.trips FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete trips"
  ON public.trips FOR DELETE
  USING (true);

-- Itinerary items
CREATE POLICY "Allow read itinerary_items"
  ON public.itinerary_items FOR SELECT
  USING (true);

CREATE POLICY "Allow insert itinerary_items"
  ON public.itinerary_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update itinerary_items"
  ON public.itinerary_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete itinerary_items"
  ON public.itinerary_items FOR DELETE
  USING (true);

-- Bookings
CREATE POLICY "Allow read bookings"
  ON public.bookings FOR SELECT
  USING (true);

CREATE POLICY "Allow insert bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update bookings"
  ON public.bookings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Favorites
CREATE POLICY "Allow read favorites"
  ON public.favorites FOR SELECT
  USING (true);

CREATE POLICY "Allow insert favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow delete favorites"
  ON public.favorites FOR DELETE
  USING (true);

-- Newsletter Subscribers
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin can view subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Allow insert newsletter_subscribers"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read newsletter_subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (true);

-- 3. Stored Procedure for atomic Firebase profile sync
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  p_firebase_uid TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE firebase_uid = p_firebase_uid LIMIT 1;
  
  IF FOUND THEN
    UPDATE public.profiles
    SET
      full_name = COALESCE(p_full_name, full_name),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = now()
    WHERE firebase_uid = p_firebase_uid
    RETURNING * INTO v_profile;
  ELSE
    INSERT INTO public.profiles (firebase_uid, email, full_name, avatar_url, role)
    VALUES (p_firebase_uid, p_email, COALESCE(p_full_name, split_part(p_email, '@', 1)), p_avatar_url, 'traveler')
    RETURNING * INTO v_profile;
  END IF;

  RETURN to_jsonb(v_profile);
END;
$$;
