import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseConfigured = Boolean(
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) &&
    (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  );

  const firebaseConfigured = Boolean(
    (process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY) &&
    (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  );

  res.status(200).json({
    status: 'ok',
    service: 'VOYAGE Production API',
    runtime: 'Vercel Serverless Function',
    timestamp: new Date().toISOString(),
    supabaseConfigured,
    firebaseConfigured,
  });
}
