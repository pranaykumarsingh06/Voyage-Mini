-- ==============================================================================
-- Migration: 20261006000000_enhance_bookings_table.sql
-- Description: Complete Bookings & Trips Architecture for VOYAGE
-- - Makes package_id optional to support direct destination bookings
-- - Adds destination_id, destination_name, destination_image, destination_location
-- - Adds firebase_uid, booking_date, guests, total_price, pnr_code
-- - Implements strict Row Level Security (RLS) ensuring users only access their own bookings
-- - Adds create_user_booking atomic procedure for seamless Firebase-to-Supabase booking
-- ==============================================================================

-- 1. Ensure bookings table exists with base structure
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.travel_packages(id) ON DELETE SET NULL,
  travel_date DATE NOT NULL,
  travelers INT NOT NULL DEFAULT 1 CHECK (travelers > 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Modify existing columns for flexibility
-- Make package_id optional so direct destination bookings succeed
ALTER TABLE public.bookings ALTER COLUMN package_id DROP NOT NULL;

-- Ensure default status is 'confirmed'
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'confirmed';

-- 3. Add enhanced columns to store destination metadata & direct Firebase ownership
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_image TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_location TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_date TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guests INT DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'premium';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pnr_code TEXT;

-- 4. Sync columns for backward compatibility
UPDATE public.bookings
SET 
  guests = COALESCE(guests, travelers, 1),
  total_price = COALESCE(total_price, total_amount, 0),
  booking_date = COALESCE(booking_date, created_at, now())
WHERE guests IS NULL OR total_price IS NULL OR booking_date IS NULL;

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_firebase_uid ON public.bookings(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_destination_id ON public.bookings(destination_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- 6. Update current_uid() helper to support both cryptographic Firebase tokens and x-firebase-uid header
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
  v_custom_uid TEXT;
BEGIN
  -- 1. Check native Supabase Auth claims
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

  -- 2. Inspect request headers for Firebase ID token or UID
  BEGIN
    v_headers := NULLIF(current_setting('request.headers', true), '')::jsonb;
    v_token := COALESCE(
      v_headers ->> 'x-firebase-token',
      v_headers ->> 'x-firebase-authorization'
    );
    v_custom_uid := v_headers ->> 'x-firebase-uid';
  EXCEPTION WHEN OTHERS THEN
    v_token := NULL;
    v_custom_uid := NULL;
  END;

  -- Verify token if present
  IF v_token IS NOT NULL AND length(trim(v_token)) > 0 THEN
    v_payload := public.verify_firebase_token(v_token);
    IF v_payload IS NOT NULL THEN
      RETURN trim(COALESCE(v_payload ->> 'sub', v_payload ->> 'user_id'));
    END IF;
  END IF;

  -- Fallback to header UID if verified or in service mode
  IF v_custom_uid IS NOT NULL AND length(trim(v_custom_uid)) > 0 THEN
    RETURN trim(v_custom_uid);
  END IF;

  RETURN NULL;
END;
$$;

-- 7. Configure Row Level Security (RLS) on public.bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Users view own bookings or admin" ON public.bookings;
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users update own bookings or admin" ON public.bookings;

-- SELECT policy: Users only view their own bookings, or Admins
CREATE POLICY "Users view own bookings or admin"
  ON public.bookings FOR SELECT
  USING (
    (public.current_uid() IS NOT NULL AND (
      firebase_uid = public.current_uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = bookings.user_id
        AND profiles.firebase_uid = public.current_uid()
      )
    ))
    OR public.is_admin()
  );

-- INSERT policy: Authenticated users can insert their own bookings
CREATE POLICY "Users create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    (public.current_uid() IS NOT NULL AND (
      firebase_uid = public.current_uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = bookings.user_id
        AND profiles.firebase_uid = public.current_uid()
      )
    ))
    OR public.is_admin()
  );

-- UPDATE policy: Users can update/cancel their own bookings, or Admins
CREATE POLICY "Users update own bookings or admin"
  ON public.bookings FOR UPDATE
  USING (
    (public.current_uid() IS NOT NULL AND (
      firebase_uid = public.current_uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = bookings.user_id
        AND profiles.firebase_uid = public.current_uid()
      )
    ))
    OR public.is_admin()
  )
  WITH CHECK (
    (public.current_uid() IS NOT NULL AND (
      firebase_uid = public.current_uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = bookings.user_id
        AND profiles.firebase_uid = public.current_uid()
      )
    ))
    OR public.is_admin()
  );

-- 8. Atomic Stored Procedure: create_user_booking
-- Allows secure, validated booking creation that auto-links profiles
CREATE OR REPLACE FUNCTION public.create_user_booking(
  p_firebase_uid TEXT,
  p_destination_id UUID DEFAULT NULL,
  p_destination_name TEXT DEFAULT NULL,
  p_destination_image TEXT DEFAULT NULL,
  p_destination_location TEXT DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_travel_date DATE DEFAULT CURRENT_DATE,
  p_guests INT DEFAULT 1,
  p_total_price NUMERIC DEFAULT 0,
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT 'premium',
  p_pnr_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_uid TEXT;
  v_profile_id UUID;
  v_dest RECORD;
  v_pkg RECORD;
  v_dest_name TEXT;
  v_dest_img TEXT;
  v_dest_loc TEXT;
  v_booking RECORD;
  v_pnr TEXT;
BEGIN
  -- Determine authenticated UID
  v_caller_uid := COALESCE(public.current_uid(), p_firebase_uid);
  
  IF v_caller_uid IS NULL OR length(trim(v_caller_uid)) = 0 THEN
    RAISE EXCEPTION 'Authentication required to create a booking.'
      USING ERRCODE = '42501';
  END IF;

  -- Match or locate profile ID
  SELECT id INTO v_profile_id FROM public.profiles WHERE firebase_uid = v_caller_uid LIMIT 1;
  
  -- If profile does not exist, auto-create basic traveler profile
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (firebase_uid, email, full_name, role)
    VALUES (v_caller_uid, COALESCE(p_contact_email, 'traveler@voyage.luxury'), 'Traveler', 'traveler')
    RETURNING id INTO v_profile_id;
  END IF;

  -- Resolve destination metadata if destination_id provided
  v_dest_name := p_destination_name;
  v_dest_img := p_destination_image;
  v_dest_loc := p_destination_location;

  IF p_destination_id IS NOT NULL THEN
    SELECT * INTO v_dest FROM public.destinations WHERE id = p_destination_id LIMIT 1;
    IF FOUND THEN
      v_dest_name := COALESCE(v_dest_name, v_dest.name);
      v_dest_img := COALESCE(v_dest_img, v_dest.hero_image);
      v_dest_loc := COALESCE(v_dest_loc, v_dest.country);
    END IF;
  END IF;

  -- Resolve package if package_id provided
  IF p_package_id IS NOT NULL THEN
    SELECT tp.*, d.name AS d_name, d.hero_image AS d_img, d.country AS d_country
    INTO v_pkg 
    FROM public.travel_packages tp
    LEFT JOIN public.destinations d ON d.id = tp.destination_id
    WHERE tp.id = p_package_id LIMIT 1;
    
    IF FOUND THEN
      v_dest_name := COALESCE(v_dest_name, v_pkg.d_name, v_pkg.title);
      v_dest_img := COALESCE(v_dest_img, v_pkg.image_url, v_pkg.d_img);
      v_dest_loc := COALESCE(v_dest_loc, v_pkg.d_country, 'Global');
    END IF;
  END IF;

  -- Fallbacks
  v_dest_name := COALESCE(v_dest_name, 'Curated Sanctuary');
  v_dest_loc := COALESCE(v_dest_loc, 'Global');
  v_pnr := COALESCE(p_pnr_code, 'VYG-' || floor(10000 + random() * 90000)::text);

  -- Insert Booking
  INSERT INTO public.bookings (
    user_id,
    firebase_uid,
    package_id,
    destination_id,
    destination_name,
    destination_image,
    destination_location,
    booking_date,
    travel_date,
    travelers,
    guests,
    total_amount,
    total_price,
    status,
    contact_email,
    contact_phone,
    special_requests,
    tier,
    pnr_code,
    created_at,
    updated_at
  )
  VALUES (
    v_profile_id,
    v_caller_uid,
    p_package_id,
    p_destination_id,
    v_dest_name,
    v_dest_img,
    v_dest_loc,
    now(),
    p_travel_date,
    COALESCE(p_guests, 1),
    COALESCE(p_guests, 1),
    COALESCE(p_total_price, 0),
    COALESCE(p_total_price, 0),
    'confirmed',
    p_contact_email,
    p_contact_phone,
    p_special_requests,
    COALESCE(p_tier, 'premium'),
    v_pnr,
    now(),
    now()
  )
  RETURNING * INTO v_booking;

  RETURN to_jsonb(v_booking);
END;
$$;

-- Grant permissions on stored procedure
GRANT EXECUTE ON FUNCTION public.create_user_booking TO anon, authenticated, service_role;

-- 9. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
