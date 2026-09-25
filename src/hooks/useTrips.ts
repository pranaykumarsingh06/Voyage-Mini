import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Trip, ItineraryItem } from '../types/database';
import { INITIAL_TRIPS } from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';

export function useTrips() {
  const { profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem('voyage_local_trips');
      return saved ? JSON.parse(saved) : INITIAL_TRIPS;
    } catch {
      return INITIAL_TRIPS;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTrips = useCallback(async () => {
    if (!profile?.id || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select('*, destination:destinations(*), itinerary_items(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTrips(data as Trip[]);
        localStorage.setItem('voyage_local_trips', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('[useTrips] Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const createTrip = async (newTrip: Partial<Trip>) => {
    const tripToSave: Trip = {
      id: 'trip-' + Math.random().toString(36).substring(2, 9),
      user_id: profile?.id || 'demo-user',
      destination_id: newTrip.destination_id || null,
      title: newTrip.title || 'Bespoke Journey',
      start_date: newTrip.start_date || null,
      end_date: newTrip.end_date || null,
      travelers: newTrip.travelers || 1,
      budget: newTrip.budget || null,
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      itinerary_items: [],
      ...newTrip,
    } as Trip;

    // Remote Supabase insert if logged in
    if (isSupabaseConfigured && profile?.id) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .insert({
            user_id: profile.id,
            destination_id: tripToSave.destination_id,
            title: tripToSave.title,
            start_date: tripToSave.start_date,
            end_date: tripToSave.end_date,
            travelers: tripToSave.travelers,
            budget: tripToSave.budget,
            status: tripToSave.status,
          })
          .select()
          .single();

        if (!error && data) {
          tripToSave.id = data.id;
        }
      } catch (e) {
        console.warn('[useTrips] Remote insert failed, saving locally:', e);
      }
    }

    const updated = [tripToSave, ...trips];
    setTrips(updated);
    localStorage.setItem('voyage_local_trips', JSON.stringify(updated));
    return tripToSave;
  };

  const addItineraryItem = async (tripId: string, item: Omit<ItineraryItem, 'id' | 'trip_id' | 'created_at'>) => {
    const newItem: ItineraryItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      trip_id: tripId,
      ...item,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('itinerary_items')
          .insert({
            trip_id: tripId,
            day_number: item.day_number,
            title: item.title,
            description: item.description,
            location: item.location,
            start_time: item.start_time,
            end_time: item.end_time,
          })
          .select()
          .single();

        if (!error && data) {
          newItem.id = data.id;
        }
      } catch (e) {
        console.warn('[useTrips] Itinerary remote insert failed:', e);
      }
    }

    const updated = trips.map(t => {
      if (t.id === tripId) {
        const items = t.itinerary_items ? [...t.itinerary_items, newItem] : [newItem];
        return { ...t, itinerary_items: items };
      }
      return t;
    });

    setTrips(updated);
    localStorage.setItem('voyage_local_trips', JSON.stringify(updated));
    return newItem;
  };

  const deleteTrip = async (tripId: string) => {
    if (isSupabaseConfigured && profile?.id) {
      try {
        await supabase.from('trips').delete().eq('id', tripId);
      } catch (e) {
        console.warn('[useTrips] Remote delete failed:', e);
      }
    }

    const updated = trips.filter(t => t.id !== tripId);
    setTrips(updated);
    localStorage.setItem('voyage_local_trips', JSON.stringify(updated));
  };

  return {
    trips,
    loading,
    createTrip,
    addItineraryItem,
    deleteTrip,
    refreshTrips: fetchTrips,
  };
}
