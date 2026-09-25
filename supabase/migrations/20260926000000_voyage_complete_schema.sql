-- Migration: 20260926000000_voyage_complete_schema.sql
-- Description: Complete schema for VOYAGE travel-tech platform with Firebase Auth integration & RLS

-- 1. Helper function to extract current authenticated user's Firebase UID or Supabase UID
CREATE OR REPLACE FUNCTION public.current_uid()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    (auth.uid())::text,
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    NULLIF(current_setting('request.jwt.claim.user_id', true), '')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Profiles Table (Linked to Firebase UID)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'traveler' CHECK (role IN ('traveler', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Destinations Table
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  description TEXT NOT NULL,
  hero_image TEXT NOT NULL,
  gallery_images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('Adventure', 'Mountains', 'Beaches', 'Cultural', 'Wildlife', 'Luxury')),
  estimated_budget NUMERIC(10, 2),
  recommended_duration TEXT,
  best_time_to_visit TEXT,
  rating NUMERIC(3, 2) DEFAULT 4.9 CHECK (rating >= 0 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Travel Packages Table
CREATE TABLE IF NOT EXISTS public.travel_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_days INT NOT NULL CHECK (duration_days > 0),
  price_per_person NUMERIC(10, 2) NOT NULL,
  highlights TEXT[] DEFAULT '{}',
  inclusions TEXT[] DEFAULT '{}',
  exclusions TEXT[] DEFAULT '{}',
  availability TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  travelers INT DEFAULT 1 CHECK (travelers > 0),
  budget NUMERIC(10, 2),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Itinerary Items Table
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number > 0),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_favorite UNIQUE (user_id, destination_id)
);

-- 8. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.travel_packages(id) ON DELETE RESTRICT,
  travel_date DATE NOT NULL,
  travelers INT NOT NULL DEFAULT 1 CHECK (travelers > 0),
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON public.profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_destinations_slug ON public.destinations(slug);
CREATE INDEX IF NOT EXISTS idx_destinations_category ON public.destinations(category);
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON public.destinations(is_featured);
CREATE INDEX IF NOT EXISTS idx_packages_destination ON public.travel_packages(destination_id);
CREATE INDEX IF NOT EXISTS idx_trips_user ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip ON public.itinerary_items(trip_id, day_number);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE firebase_uid = public.current_uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies: Destinations (Public read, admin write)
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

-- RLS Policies: Packages (Public read, admin write)
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

-- RLS Policies: Profiles
CREATE POLICY "Profiles viewable by owner or admin"
  ON public.profiles FOR SELECT
  USING (firebase_uid = public.current_uid() OR public.is_admin());

CREATE POLICY "Profiles self insert"
  ON public.profiles FOR INSERT
  WITH CHECK (firebase_uid = public.current_uid());

CREATE POLICY "Profiles self update"
  ON public.profiles FOR UPDATE
  USING (firebase_uid = public.current_uid() OR public.is_admin())
  WITH CHECK (firebase_uid = public.current_uid() OR public.is_admin());

-- RLS Policies: Trips (Owner only or Admin)
CREATE POLICY "Users view own trips"
  ON public.trips FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = trips.user_id AND profiles.firebase_uid = public.current_uid())
    OR public.is_admin()
  );

CREATE POLICY "Users insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = trips.user_id AND profiles.firebase_uid = public.current_uid())
  );

CREATE POLICY "Users update own trips"
  ON public.trips FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = trips.user_id AND profiles.firebase_uid = public.current_uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = trips.user_id AND profiles.firebase_uid = public.current_uid())
  );

CREATE POLICY "Users delete own trips"
  ON public.trips FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = trips.user_id AND profiles.firebase_uid = public.current_uid())
  );

-- RLS Policies: Itinerary Items (Owner of trip)
CREATE POLICY "Users view itinerary items"
  ON public.itinerary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      JOIN public.profiles ON profiles.id = trips.user_id
      WHERE trips.id = itinerary_items.trip_id AND profiles.firebase_uid = public.current_uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Users modify itinerary items"
  ON public.itinerary_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      JOIN public.profiles ON profiles.id = trips.user_id
      WHERE trips.id = itinerary_items.trip_id AND profiles.firebase_uid = public.current_uid()
    )
  );

-- RLS Policies: Favorites
CREATE POLICY "Users view own favorites"
  ON public.favorites FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = favorites.user_id AND profiles.firebase_uid = public.current_uid())
  );

CREATE POLICY "Users add own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = favorites.user_id AND profiles.firebase_uid = public.current_uid())
  );

CREATE POLICY "Users remove own favorites"
  ON public.favorites FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = favorites.user_id AND profiles.firebase_uid = public.current_uid())
  );

-- RLS Policies: Bookings
CREATE POLICY "Users view own bookings or admin"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = bookings.user_id AND profiles.firebase_uid = public.current_uid())
    OR public.is_admin()
  );

CREATE POLICY "Users create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = bookings.user_id AND profiles.firebase_uid = public.current_uid())
  );

CREATE POLICY "Admin manage bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Newsletter RLS
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin view subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.is_admin());

-- Seed Initial High-Quality Destinations
INSERT INTO public.destinations (name, slug, country, description, hero_image, gallery_images, category, estimated_budget, recommended_duration, best_time_to_visit, rating, is_featured, is_published)
VALUES
  (
    'Kyoto',
    'kyoto-japan',
    'Japan',
    'Ancient temples, tranquil Zen stone gardens, traditional wooden machiya houses, and mystical bamboo groves in Japan’s cultural heartland.',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80'
    ],
    'Cultural',
    2800.00,
    '7 Days',
    'March to May, October to November',
    4.95,
    true,
    true
  ),
  (
    'Amalfi Coast',
    'amalfi-coast-italy',
    'Italy',
    'Dramatic pastel cliffside villages, azure Tyrrhenian waters, fragrant lemon groves, and quintessential Mediterranean luxury.',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80'
    ],
    'Luxury',
    3500.00,
    '6 Days',
    'May to September',
    4.92,
    true,
    true
  ),
  (
    'Santorini',
    'santorini-greece',
    'Greece',
    'Whitewashed cubiform villas and cobalt-domed churches perched high on volcanic caldera cliffs above the Aegean Sea.',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
    ],
    'Beaches',
    3200.00,
    '5 Days',
    'April to October',
    4.89,
    true,
    true
  ),
  (
    'Banff National Park',
    'banff-canada',
    'Canada',
    'Glacial turquoise alpine lakes, soaring snowcapped Rocky Mountain peaks, and untamed pine wilderness adventures.',
    'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1600&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
    ],
    'Mountains',
    2400.00,
    '8 Days',
    'June to September, December to March',
    4.94,
    true,
    true
  ),
  (
    'Serengeti National Park',
    'serengeti-tanzania',
    'Tanzania',
    'Endless golden savannah plains, the legendary Great Migration, and majestic wildlife safaris under vast African skies.',
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80'
    ],
    'Wildlife',
    4800.00,
    '7 Days',
    'June to October, January to February',
    4.98,
    true,
    true
  ),
  (
    'Patagonia Explorer',
    'patagonia-chile-argentina',
    'Chile',
    'Towering granite peaks of Torres del Paine, thunderous Perito Moreno glacier tongues, and untamed windswept fjords.',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
    ],
    'Adventure',
    3900.00,
    '10 Days',
    'November to March',
    4.96,
    false,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed Travel Packages
INSERT INTO public.travel_packages (destination_id, title, description, duration_days, price_per_person, highlights, inclusions, exclusions, availability, is_published)
SELECT
  d.id,
  'Zen Sanctuaries & Imperial Kyoto',
  'Private temple sunrise walks, Michelin kaiseki dining, tea master ceremonies, and luxury ryokan retreats with natural onsen baths.',
  7,
  2499.00,
  ARRAY['Private access to Arashiyama bamboo forest', 'Fushimi Inari Torii dawn hike', 'Exclusive Gion geisha district walk', 'Tea ceremony with 15th-generation master'],
  ARRAY['6 nights 5-star Ryokan stay', 'Daily gourmet breakfast & 3 kaiseki dinners', 'First-class Shinkansen bullet train pass', 'Private English-speaking historian'],
  ARRAY['International flights', 'Personal travel insurance'],
  ARRAY['Spring 2026', 'Autumn 2026'],
  true
FROM public.destinations d
WHERE d.slug = 'kyoto-japan'
ON CONFLICT DO NOTHING;

INSERT INTO public.travel_packages (destination_id, title, description, duration_days, price_per_person, highlights, inclusions, exclusions, availability, is_published)
SELECT
  d.id,
  'Amalfi Coastline Luxury Yacht & Villas',
  'Private Riva boat charters between Capri and Positano, cliffside Michelin dining, and secluded infinity pool villas in Ravello.',
  6,
  3250.00,
  ARRAY['Private Riva yacht charter to Capri Blue Grotto', 'Wine tasting in Ravello terraced vineyards', 'Sunset champagne cruise along Positano'],
  ARRAY['5 nights cliffside suite', 'Daily artisan breakfast & 2 Michelin dinners', 'Private luxury Mercedes transfers', 'Skipper & yacht amenities'],
  ARRAY['International airfare', 'Gratuities'],
  ARRAY['Summer 2026', 'Autumn 2026'],
  true
FROM public.destinations d
WHERE d.slug = 'amalfi-coast-italy'
ON CONFLICT DO NOTHING;
