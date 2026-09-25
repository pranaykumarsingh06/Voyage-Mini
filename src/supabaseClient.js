import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase.js';

// Retrieve credentials safely from Vite environment variables or process.env
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  '';

const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey.trim() !== '');

/**
 * Creates Supabase client integrated with Firebase Auth.
 * When a Firebase user is logged in, their JWT is automatically passed
 * in the Authorization header to enforce PostgreSQL Row Level Security (RLS).
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options.headers || {});
          
          // If Firebase Auth has a logged-in user, fetch fresh ID token and pass to Supabase
          if (auth && auth.currentUser) {
            try {
              const token = await auth.currentUser.getIdToken();
              if (token) {
                headers.set('Authorization', `Bearer ${token}`);
              }
            } catch (err) {
              console.warn('[SupabaseClient] Could not fetch Firebase ID token:', err);
            }
          }
          
          return fetch(url, { ...options, headers });
        }
      }
    })
  : null;

/**
 * Helper to sync Firebase user details to Supabase 'profiles' table upon login.
 */
export async function syncUserProfile(firebaseUser) {
  if (!supabase || !firebaseUser) return null;

  const profileData = {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Traveler',
    avatar_url: firebaseUser.photoURL || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[SupabaseClient] Error syncing user profile:', error);
    throw error;
  }

  return data;
}

export { supabaseUrl, supabaseAnonKey };
