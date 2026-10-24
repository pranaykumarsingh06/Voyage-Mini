import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

// Cache remote JWKS for Google's Firebase Auth RS256 public keys
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or malformed Bearer token in Authorization header.'
    });
  }

  const idToken = authHeader.substring(7).trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Empty token provided.' });
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error: Supabase credentials not configured.' });
  }

  try {
    // 1. Cryptographically verify the Firebase ID Token using Google's JWKS
    let verifiedUid = '';
    let verifiedEmail: string | null = null;
    let verifiedName: string | null = null;
    let verifiedAvatar: string | null = null;

    if (projectId) {
      const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

      verifiedUid = payload.sub as string;
      verifiedEmail = (payload.email as string) || null;
      verifiedName = (payload.name as string) || null;
      verifiedAvatar = (payload.picture as string) || null;
    } else {
      // If projectId is not set on the server, verify using Google JWKS without strict audience check
      const { payload } = await jwtVerify(idToken, GOOGLE_JWKS);
      verifiedUid = payload.sub as string;
      verifiedEmail = (payload.email as string) || null;
      verifiedName = (payload.name as string) || null;
      verifiedAvatar = (payload.picture as string) || null;
    }

    if (!verifiedUid) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload, subject UID missing.' });
    }

    // 2. Extract client payload overrides (e.g. custom full_name or avatar)
    const { fullName, avatarUrl } = req.body || {};
    const finalName = fullName || verifiedName || (verifiedEmail ? verifiedEmail.split('@')[0] : 'Traveler');
    const finalAvatar = avatarUrl || verifiedAvatar || null;

    // 3. Connect to Supabase to securely synchronize profile
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If using service role key, we perform direct atomic upsert preserving role
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Check existing role to prevent demotion or elevation
      const { data: existing } = await supabase
        .from('profiles')
        .select('role')
        .eq('firebase_uid', verifiedUid)
        .maybeSingle();

      const userRole = existing?.role || 'traveler';

      const { data: profile, error: dbErr } = await supabase
        .from('profiles')
        .upsert(
          {
            firebase_uid: verifiedUid,
            email: verifiedEmail,
            full_name: finalName,
            avatar_url: finalAvatar,
            role: userRole,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'firebase_uid' }
        )
        .select()
        .single();

      if (dbErr) {
        return res.status(500).json({ error: `Database error: ${dbErr.message}` });
      }

      return res.status(200).json({ success: true, profile });
    }

    // Otherwise, call the secure PostgreSQL RPC function passing the verified token
    const { data: rpcData, error: rpcErr } = await supabase.rpc('sync_user_profile', {
      p_firebase_uid: verifiedUid,
      p_email: verifiedEmail || '',
      p_full_name: finalName,
      p_avatar_url: finalAvatar,
      p_token: idToken,
    });

    if (rpcErr) {
      return res.status(500).json({ error: `Profile sync RPC error: ${rpcErr.message}` });
    }

    return res.status(200).json({ success: true, profile: rpcData });
  } catch (err: any) {
    console.error('[API sync-profile] Error:', err);
    return res.status(401).json({
      error: 'Cryptographic authentication verification failed.',
      details: err.message
    });
  }
}
