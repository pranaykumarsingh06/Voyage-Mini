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
      
      // Ensure Supabase API key and Authorization header remain valid for PostgREST
      if (!headers.has('apikey') && supabaseAnonKey) {
        headers.set('apikey', supabaseAnonKey);
      }
      if (!headers.has('Authorization') && supabaseAnonKey) {
        headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
      }

      // Attach Firebase User ID and Token via custom headers
      if (auth && auth.currentUser) {
        headers.set('X-Firebase-UID', auth.currentUser.uid);
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) {
            headers.set('X-Firebase-Token', token);
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
 * Uses atomic upsert linked by Firebase UID.
 */
export async function syncUserProfile(firebaseUser: { 
  uid: string; 
  email: string | null; 
  displayName: string | null; 
  photoURL: string | null 
}): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase] Supabase is not configured. Skipping remote profile sync.');
    return null;
  }

  if (!firebaseUser || !firebaseUser.uid) {
    throw new Error('Cannot sync user profile: Firebase UID is missing.');
  }

  const profilePayload = {
    firebase_uid: firebaseUser.uid,
    email: firebaseUser.email,
    full_name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Traveler'),
    avatar_url: firebaseUser.photoURL || null,
    updated_at: new Date().toISOString()
  };

  try {
    // Strategy 1: Call PostgreSQL Stored Procedure `sync_user_profile` (SECURITY DEFINER)
    const { data: rpcProfile, error: rpcError } = await supabase.rpc('sync_user_profile', {
      p_firebase_uid: profilePayload.firebase_uid,
      p_email: profilePayload.email || '',
      p_full_name: profilePayload.full_name,
      p_avatar_url: profilePayload.avatar_url
    });

    if (!rpcError && rpcProfile) {
      console.log('[Supabase] Profile synchronized via RPC successfully:', rpcProfile.email);
      return rpcProfile as Profile;
    }

    if (rpcError) {
      console.warn('[Supabase] RPC sync_user_profile notice:', rpcError.message);
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
      .single();

    if (!upsertError && upsertedProfile) {
      console.log('[Supabase] Profile upserted successfully in database:', upsertedProfile.email);
      return upsertedProfile as Profile;
    }

    // If both direct upsert and RPC failed, report meaningful error
    const failureReason = upsertError?.message || rpcError?.message || 'Unknown database error';
    console.error('[Supabase] Profile synchronization failed:', failureReason);
    
    // Check if error is RLS violation
    if (failureReason.includes('row-level security') || failureReason.includes('42501')) {
      throw new Error(
        `Database profile sync restricted by Row Level Security policy. Please execute migration '20260926000001_sync_profiles_rls.sql' in Supabase SQL editor.`
      );
    }

    throw new Error(`Database profile sync failed: ${failureReason}`);
  } catch (err: any) {
    console.error('[Supabase] syncUserProfile exception:', err);
    throw err;
  }
}
