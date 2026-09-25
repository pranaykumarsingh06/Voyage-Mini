import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface FavoritesContextType {
  favorites: string[]; // destination IDs
  isFavorite: (destinationId: string) => boolean;
  toggleFavorite: (destinationId: string) => Promise<void>;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voyage_fav_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load user favorites from Supabase when profile changes
  useEffect(() => {
    async function loadRemoteFavorites() {
      if (!isSupabaseConfigured || !profile?.id) return;
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('destination_id')
          .eq('user_id', profile.id);

        if (!error && data) {
          const ids = data.map((f: { destination_id: string }) => f.destination_id);
          setFavorites(ids);
          localStorage.setItem('voyage_fav_ids', JSON.stringify(ids));
        }
      } catch (err) {
        console.warn('[Favorites] Error loading favorites:', err);
      }
    }

    loadRemoteFavorites();
  }, [profile?.id]);

  const isFavorite = (destinationId: string) => {
    return favorites.includes(destinationId);
  };

  const toggleFavorite = async (destinationId: string) => {
    const isCurrentlyFav = favorites.includes(destinationId);
    let updated: string[];

    if (isCurrentlyFav) {
      updated = favorites.filter(id => id !== destinationId);
    } else {
      updated = [...favorites, destinationId];
    }

    setFavorites(updated);
    localStorage.setItem('voyage_fav_ids', JSON.stringify(updated));

    // Sync with Supabase if logged in
    if (isSupabaseConfigured && profile?.id) {
      try {
        if (isCurrentlyFav) {
          await supabase
            .from('favorites')
            .delete()
            .match({ user_id: profile.id, destination_id: destinationId });
        } else {
          await supabase
            .from('favorites')
            .insert({ user_id: profile.id, destination_id: destinationId });
        }
      } catch (e) {
        console.warn('[Favorites] Sync failed:', e);
      }
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        count: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
