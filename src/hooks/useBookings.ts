import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus } from '../types/database';
import { 
  getUserBookings, 
  createBooking as createBookingApi, 
  updateBookingStatus as updateStatusApi,
  cancelBooking as cancelBookingApi,
  CreateBookingInput
} from '../lib/bookings';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

// Simple global event emitter for instant multi-component reactivity across tabs/components
const BOOKINGS_UPDATED_EVENT = 'voyage_bookings_updated';

export function notifyBookingsUpdated() {
  window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
}

export function useBookings() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeUid = user?.uid || auth?.currentUser?.uid || profile?.firebase_uid;

  const fetchBookings = useCallback(async () => {
    if (!activeUid) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserBookings(activeUid);
      setBookings(data);
    } catch (err: any) {
      console.error('[useBookings] fetchBookings error:', err);
      setError(err?.message || 'Unable to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [activeUid]);

  useEffect(() => {
    fetchBookings();

    const handleUpdate = () => {
      fetchBookings();
    };

    window.addEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
    };
  }, [fetchBookings]);

  const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
    try {
      const newBooking = await createBookingApi(input);
      // Immediately update local state
      setBookings(prev => [newBooking, ...prev.filter(b => b.id !== newBooking.id)]);
      notifyBookingsUpdated();
      return newBooking;
    } catch (err: any) {
      console.error('[useBookings] createBooking failed:', err);
      throw err;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus): Promise<Booking | null> => {
    try {
      const updated = await updateStatusApi(bookingId, status);
      if (updated) {
        setBookings(prev => prev.map(b => (b.id === bookingId ? updated : b)));
        notifyBookingsUpdated();
      }
      return updated;
    } catch (err: any) {
      console.error('[useBookings] updateBookingStatus failed:', err);
      throw err;
    }
  };

  const cancelBooking = async (bookingId: string): Promise<Booking | null> => {
    return updateBookingStatus(bookingId, 'cancelled');
  };

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    refreshBookings: fetchBookings,
  };
}
