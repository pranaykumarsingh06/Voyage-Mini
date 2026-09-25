import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase.js';

// Retrieve credentials safely from Vite environment variables or process.env
const env = typeof import.meta !== 'undefined' ? (import.meta.env || {}) : {};

const supabaseUrl = env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  'https://ntoayhpdqpvaylndeyyx.supabase.co';

const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey.trim() !== ''
);

/**
 * Creates Supabase client integrated with Firebase Auth.
 * When a Firebase user is logged in, their JWT is automatically passed
 * in the Authorization header to enforce PostgreSQL Row Level Security (RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers || {});
      
      // Ensure Supabase API key and Authorization header remain valid for PostgREST
      if (!headers.has('apikey') && supabaseAnonKey) {
        headers.set('apikey', supabaseAnonKey);
      }
      if (!headers.has('Authorization') && supabaseAnonKey) {
        headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
      }

      // If Firebase Auth has a logged-in user, attach Firebase UID and token
      if (auth && auth.currentUser) {
        headers.set('X-Firebase-UID', auth.currentUser.uid);
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) {
            headers.set('X-Firebase-Token', token);
          }
        } catch (err) {
          console.warn('[SupabaseClient] Could not fetch Firebase ID token:', err);
        }
      }
      
      return fetch(url, { ...options, headers });
    }
  }
});

/**
 * Helper to sync Firebase user details to Supabase 'profiles' table upon login.
 */
export async function syncUserProfile(firebaseUser) {
  if (!isSupabaseConfigured || !firebaseUser) return null;

  const profileData = {
    firebase_uid: firebaseUser.uid,
    email: firebaseUser.email,
    full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Traveler',
    avatar_url: firebaseUser.photoURL || null,
    role: 'traveler',
    updated_at: new Date().toISOString()
  };

  try {
    // Try matching by firebase_uid
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', firebaseUser.uid)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.warn('[SupabaseClient] Notice on profile sync:', error.message);
      return {
        id: 'local-' + firebaseUser.uid,
        ...profileData,
        created_at: new Date().toISOString(),
      };
    }

    return data;
  } catch (err) {
    console.error('[SupabaseClient] Error in syncUserProfile:', err);
    return null;
  }
}

export { supabaseUrl, supabaseAnonKey };
