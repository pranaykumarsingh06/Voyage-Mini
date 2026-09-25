import { Destination, TravelPackage, Trip, Booking, Profile } from '../types/database';

export const INITIAL_DESTINATIONS: Destination[] = [
  {
    id: 'd1',
    name: 'Kyoto',
    slug: 'kyoto-japan',
    country: 'Japan',
    description: 'Ancient temples, tranquil Zen stone gardens, traditional wooden machiya houses, and mystical bamboo groves in Japan’s cultural heartland.',
    hero_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Cultural',
    estimated_budget: 2800,
    recommended_duration: '7 Days',
    best_time_to_visit: 'March to May, October to November',
    rating: 4.95,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'd2',
    name: 'Amalfi Coast',
    slug: 'amalfi-coast-italy',
    country: 'Italy',
    description: 'Dramatic pastel cliffside villages, azure Tyrrhenian waters, fragrant lemon groves, and quintessential Mediterranean luxury.',
    hero_image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Luxury',
    estimated_budget: 3500,
    recommended_duration: '6 Days',
    best_time_to_visit: 'May to September',
    rating: 4.92,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z'
  },
  {
    id: 'd3',
    name: 'Santorini',
    slug: 'santorini-greece',
    country: 'Greece',
    description: 'Whitewashed cubiform villas and cobalt-domed churches perched high on volcanic caldera cliffs above the Aegean Sea.',
    hero_image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Beaches',
    estimated_budget: 3200,
    recommended_duration: '5 Days',
    best_time_to_visit: 'April to October',
    rating: 4.89,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'd4',
    name: 'Banff National Park',
    slug: 'banff-canada',
    country: 'Canada',
    description: 'Glacial turquoise alpine lakes, soaring snowcapped Rocky Mountain peaks, and untamed pine wilderness adventures.',
    hero_image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Mountains',
    estimated_budget: 2400,
    recommended_duration: '8 Days',
    best_time_to_visit: 'June to September, December to March',
    rating: 4.94,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-18T10:00:00Z',
    updated_at: '2026-01-18T10:00:00Z'
  },
  {
    id: 'd5',
    name: 'Serengeti National Park',
    slug: 'serengeti-tanzania',
    country: 'Tanzania',
    description: 'Endless golden savannah plains, the legendary Great Migration, and majestic wildlife safaris under vast African skies.',
    hero_image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Wildlife',
    estimated_budget: 4800,
    recommended_duration: '7 Days',
    best_time_to_visit: 'June to October, January to February',
    rating: 4.98,
    is_featured: false,
    is_published: true,
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'd6',
    name: 'Patagonia Explorer',
    slug: 'patagonia-chile-argentina',
    country: 'Chile',
    description: 'Towering granite peaks of Torres del Paine, thunderous Perito Moreno glacier tongues, and untamed windswept fjords.',
    hero_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Adventure',
    estimated_budget: 3900,
    recommended_duration: '10 Days',
    best_time_to_visit: 'November to March',
    rating: 4.96,
    is_featured: false,
    is_published: true,
    created_at: '2026-01-22T10:00:00Z',
    updated_at: '2026-01-22T10:00:00Z'
  }
];

export const INITIAL_PACKAGES: TravelPackage[] = [
  {
    id: 'p1',
    destination_id: 'd1',
    title: 'Zen Sanctuaries & Imperial Kyoto',
    description: 'Private temple sunrise walks, Michelin kaiseki dining, tea master ceremonies, and luxury ryokan retreats with natural onsen baths.',
    duration_days: 7,
    price_per_person: 2499,
    highlights: [
      'Private access to Arashiyama bamboo forest',
      'Fushimi Inari Torii dawn hike',
      'Exclusive Gion geisha district walk',
      'Tea ceremony with 15th-generation master'
    ],
    inclusions: [
      '6 nights 5-star Ryokan stay',
      'Daily gourmet breakfast & 3 kaiseki dinners',
      'First-class Shinkansen bullet train pass',
      'Private English-speaking historian'
    ],
    exclusions: ['International flights', 'Personal travel insurance'],
    availability: ['Spring 2026', 'Autumn 2026'],
    is_published: true,
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
    destination: INITIAL_DESTINATIONS[0]
  },
  {
    id: 'p2',
    destination_id: 'd2',
    title: 'Amalfi Coastline Luxury Yacht & Villas',
    description: 'Private Riva boat charters between Capri and Positano, cliffside Michelin dining, and secluded infinity pool villas in Ravello.',
    duration_days: 6,
    price_per_person: 3250,
    highlights: [
      'Private Riva yacht charter to Capri Blue Grotto',
      'Wine tasting in Ravello terraced vineyards',
      'Sunset champagne cruise along Positano'
    ],
    inclusions: [
      '5 nights cliffside suite',
      'Daily artisan breakfast & 2 Michelin dinners',
      'Private luxury Mercedes transfers',
      'Skipper & yacht amenities'
    ],
    exclusions: ['International airfare', 'Gratuities'],
    availability: ['Summer 2026', 'Autumn 2026'],
    is_published: true,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z',
    destination: INITIAL_DESTINATIONS[1]
  },
  {
    id: 'p3',
    destination_id: 'd3',
    title: 'Santorini Caldera Sunset & Wine Odyssey',
    description: 'Helicopter transfers over volcanic calderas, private catamaran sunset sails, and volcanic vineyard masterclasses.',
    duration_days: 5,
    price_per_person: 2890,
    highlights: [
      'Private catamaran cruise to Red & White beaches',
      'Exclusive sunset terrace table in Oia',
      'Assyrtiko wine tasting in subterranean cellars'
    ],
    inclusions: [
      '4 nights caldera cave suite with plunge pool',
      'All private ground transfers',
      'Catamaran dinner cruise'
    ],
    exclusions: ['Flights', 'Discretionary tips'],
    availability: ['May to October 2026'],
    is_published: true,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    destination: INITIAL_DESTINATIONS[2]
  }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 't1',
    user_id: 'u1',
    destination_id: 'd1',
    title: 'Kyoto Autumn Zen & Gastronomy',
    start_date: '2026-10-15',
    end_date: '2026-10-22',
    travelers: 2,
    budget: 6000,
    status: 'planning',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
    destination: INITIAL_DESTINATIONS[0],
    itinerary_items: [
      {
        id: 'i1',
        trip_id: 't1',
        day_number: 1,
        title: 'Ryokan Check-in & Evening Gion Walk',
        description: 'Check in at Hiiragiya Ryokan, welcome matcha tea, followed by evening photography in Gion.',
        location: 'Hiiragiya Ryokan & Gion',
        start_time: '15:00',
        end_time: '19:00',
        created_at: '2026-02-01T10:00:00Z'
      },
      {
        id: 'i2',
        trip_id: 't1',
        day_number: 2,
        title: 'Fushimi Inari Dawn Pilgrimage',
        description: 'Hike through 10,000 torii gates before crowds arrive, then traditional tea on the summit.',
        location: 'Fushimi Inari Taisha',
        start_time: '06:30',
        end_time: '10:00',
        created_at: '2026-02-01T10:00:00Z'
      }
    ]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    user_id: 'u1',
    package_id: 'p1',
    travel_date: '2026-10-15',
    travelers: 2,
    total_amount: 4998,
    status: 'confirmed',
    created_at: '2026-02-05T14:30:00Z',
    updated_at: '2026-02-05T14:30:00Z',
    package: INITIAL_PACKAGES[0],
    profile: {
      id: 'u1',
      firebase_uid: 'demo-user-1',
      full_name: 'Elena Rostova',
      email: 'elena@voyage.luxury',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: 'traveler',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }
  },
  {
    id: 'b2',
    user_id: 'u2',
    package_id: 'p2',
    travel_date: '2026-07-20',
    travelers: 2,
    total_amount: 6500,
    status: 'pending',
    created_at: '2026-02-12T09:15:00Z',
    updated_at: '2026-02-12T09:15:00Z',
    package: INITIAL_PACKAGES[1],
    profile: {
      id: 'u2',
      firebase_uid: 'demo-user-2',
      full_name: 'Julian Vance',
      email: 'julian.vance@architect.io',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      role: 'traveler',
      created_at: '2026-01-05T00:00:00Z',
      updated_at: '2026-01-05T00:00:00Z'
    }
  }
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'u1',
    firebase_uid: 'demo-user-1',
    full_name: 'Elena Rostova',
    email: 'elena@voyage.luxury',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'traveler',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'u2',
    firebase_uid: 'demo-user-2',
    full_name: 'Julian Vance',
    email: 'julian.vance@architect.io',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    role: 'traveler',
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z'
  },
  {
    id: 'u-admin',
    firebase_uid: 'admin-voyage-1',
    full_name: 'Voyage Master Admin',
    email: 'admin@voyage.luxury',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    role: 'admin',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];
