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
 * Uses atomic upsert linked by Firebase UID.
 */
export async function syncUserProfile(firebaseUser) {
  if (!isSupabaseConfigured || !firebaseUser || !firebaseUser.uid) {
    return null;
  }

  const profilePayload = {
    firebase_uid: firebaseUser.uid,
    email: firebaseUser.email,
    full_name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Traveler'),
    avatar_url: firebaseUser.photoURL || null,
    updated_at: new Date().toISOString()
  };

    // Obtain fresh Firebase ID Token for cryptographic identity verification in PostgreSQL
    let idToken = null;
    if (auth && auth.currentUser) {
      try {
        idToken = await auth.currentUser.getIdToken();
      } catch (tokenErr) {
        console.warn('[SupabaseClient] Could not fetch fresh ID token for sync:', tokenErr);
      }
    }

    // Strategy 1A: Stored Procedure sync_user_profile (5 parameters with token)
    let rpcProfile = null;
    let rpcError = null;

    if (idToken) {
      const res5 = await supabase.rpc('sync_user_profile', {
        p_firebase_uid: profilePayload.firebase_uid,
        p_email: profilePayload.email || '',
        p_full_name: profilePayload.full_name,
        p_avatar_url: profilePayload.avatar_url,
        p_token: idToken,
      });
      if (!res5.error && res5.data) {
        rpcProfile = res5.data;
      } else {
        rpcError = res5.error;
      }
    }

    // Strategy 1B: Try 4-parameter RPC signature
    if (!rpcProfile) {
      const res4 = await supabase.rpc('sync_user_profile', {
        p_firebase_uid: profilePayload.firebase_uid,
        p_email: profilePayload.email || '',
        p_full_name: profilePayload.full_name,
        p_avatar_url: profilePayload.avatar_url,
      });
      if (!res4.error && res4.data) {
        rpcProfile = res4.data;
      } else if (!rpcError) {
        rpcError = res4.error;
      }
    }

    if (rpcProfile) {
      console.log('[SupabaseClient] Profile synchronized via RPC:', rpcProfile.email);
      return rpcProfile;
    }

    if (rpcError) {
      console.warn('[SupabaseClient] RPC sync notice:', rpcError.message);
    }

    // Strategy 2: Direct Supabase client Upsert (ON CONFLICT firebase_uid)
    const { data: upsertedProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          ...profilePayload,
          role: 'traveler'
        },
        { onConflict: 'firebase_uid' }
      )
      .select()
      .maybeSingle();

    if (!upsertError && upsertedProfile) {
      console.log('[SupabaseClient] Profile upserted successfully in database:', upsertedProfile.email);
      return upsertedProfile;
    }

    // Strategy 3: Verification check
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', profilePayload.firebase_uid)
      .maybeSingle();

    if (!checkError && existingProfile) {
      console.log('[SupabaseClient] Verified existing profile in database:', existingProfile.email);
      return existingProfile;
    }

    const failureReason = upsertError?.message || rpcError?.message || checkError?.message || 'Database sync failed';
    console.error('[SupabaseClient] Profile synchronization failed:', failureReason);

    if (failureReason.includes('row-level security') || failureReason.includes('42501')) {
      throw new Error(
        `Database profile sync restricted by Row Level Security policy. Please execute migration '20260926000001_sync_profiles_rls.sql' in Supabase SQL editor.`
      );
    }

    if (failureReason.includes('schema cache') || failureReason.includes('PGRST202')) {
      throw new Error(
        `Supabase function 'sync_user_profile' was not found in schema cache. Please execute migration '20260926000001_sync_profiles_rls.sql' in Supabase SQL editor.`
      );
    }

    throw new Error(`Database profile sync failed: ${failureReason}`);
  } catch (err) {
    console.error('[SupabaseClient] Error in syncUserProfile:', err);
    throw err;
  }
}

export { supabaseUrl, supabaseAnonKey };
