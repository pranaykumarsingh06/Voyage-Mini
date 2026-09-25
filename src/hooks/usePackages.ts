import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TravelPackage } from '../types/database';
import { INITIAL_PACKAGES } from '../lib/mockData';

export function usePackages(destinationId?: string) {
  const [packages, setPackages] = useState<TravelPackage[]>(INITIAL_PACKAGES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackages() {
      if (!isSupabaseConfigured) {
        const filtered = destinationId 
          ? INITIAL_PACKAGES.filter(p => p.destination_id === destinationId)
          : INITIAL_PACKAGES;
        setPackages(filtered);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let query = supabase
          .from('travel_packages')
          .select('*, destination:destinations(*)')
          .eq('is_published', true);

        if (destinationId) {
          query = query.eq('destination_id', destinationId);
        }

        const { data, error: err } = await query.order('price_per_person', { ascending: true });

        if (err) {
          console.warn('[usePackages] Error querying Supabase packages:', err.message);
          setPackages(INITIAL_PACKAGES);
        } else if (data && data.length > 0) {
          setPackages(data as TravelPackage[]);
        } else {
          setPackages(INITIAL_PACKAGES);
        }
      } catch (err: any) {
        console.error('[usePackages] Unexpected error:', err);
        setError(err.message);
        setPackages(INITIAL_PACKAGES);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, [destinationId]);

  return { packages, loading, error };
}
