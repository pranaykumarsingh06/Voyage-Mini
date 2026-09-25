-- Migration: 20260925205500_create_voyage_schema.sql
-- Description: Create initial schema for VOYAGE travel application with Firebase Auth integration & RLS

-- 1. Helper function to extract current authenticated user ID (supporting Firebase Auth and Supabase Auth)
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

-- 2. Profiles Table (Keyed by Firebase UID / Auth ID string)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Destinations Table
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  continent TEXT,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  rating NUMERIC(3, 2) DEFAULT 4.8 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INT DEFAULT 0,
  price_level INT DEFAULT 2 CHECK (price_level BETWEEN 1 AND 4),
  best_time_to_visit TEXT,
  weather_summary TEXT,
  popular_tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Travel Packages Table
CREATE TABLE IF NOT EXISTS public.travel_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  duration_days INT NOT NULL DEFAULT 5,
  duration_nights INT NOT NULL DEFAULT 4,
  price NUMERIC(10, 2) NOT NULL,
  discounted_price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  included TEXT[] DEFAULT '{}',
  excluded TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  max_travelers INT DEFAULT 12,
  rating NUMERIC(3, 2) DEFAULT 4.9,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Trips Table (User planned trips)
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.travel_packages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(10, 2),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Itinerary Items Table (Detailed day-by-day plan for a trip)
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INT NOT NULL DEFAULT 1,
  time_slot TIME,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT DEFAULT 'sightseeing' CHECK (activity_type IN ('sightseeing', 'dining', 'transport', 'accommodation', 'activity', 'other')),
  location_name TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  cost NUMERIC(10, 2) DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Favorites Table (Saved destinations & packages)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.travel_packages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_favorite_target CHECK (destination_id IS NOT NULL OR package_id IS NOT NULL),
  CONSTRAINT unique_user_destination_favorite UNIQUE (user_id, destination_id),
  CONSTRAINT unique_user_package_favorite UNIQUE (user_id, package_id)
);

-- 8. Bookings Table (Booked packages & reservations)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.travel_packages(id) ON DELETE RESTRICT,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  travelers_count INT NOT NULL DEFAULT 1 CHECK (travelers_count >= 1),
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'paid', 'completed', 'cancelled')),
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_destinations_slug ON public.destinations(slug);
CREATE INDEX IF NOT EXISTS idx_destinations_continent ON public.destinations(continent);
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON public.destinations(is_featured);
CREATE INDEX IF NOT EXISTS idx_travel_packages_dest ON public.travel_packages(destination_id);
CREATE INDEX IF NOT EXISTS idx_travel_packages_slug ON public.travel_packages(slug);
CREATE INDEX IF NOT EXISTS idx_trips_user ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_day ON public.itinerary_items(trip_id, day_number, order_index);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package ON public.bookings(package_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (public.current_uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (public.current_uid() = id)
  WITH CHECK (public.current_uid() = id);

-- 2. Destinations Policies (Public read, admin write)
CREATE POLICY "Destinations are viewable by everyone"
  ON public.destinations FOR SELECT
  USING (true);

-- 3. Travel Packages Policies (Public read, admin write)
CREATE POLICY "Travel packages are viewable by everyone"
  ON public.travel_packages FOR SELECT
  USING (true);

-- 4. Trips Policies (Owner only)
CREATE POLICY "Users can view their own trips"
  ON public.trips FOR SELECT
  USING (public.current_uid() = user_id);

CREATE POLICY "Users can insert their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (public.current_uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (public.current_uid() = user_id)
  WITH CHECK (public.current_uid() = user_id);

-- 5. Itinerary Items Policies (Owner of the trip only)
CREATE POLICY "Users can view itinerary items of their trips"
  ON public.itinerary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = public.current_uid()
    )
  );

CREATE POLICY "Users can insert itinerary items to their trips"
  ON public.itinerary_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = public.current_uid()
    )
  );

CREATE POLICY "Users can update itinerary items of their trips"
  ON public.itinerary_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = public.current_uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = public.current_uid()
    )
  );

CREATE POLICY "Users can delete itinerary items of their trips"
  ON public.itinerary_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = public.current_uid()
    )
  );

-- 6. Favorites Policies (Owner only)
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (public.current_uid() = user_id);

CREATE POLICY "Users can add their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (public.current_uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (public.current_uid() = user_id);

-- 7. Bookings Policies (Owner only)
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (public.current_uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (public.current_uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (public.current_uid() = user_id)
  WITH CHECK (public.current_uid() = user_id);

-- Seed Initial Destination & Package Data for VOYAGE
INSERT INTO public.destinations (name, slug, country, city, continent, description, short_description, image_url, rating, reviews_count, price_level, best_time_to_visit, weather_summary, popular_tags, is_featured)
VALUES
  ('Kyoto', 'kyoto-japan', 'Japan', 'Kyoto', 'Asia', 'Historic temples, tranquil Zen gardens, traditional wooden houses, and bamboo groves.', 'Timeless elegance and ancient temples in the cultural heart of Japan.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80', 4.95, 342, 3, 'March - May, October - November', 'Temperate, cherry blossoms in spring', ARRAY['Cultural', 'Temples', 'Cherry Blossoms', 'Cuisine'], true),
  ('Amalfi Coast', 'amalfi-coast-italy', 'Italy', 'Positano', 'Europe', 'Stunning cliffside villages, azure Tyrrhenian waters, vibrant bougainvillea, and Italian coastal luxury.', 'Iconic pastel villages and sun-drenched Mediterranean panoramas.', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80', 4.90, 280, 4, 'May - September', 'Warm Mediterranean sunshine', ARRAY['Coastal', 'Romantic', 'Luxury', 'Seafood'], true),
  ('Santorini', 'santorini-greece', 'Greece', 'Oia', 'Europe', 'Whitewashed cubiform houses perched on volcanic caldera cliffs overlooking the Aegean Sea.', 'Breathtaking sunsets and Aegean architecture on volcanic cliffs.', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80', 4.88, 512, 3, 'April - November', 'Sunny and dry with refreshing sea breezes', ARRAY['Caldera', 'Sunset Views', 'Beaches', 'Wine'], true),
  ('Banff National Park', 'banff-canada', 'Canada', 'Banff', 'North America', 'Glacial alpine lakes, soaring Rocky Mountain peaks, and untamed wildlife adventures.', 'Turquoise glacier lakes framed by dramatic Rocky Mountain peaks.', 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80', 4.92, 195, 2, 'June - September, December - March', 'Cool alpine summers and snowy wonderland winters', ARRAY['Nature', 'Mountains', 'Hiking', 'Adventure'], true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Travel Packages
INSERT INTO public.travel_packages (destination_id, title, slug, description, duration_days, duration_nights, price, discounted_price, included, excluded, highlights, max_travelers, rating, image_url, is_popular)
SELECT
  d.id,
  'Kyoto Heritage & Zen Retreat',
  'kyoto-heritage-zen-retreat',
  'Immerse yourself in authentic tea ceremonies, private geisha district walks, temple meditation, and Michelin-starred kaiseki dining.',
  7,
  6,
  2499.00,
  2199.00,
  ARRAY['Luxury Ryokan Stays', 'Daily Gourmet Breakfast', 'Private Temple Tour Guide', 'Bullet Train Transfers', 'Tea Ceremony Experience'],
  ARRAY['International Flights', 'Travel Insurance', 'Personal Expenses'],
  ARRAY['Fushimi Inari Sunrise Walk', 'Arashiyama Bamboo Forest Private Access', 'Traditional Kaiseki Banquet'],
  8,
  4.97,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  true
FROM public.destinations d
WHERE d.slug = 'kyoto-japan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.travel_packages (destination_id, title, slug, description, duration_days, duration_nights, price, discounted_price, included, excluded, highlights, max_travelers, rating, image_url, is_popular)
SELECT
  d.id,
  'Amalfi Coastline Luxury Sail & Stay',
  'amalfi-coastline-luxury-sail',
  'Cruise along Capri and Positano on private yachts, taste lemon orchards in Ravello, and unwind in cliffside villas.',
  6,
  5,
  3250.00,
  2890.00,
  ARRAY['5-Star Cliffside Suite', 'Private Capri Boat Charter', 'Wine Tasting Tour', 'Daily Breakfast & 2 Dinners'],
  ARRAY['Flights', 'Personal Discretionary Tips'],
  ARRAY['Capri Blue Grotto Exploration', 'Sunset Yacht Dinner', 'Ravello Historic Gardens'],
  10,
  4.94,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  true
FROM public.destinations d
WHERE d.slug = 'amalfi-coast-italy'
ON CONFLICT (slug) DO NOTHING;
