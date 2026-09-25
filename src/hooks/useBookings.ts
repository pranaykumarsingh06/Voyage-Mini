import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Booking, BookingStatus } from '../types/database';
import { INITIAL_BOOKINGS } from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';

export function useBookings() {
  const { profile, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('voyage_bookings');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchBookings() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let query = supabase
          .from('bookings')
          .select('*, package:travel_packages(*), profile:profiles(*)');

        if (!isAdmin && profile?.id) {
          query = query.eq('user_id', profile.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          setBookings(data as Booking[]);
          localStorage.setItem('voyage_bookings', JSON.stringify(data));
        }
      } catch (e) {
        console.warn('[useBookings] Error loading bookings:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [profile?.id, isAdmin]);

  const createBooking = async (bookingData: {
    package_id: string;
    travel_date: string;
    travelers: number;
    total_amount: number;
  }) => {
    const newBooking: Booking = {
      id: 'book-' + Math.random().toString(36).substring(2, 9),
      user_id: profile?.id || 'guest-user',
      package_id: bookingData.package_id,
      travel_date: bookingData.travel_date,
      travelers: bookingData.travelers,
      total_amount: bookingData.total_amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && profile?.id) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert({
            user_id: profile.id,
            package_id: bookingData.package_id,
            travel_date: bookingData.travel_date,
            travelers: bookingData.travelers,
            total_amount: bookingData.total_amount,
            status: 'pending',
          })
          .select('*, package:travel_packages(*)')
          .single();

        if (!error && data) {
          newBooking.id = data.id;
        }
      } catch (e) {
        console.warn('[useBookings] Remote booking insert error:', e);
      }
    }

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem('voyage_bookings', JSON.stringify(updated));
    return newBooking;
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('bookings')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', bookingId);
      } catch (e) {
        console.warn('[useBookings] Remote update error:', e);
      }
    }

    const updated = bookings.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b));
    setBookings(updated);
    localStorage.setItem('voyage_bookings', JSON.stringify(updated));
  };

  return {
    bookings,
    loading,
    createBooking,
    updateBookingStatus,
  };
}
