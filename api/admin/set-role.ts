import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const idToken = authHeader.substring(7).trim();
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error: Supabase credentials not found.' });
  }

  try {
    // 1. Verify caller's token
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, projectId ? {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    } : undefined);

    const callerUid = payload.sub as string;
    if (!callerUid) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token subject.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Verify caller is an Administrator in database
    const { data: callerProfile, error: callerErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('firebase_uid', callerUid)
      .single();

    if (callerErr || callerProfile?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Caller is not a verified administrator.' });
    }

    // 3. Process role change
    const { userId, role } = req.body || {};
    if (!userId || !['traveler', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid parameters. Require userId and role (traveler | admin).' });
    }

    const { data: targetUser, error: updateErr } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    return res.status(200).json({ success: true, user: targetUser });
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication failed.', details: err.message });
  }
}
