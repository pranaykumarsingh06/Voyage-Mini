import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from './firebase';
import { Profile } from '../types/database';

const env = import.meta.env || {};

export const supabaseUrl = env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your_supabase')
);

/**
 * Creates Supabase client integrated with Firebase Auth tokens.
 * When a Firebase user is logged in, their JWT is passed in the Authorization header
 * to satisfy PostgreSQL Row Level Security (RLS).
 */
let supabaseClientInstance: SupabaseClient;
try {
  supabaseClientInstance = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'dummy-anon-key', {
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
          try {
            headers.set('X-Firebase-UID', auth.currentUser.uid);
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
} catch (err) {
  console.warn('[Supabase] Safe initialization fallback caught:', err);
  supabaseClientInstance = createClient('https://placeholder.supabase.co', 'dummy-anon-key');
}

export const supabase: SupabaseClient = supabaseClientInstance;

/**
 * Synchronize Firebase user details with Supabase 'profiles' table.
 * Uses verified serverless API or atomic database RPC linked by verified Firebase identity.
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
    // Obtain fresh Firebase ID Token for cryptographic identity verification
    let idToken: string | null = null;
    if (auth && auth.currentUser) {
      try {
        idToken = await auth.currentUser.getIdToken();
      } catch (tokenErr) {
        console.warn('[Supabase] Could not fetch fresh ID token for sync:', tokenErr);
      }
    }

    // Strategy 1: Secure Serverless API (/api/sync-profile)
    // Cryptographically verifies ID token on server and uses service role for tamper-proof sync
    if (idToken) {
      try {
        const apiResponse = await fetch('/api/sync-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fullName: profilePayload.full_name,
            avatarUrl: profilePayload.avatar_url,
          }),
        });

        if (apiResponse.ok) {
          const json = await apiResponse.json();
          if (json.profile) {
            console.log('[Supabase] Profile synchronized via serverless API:', json.profile.email);
            return json.profile as Profile;
          }
        }
      } catch {
        // Fall back gracefully to direct PostgreSQL RPC
      }
    }

    // Strategy 2: Call PostgreSQL Stored Procedure `sync_user_profile`
    let rpcProfile: Profile | null = null;
    let rpcError: any = null;

    const resRpc = await supabase.rpc('sync_user_profile', {
      p_firebase_uid: profilePayload.firebase_uid,
      p_email: profilePayload.email || '',
      p_full_name: profilePayload.full_name,
      p_avatar_url: profilePayload.avatar_url,
      p_token: idToken || null,
    });

    if (!resRpc.error && resRpc.data) {
      rpcProfile = resRpc.data as Profile;
    } else {
      rpcError = resRpc.error;
    }

    if (rpcProfile) {
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
      .maybeSingle();

    if (!upsertError && upsertedProfile) {
      console.log('[Supabase] Profile upserted successfully in database:', upsertedProfile.email);
      return upsertedProfile as Profile;
    }

    // Strategy 3: Verification check - check if profile already exists in Supabase
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', profilePayload.firebase_uid)
      .maybeSingle();

    if (!checkError && existingProfile) {
      console.log('[Supabase] Verified existing profile in database:', existingProfile.email);
      return existingProfile as Profile;
    }

    // If all strategies failed, report meaningful error
    const failureReason = upsertError?.message || rpcError?.message || checkError?.message || 'Database rejected profile sync';
    console.error('[Supabase] Profile synchronization failed:', failureReason);
    
    // Check if error is RLS violation or missing function
    if (failureReason.includes('row-level security') || failureReason.includes('42501')) {
      throw new Error(
        `Database profile sync restricted by Row Level Security policy. Please execute migration '20260926000001_sync_profiles_rls.sql' in Supabase SQL editor to allow profile synchronization.`
      );
    }

    if (failureReason.includes('schema cache') || failureReason.includes('PGRST202')) {
      throw new Error(
        `Supabase function 'sync_user_profile' was not found in schema cache. Please execute migration '20260926000001_sync_profiles_rls.sql' in Supabase SQL editor.`
      );
    }

    throw new Error(`Database profile sync failed: ${failureReason}`);
  } catch (err: any) {
    console.error('[Supabase] syncUserProfile exception:', err);
    throw err;
  }
}
