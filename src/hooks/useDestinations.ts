import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Destination } from '../types/database';
import { INITIAL_DESTINATIONS } from '../lib/mockData';

export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDestinations() {
      if (!isSupabaseConfigured) {
        setDestinations(INITIAL_DESTINATIONS);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('destinations')
          .select('*')
          .eq('is_published', true)
          .order('rating', { ascending: false });

        if (err) {
          console.warn('[useDestinations] Remote query error, using fallback seed data:', err.message);
          setDestinations(INITIAL_DESTINATIONS);
        } else if (data && data.length > 0) {
          setDestinations(data as Destination[]);
        } else {
          setDestinations(INITIAL_DESTINATIONS);
        }
      } catch (err: any) {
        console.error('[useDestinations] Unexpected error:', err);
        setError(err.message);
        setDestinations(INITIAL_DESTINATIONS);
      } finally {
        setLoading(false);
      }
    }

    fetchDestinations();
  }, []);

  return { destinations, loading, error };
}

export function useDestination(slug: string | undefined) {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function fetchDestination() {
      setLoading(true);
      if (isSupabaseConfigured) {
        try {
          const { data, error: err } = await supabase
            .from('destinations')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          if (!err && data) {
            setDestination(data as Destination);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[useDestination] Fetch error:', e);
        }
      }

      // Fallback
      const found = INITIAL_DESTINATIONS.find(d => d.slug === slug);
      if (found) {
        setDestination(found);
      } else {
        setError('Destination not found');
      }
      setLoading(false);
    }

    fetchDestination();
  }, [slug]);

  return { destination, loading, error };
}
