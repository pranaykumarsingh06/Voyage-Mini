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
    rating: 4.98,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'd2',
    name: 'Swiss Alps',
    slug: 'swiss-alps-switzerland',
    country: 'Switzerland',
    description: 'Majestic jagged Matterhorn summits, crystal glacial lakes, scenic cogwheel alpine railways, and ultra-exclusive ski chalets.',
    hero_image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Mountains',
    estimated_budget: 4200,
    recommended_duration: '8 Days',
    best_time_to_visit: 'December to April, July to September',
    rating: 4.97,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-11T10:00:00Z',
    updated_at: '2026-01-11T10:00:00Z'
  },
  {
    id: 'd3',
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
    estimated_budget: 3600,
    recommended_duration: '6 Days',
    best_time_to_visit: 'May to September',
    rating: 4.96,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z'
  },
  {
    id: 'd4',
    name: 'Bali',
    slug: 'bali-indonesia',
    country: 'Indonesia',
    description: 'Emerald jungle rice terraces, secluded clifftop sanctuaries, spiritual water temples, and vibrant coastal surfing lagoons.',
    hero_image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Beaches',
    estimated_budget: 2100,
    recommended_duration: '9 Days',
    best_time_to_visit: 'April to October',
    rating: 4.93,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-13T10:00:00Z',
    updated_at: '2026-01-13T10:00:00Z'
  },
  {
    id: 'd5',
    name: 'Cappadocia',
    slug: 'cappadocia-turkey',
    country: 'Turkey',
    description: 'Fabled fairy chimney valleys, subterranean ancient cities, and hot air balloon sunrises painting kaleidoscopic Anatolian skies.',
    hero_image: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Adventure',
    estimated_budget: 2600,
    recommended_duration: '5 Days',
    best_time_to_visit: 'April to June, September to October',
    rating: 4.95,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-14T10:00:00Z',
    updated_at: '2026-01-14T10:00:00Z'
  },
  {
    id: 'd6',
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
    estimated_budget: 2500,
    recommended_duration: '7 Days',
    best_time_to_visit: 'June to September, December to March',
    rating: 4.94,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'd7',
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
    rating: 4.91,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-16T10:00:00Z',
    updated_at: '2026-01-16T10:00:00Z'
  },
  {
    id: 'd8',
    name: 'Serengeti National Park',
    slug: 'serengeti-tanzania',
    country: 'Tanzania',
    description: 'Endless golden savannah plains, the legendary Great Migration, and majestic wildlife safaris under vast African skies.',
    hero_image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Wildlife',
    estimated_budget: 5200,
    recommended_duration: '8 Days',
    best_time_to_visit: 'June to October, January to February',
    rating: 4.99,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-17T10:00:00Z',
    updated_at: '2026-01-17T10:00:00Z'
  },
  {
    id: 'd9',
    name: 'Reykjavik',
    slug: 'reykjavik-iceland',
    country: 'Iceland',
    description: 'Glacial lagoons, dancing emerald Aurora Borealis, therapeutic volcanic hot springs, and otherworldly black sand beaches.',
    hero_image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Adventure',
    estimated_budget: 3400,
    recommended_duration: '6 Days',
    best_time_to_visit: 'September to April (Auroras), June to August (Midnight Sun)',
    rating: 4.92,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-18T10:00:00Z',
    updated_at: '2026-01-18T10:00:00Z'
  },
  {
    id: 'd10',
    name: 'Queenstown',
    slug: 'queenstown-new-zealand',
    country: 'New Zealand',
    description: 'Alpine majesty, deep fjord cruising in Milford Sound, world-renowned Pinot Noir vineyards, and heart-pounding alpine exploration.',
    hero_image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Adventure',
    estimated_budget: 3800,
    recommended_duration: '8 Days',
    best_time_to_visit: 'December to March, June to August',
    rating: 4.94,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-19T10:00:00Z',
    updated_at: '2026-01-19T10:00:00Z'
  },
  {
    id: 'd11',
    name: 'Petra',
    slug: 'petra-jordan',
    country: 'Jordan',
    description: 'The legendary Rose City hand-carved into sheer sandstone cliffs, timeless Bedouin hospitality, and starry nights in Wadi Rum.',
    hero_image: 'https://images.unsplash.com/photo-1579606032834-d4a974b78619?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1580834341580-8c17a3a632df?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Cultural',
    estimated_budget: 2900,
    recommended_duration: '6 Days',
    best_time_to_visit: 'March to May, September to November',
    rating: 4.96,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'd12',
    name: 'Bora Bora',
    slug: 'bora-bora-french-polynesia',
    country: 'French Polynesia',
    description: 'Iconic thatched overwater villas hovering above electric turquoise lagoons, surrounded by coral reefs and Mount Otemanu.',
    hero_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Luxury',
    estimated_budget: 6500,
    recommended_duration: '7 Days',
    best_time_to_visit: 'May to October',
    rating: 4.98,
    is_featured: true,
    is_published: true,
    created_at: '2026-01-21T10:00:00Z',
    updated_at: '2026-01-21T10:00:00Z'
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
    destination_id: 'd3',
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
    destination: INITIAL_DESTINATIONS[2]
  },
  {
    id: 'p3',
    destination_id: 'd7',
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
    destination: INITIAL_DESTINATIONS[6]
  },
  {
    id: 'p4',
    destination_id: 'd2',
    title: 'Swiss Alpine Luxury Ski & Grand Hotel Odyssey',
    description: 'First-class Glacier Express travel, private heli-skiing near the Matterhorn, and five-star spa indulgence in Zermatt.',
    duration_days: 8,
    price_per_person: 3890,
    highlights: [
      'Matterhorn Glacier Paradise private lift access',
      'Glacier Express Excellence Class salon carriage',
      'Private alpine cheese & vintage wine cellar experience'
    ],
    inclusions: [
      '7 nights five-star alpine spa resort',
      'All first-class Swiss rail passes',
      'Private certified mountain guide'
    ],
    exclusions: ['International airfare', 'Gear rental'],
    availability: ['Winter 2026', 'Summer 2026'],
    is_published: true,
    created_at: '2026-01-16T10:00:00Z',
    updated_at: '2026-01-16T10:00:00Z',
    destination: INITIAL_DESTINATIONS[1]
  },
  {
    id: 'p5',
    destination_id: 'd5',
    title: 'Cappadocia Balloon Safari & Cave Villa Solitude',
    description: 'Sunrise hot air balloon rides across lunar valleys, underground Byzantine sanctuary discoveries, and organic Anatolian banquets.',
    duration_days: 5,
    price_per_person: 2250,
    highlights: [
      'VIP Sunrise hot air balloon flight with champagne toast',
      'Private subterranean city exploration with archaeologist',
      'Sunset horseback trail through Love Valley'
    ],
    inclusions: [
      '4 nights carved cave luxury suite',
      'All airport transfers via private Mercedes',
      'Gourmet dining experiences'
    ],
    exclusions: ['International flights'],
    availability: ['Spring 2026', 'Autumn 2026'],
    is_published: true,
    created_at: '2026-01-17T10:00:00Z',
    updated_at: '2026-01-17T10:00:00Z',
    destination: INITIAL_DESTINATIONS[4]
  },
  {
    id: 'p6',
    destination_id: 'd8',
    title: 'Serengeti Great Migration & Tented Luxury Safari',
    description: 'Unbounded savannah game drives tracking the Big Five, private bush aircraft flights, and sundowners overlooking Mara River crossings.',
    duration_days: 8,
    price_per_person: 4790,
    highlights: [
      'Private custom 4x4 safari rover with master tracker',
      'Hot air balloon safari over the Serengeti plains',
      'Ngorongoro Crater rim luxury picnic'
    ],
    inclusions: [
      '7 nights premier tented luxury camp',
      'All national park conservation fees',
      'Full board & vintage sundowner cocktails'
    ],
    exclusions: ['International flights', 'Visa fees'],
    availability: ['Summer 2026', 'Winter 2026'],
    is_published: true,
    created_at: '2026-01-18T10:00:00Z',
    updated_at: '2026-01-18T10:00:00Z',
    destination: INITIAL_DESTINATIONS[7]
  },
  {
    id: 'p7',
    destination_id: 'd12',
    title: 'Bora Bora Overwater Sanctuary & Coral Lagoon Cruise',
    description: 'Indulge in suspended overwater villas, private outrigger canoe breakfasts delivered by water, and manta ray snorkeling safaris.',
    duration_days: 7,
    price_per_person: 5800,
    highlights: [
      'Presidential overwater villa with glass floor viewing panels',
      'Private motu sunset champagne dinner',
      'Helicopter flight over Mount Otemanu'
    ],
    inclusions: [
      '6 nights luxury overwater bungalow',
      'All inter-island boat and catamaran transfers',
      'Full gourmet Polynesian dining'
    ],
    exclusions: ['International long-haul flights'],
    availability: ['Year-round 2026'],
    is_published: true,
    created_at: '2026-01-19T10:00:00Z',
    updated_at: '2026-01-19T10:00:00Z',
    destination: INITIAL_DESTINATIONS[11]
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
    firebase_uid: 'demo-user-1',
    package_id: 'p1',
    destination_name: 'Zen Sanctuaries & Imperial Kyoto',
    destination_location: 'Japan',
    destination_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    travel_date: '2026-10-15',
    travelers: 2,
    guests: 2,
    total_amount: 4998,
    total_price: 4998,
    status: 'confirmed',
    pnr_code: 'VG-94821',
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
    firebase_uid: 'demo-user-2',
    package_id: 'p2',
    destination_name: 'Amalfi Coastline Luxury Yacht & Villas',
    destination_location: 'Italy',
    destination_image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    travel_date: '2026-07-20',
    travelers: 2,
    guests: 2,
    total_amount: 6500,
    total_price: 6500,
    status: 'pending',
    pnr_code: 'VG-83210',
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
