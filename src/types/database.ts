export type UserRole = 'traveler' | 'admin';

export type DestinationCategory = 'Adventure' | 'Mountains' | 'Beaches' | 'Cultural' | 'Wildlife' | 'Luxury';

export type TripStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Profile {
  id: string;
  firebase_uid: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  hero_image: string;
  gallery_images: string[];
  category: DestinationCategory;
  estimated_budget: number | null;
  recommended_duration: string | null;
  best_time_to_visit: string | null;
  rating: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TravelPackage {
  id: string;
  destination_id: string;
  title: string;
  description: string;
  duration_days: number;
  price_per_person: number;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  availability: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  destination?: Destination;
}

export interface Trip {
  id: string;
  user_id: string;
  destination_id: string | null;
  title: string;
  start_date: string | null;
  end_date: string | null;
  travelers: number;
  budget: number | null;
  status: TripStatus;
  created_at: string;
  updated_at: string;
  destination?: Destination;
  itinerary_items?: ItineraryItem[];
}

export interface ItineraryItem {
  id: string;
  trip_id: string;
  day_number: number;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  destination_id: string;
  created_at: string;
  destination?: Destination;
}

export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  travel_date: string;
  travelers: number;
  total_amount: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  package?: TravelPackage;
  profile?: Profile;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}
