import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';
import { Profile } from '../types/database';

const env = import.meta.env || {};

export const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ntoayhpdqpvaylndeyyx.supabase.co';
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey.trim() !== ''
);

/**
 * Creates Supabase client integrated with Firebase Auth tokens.
 * When a Firebase user is logged in, their JWT is passed in the Authorization header
 * to satisfy PostgreSQL Row Level Security (RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-anon-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers || {});
      
      // Inject Firebase ID token if user is signed in
      if (auth && auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
        } catch (err) {
          console.warn('[Supabase] Could not retrieve fresh Firebase token:', err);
        }
      }
      
      return fetch(url, { ...options, headers });
    },
  },
});

/**
 * Synchronize Firebase user details with Supabase 'profiles' table.
 */
export async function syncUserProfile(firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;

  try {
    // Check if profile exists
    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', firebaseUser.uid)
      .maybeSingle();

    if (existing) {
      return existing as Profile;
    }

    // Insert new profile
    const newProfile = {
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Traveler',
      avatar_url: firebaseUser.photoURL || null,
      role: 'traveler',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Could not sync user profile to remote database:', error.message);
      return {
        id: 'local-' + firebaseUser.uid,
        ...newProfile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile;
    }

    return data as Profile;
  } catch (err) {
    console.error('[Supabase] Sync user profile error:', err);
    return null;
  }
}
