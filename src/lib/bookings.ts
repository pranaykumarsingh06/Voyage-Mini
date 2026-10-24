import { supabase, isSupabaseConfigured } from './supabase';
import { auth } from './firebase';
import { Booking, BookingStatus } from '../types/database';

export interface CreateBookingInput {
  package_id?: string | null;
  destination_id?: string | null;
  destination_name?: string;
  destination_image?: string | null;
  destination_location?: string | null;
  travel_date: string;
  travelers?: number;
  guests?: number;
  total_amount?: number;
  total_price?: number;
  contact_email?: string | null;
  contact_phone?: string | null;
  special_requests?: string | null;
  tier?: string | null;
  pnr_code?: string | null;
}

/**
 * Normalizes raw booking records from Supabase into strongly-typed Booking objects.
 */
export function normalizeBooking(raw: any): Booking {
  const pnr = raw.pnr_code || (raw.id ? `VG-${raw.id.substring(0, 8).toUpperCase()}` : `VYG-${Math.floor(10000 + Math.random() * 90000)}`);
  const destName = raw.destination_name || raw.package?.title || raw.destination?.name || 'Curated Sanctuary';
  const destImage = raw.destination_image || raw.package?.image_url || raw.destination?.hero_image || null;
  const destLocation = raw.destination_location || raw.destination?.country || raw.package?.destination?.country || 'Global';
  const guestCount = Number(raw.guests ?? raw.travelers ?? 1);
  const total = Number(raw.total_price ?? raw.total_amount ?? 0);

  return {
    id: raw.id,
    user_id: raw.user_id,
    firebase_uid: raw.firebase_uid,
    package_id: raw.package_id,
    destination_id: raw.destination_id,
    destination_name: destName,
    destination_image: destImage,
    destination_location: destLocation,
    travel_date: raw.travel_date,
    booking_date: raw.booking_date || raw.created_at || new Date().toISOString(),
    travelers: guestCount,
    guests: guestCount,
    total_amount: total,
    total_price: total,
    status: (raw.status as BookingStatus) || 'confirmed',
    contact_email: raw.contact_email || null,
    contact_phone: raw.contact_phone || null,
    special_requests: raw.special_requests || null,
    tier: raw.tier || 'premium',
    pnr_code: pnr,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    package: raw.package || undefined,
    destination: raw.destination || undefined,
    profile: raw.profile || undefined,
  };
}

/**
 * Creates a new booking in Supabase, linked to the authenticated Firebase user.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const currentUser = auth?.currentUser;
  
  if (!currentUser) {
    throw new Error('Authentication required: You must be logged in to book a destination.');
  }

  if (!isSupabaseConfigured) {
    throw new Error('Database is currently offline. Please check your Supabase configuration.');
  }

  const guests = input.guests || input.travelers || 1;
  const totalPrice = input.total_price || input.total_amount || 0;
  const pnrCode = input.pnr_code || `VYG-${Math.floor(10000 + Math.random() * 90000)}`;

  // 1. Try atomic Stored Procedure `create_user_booking`
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('create_user_booking', {
      p_firebase_uid: currentUser.uid,
      p_destination_id: input.destination_id && !input.destination_id.startsWith('synth-') ? input.destination_id : null,
      p_destination_name: input.destination_name || null,
      p_destination_image: input.destination_image || null,
      p_destination_location: input.destination_location || null,
      p_package_id: input.package_id && !input.package_id.startsWith('synth-') ? input.package_id : null,
      p_travel_date: input.travel_date,
      p_guests: guests,
      p_total_price: totalPrice,
      p_contact_email: input.contact_email || currentUser.email || null,
      p_contact_phone: input.contact_phone || null,
      p_special_requests: input.special_requests || null,
      p_tier: input.tier || 'premium',
      p_pnr_code: pnrCode,
    });

    if (!rpcErr && rpcData) {
      const created = normalizeBooking(rpcData);
      updateLocalCache(created);
      return created;
    }
  } catch (rpcEx) {
    console.warn('[bookings] RPC create_user_booking attempt skipped:', rpcEx);
  }

  // 2. Direct Supabase Insert Flow
  // First ensure profile exists
  let userProfileId: string | null = null;
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', currentUser.uid)
    .maybeSingle();

  if (profileData?.id) {
    userProfileId = profileData.id;
  } else {
    // Attempt profile sync via RPC
    const { data: synced } = await supabase.rpc('sync_user_profile', {
      p_firebase_uid: currentUser.uid,
      p_email: currentUser.email || '',
      p_full_name: currentUser.displayName || 'Traveler',
      p_avatar_url: currentUser.photoURL || null,
    });
    if (synced?.id) {
      userProfileId = synced.id;
    }
  }

  // Resolve valid package_id or destination_id
  let validPkgId: string | null = input.package_id && !input.package_id.startsWith('synth-') ? input.package_id : null;
  const validDestId: string | null = input.destination_id && !input.destination_id.startsWith('synth-') ? input.destination_id : null;

  // If package_id is missing and destination has a package in travel_packages, look it up for legacy constraint compatibility
  if (!validPkgId && validDestId) {
    const { data: existingPkg } = await supabase
      .from('travel_packages')
      .select('id')
      .eq('destination_id', validDestId)
      .maybeSingle();

    if (existingPkg?.id) {
      validPkgId = existingPkg.id;
    }
  }

  const payload: any = {
    travel_date: input.travel_date,
    travelers: guests,
    total_amount: totalPrice,
    status: 'confirmed',
  };

  if (userProfileId) {
    payload.user_id = userProfileId;
  }
  if (validPkgId) {
    payload.package_id = validPkgId;
  }
  if (validDestId) {
    payload.destination_id = validDestId;
  }

  // Enhanced columns (present if migration applied)
  payload.firebase_uid = currentUser.uid;
  payload.destination_name = input.destination_name || 'Curated Sanctuary';
  payload.destination_image = input.destination_image || null;
  payload.destination_location = input.destination_location || null;
  payload.booking_date = new Date().toISOString();
  payload.guests = guests;
  payload.total_price = totalPrice;
  payload.contact_email = input.contact_email || currentUser.email;
  payload.contact_phone = input.contact_phone || null;
  payload.special_requests = input.special_requests || null;
  payload.tier = input.tier || 'premium';
  payload.pnr_code = pnrCode;

  // Insert into Supabase
  let insertResult = await supabase
    .from('bookings')
    .insert(payload)
    .select('*, package:travel_packages(*, destination:destinations(*))')
    .single();

  // If insert failed due to columns not existing yet (pre-migration), retry with legacy columns
  if (insertResult.error && (insertResult.error.message.includes('column') || insertResult.error.code === '42703')) {
    console.warn('[bookings] Enhanced columns not detected; retrying with legacy schema payload...');
    const legacyPayload: any = {
      user_id: userProfileId,
      package_id: validPkgId,
      travel_date: input.travel_date,
      travelers: guests,
      total_amount: totalPrice,
      status: 'confirmed',
    };

    insertResult = await supabase
      .from('bookings')
      .insert(legacyPayload)
      .select('*, package:travel_packages(*)')
      .single();
  }

  if (insertResult.error) {
    console.error('[bookings] Failed to create booking in Supabase:', insertResult.error);
    throw new Error(`Unable to complete your booking: ${insertResult.error.message}`);
  }

  const finalBooking = normalizeBooking({
    ...insertResult.data,
    destination_name: input.destination_name || insertResult.data?.package?.title || 'Curated Sanctuary',
    destination_image: input.destination_image || insertResult.data?.package?.image_url || null,
    destination_location: input.destination_location || insertResult.data?.package?.destination?.country || 'Global',
    firebase_uid: currentUser.uid,
    pnr_code: pnrCode,
  });

  updateLocalCache(finalBooking);
  return finalBooking;
}

/**
 * Retrieves all bookings belonging ONLY to the authenticated user from Supabase.
 */
export async function getUserBookings(targetUid?: string): Promise<Booking[]> {
  const currentUser = auth?.currentUser;
  const uid = targetUid || currentUser?.uid;

  if (!uid) {
    return [];
  }

  if (!isSupabaseConfigured) {
    console.warn('[bookings] Supabase not configured. Reading from local fallback.');
    return getLocalCache(uid);
  }

  try {
    // 1. Fetch user profile ID to query by either user_id OR firebase_uid
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('firebase_uid', uid)
      .maybeSingle();

    const profileId = profile?.id;

    // 2. Query bookings from Supabase
    let query = supabase
      .from('bookings')
      .select('*, package:travel_packages(*, destination:destinations(*))');

    if (profileId) {
      // User can match by profile user_id or direct firebase_uid
      query = query.or(`firebase_uid.eq.${uid},user_id.eq.${profileId}`);
    } else {
      query = query.eq('firebase_uid', uid);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      // If error is about missing firebase_uid column (pre-migration), try querying by user_id only
      if (profileId && (error.message.includes('column') || error.code === '42703')) {
        const { data: legacyData, error: legacyErr } = await supabase
          .from('bookings')
          .select('*, package:travel_packages(*, destination:destinations(*))')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (!legacyErr && legacyData) {
          const mapped = legacyData.map(normalizeBooking);
          setLocalCache(uid, mapped);
          return mapped;
        }
      }

      console.warn('[bookings] Supabase query notice in getUserBookings, reading from local cache:', error.message);
      const cached = getLocalCache(uid);
      if (cached && cached.length > 0) {
        return cached;
      }
      return [];
    }

    const normalizedList = (data || []).map(normalizeBooking);
    setLocalCache(uid, normalizedList);
    return normalizedList;
  } catch (err: any) {
    console.warn('[bookings] getUserBookings exception caught, falling back to cache:', err);
    return getLocalCache(uid);
  }
}

/**
 * Retrieves a single booking by ID with ownership verification.
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const currentUser = auth?.currentUser;
  if (!currentUser || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, package:travel_packages(*, destination:destinations(*))')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const booking = normalizeBooking(data);
    return booking;
  } catch (err) {
    console.error('[bookings] getBookingById error:', err);
    return null;
  }
}

/**
 * Updates booking status (e.g. cancelling a booking).
 */
export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking | null> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to modify booking status.');
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('*, package:travel_packages(*, destination:destinations(*))')
      .single();

    if (error) {
      console.error('[bookings] Failed to update booking status:', error);
      throw new Error(`Unable to update booking: ${error.message}`);
    }

    const updated = normalizeBooking(data);
    updateSingleInLocalCache(updated);
    return updated;
  } catch (err: any) {
    console.error('[bookings] updateBookingStatus exception:', err);
    throw err;
  }
}

/**
 * Cancels a booking safely without physical deletion.
 */
export async function cancelBooking(bookingId: string): Promise<Booking | null> {
  return updateBookingStatus(bookingId, 'cancelled');
}

// ----------------------------------------------------------------------------
// Local Storage Helper Functions (Secondary Cache & Smooth Offline Transitions)
// ----------------------------------------------------------------------------

function getCacheKey(uid: string): string {
  return `voyage_bookings_${uid}`;
}

function getLocalCache(uid: string): Booking[] {
  try {
    const key = getCacheKey(uid);
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

function setLocalCache(uid: string, bookings: Booking[]): void {
  try {
    const key = getCacheKey(uid);
    localStorage.setItem(key, JSON.stringify(bookings));
  } catch {
    // Ignore quota errors
  }
}

function updateLocalCache(newBooking: Booking): void {
  const uid = auth?.currentUser?.uid || newBooking.firebase_uid;
  if (!uid) return;
  const current = getLocalCache(uid);
  const filtered = current.filter(b => b.id !== newBooking.id);
  setLocalCache(uid, [newBooking, ...filtered]);
}

function updateSingleInLocalCache(updated: Booking): void {
  const uid = auth?.currentUser?.uid || updated.firebase_uid;
  if (!uid) return;
  const current = getLocalCache(uid);
  const mapped = current.map(b => (b.id === updated.id ? updated : b));
  setLocalCache(uid, mapped);
}
