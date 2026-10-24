import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TravelPackage } from '../types/database';
import { INITIAL_PACKAGES, INITIAL_DESTINATIONS } from '../lib/mockData';

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
          // Enrich Supabase packages with destination metadata if relationship wasn't populated
          const enrichedDb = (data as TravelPackage[]).map((pkg) => {
            if (!pkg.destination || !pkg.destination.hero_image) {
              const matched = INITIAL_DESTINATIONS.find(
                d => d.id === pkg.destination_id || d.name.toLowerCase() === (pkg.destination?.name || '').toLowerCase()
              );
              if (matched) {
                return { ...pkg, destination: matched };
              }
            }
            return pkg;
          });

          // Ensure comprehensive catalog including initial packages not yet created in remote DB
          const combined = [...enrichedDb];
          for (const initPkg of INITIAL_PACKAGES) {
            const alreadyPresent = combined.some(
              p => p.id === initPkg.id || p.title.toLowerCase() === initPkg.title.toLowerCase()
            );
            if (!alreadyPresent && (!destinationId || initPkg.destination_id === destinationId)) {
              combined.push(initPkg);
            }
          }

          setPackages(combined);
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
