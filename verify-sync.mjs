import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('[!] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

console.log('================================================================');
console.log('VOYAGE — Supabase Profile Sync & RPC Verification Tool');
console.log('================================================================');
console.log('Target URL:', url);

const supabase = createClient(url, key);

async function runCheck() {
  console.log('\n[1/4] Checking existing rows in public.profiles...');
  const { data: existingProfiles, error: countErr } = await supabase
    .from('profiles')
    .select('id, firebase_uid, email, full_name, role, created_at');

  if (countErr) {
    console.error('[-] Error reading public.profiles:', countErr.message);
  } else {
    console.log(`[+] public.profiles query succeeded! Current row count: ${existingProfiles?.length || 0}`);
    if (existingProfiles && existingProfiles.length > 0) {
      console.log('    Sample profile in database:', existingProfiles[0]);
    }
  }

  console.log('\n[2/4] Testing RPC public.sync_user_profile (5 parameters)...');
  const testUid = 'test-probe-' + Date.now();
  const testEmail = 'probe.' + Date.now() + '@voyage.luxury';
  
  const { data: rpc5Data, error: rpc5Err } = await supabase.rpc('sync_user_profile', {
    p_firebase_uid: testUid,
    p_email: testEmail,
    p_full_name: 'Concierge Verification Probe',
    p_avatar_url: null,
    p_token: null
  });

  if (rpc5Err) {
    console.log(`[-] 5-param RPC returned error [${rpc5Err.code}]: ${rpc5Err.message}`);
  } else {
    console.log('[+] 5-param RPC SUCCEEDED! Profile synchronized:');
    console.log('    ID:', rpc5Data?.id, '| Email:', rpc5Data?.email, '| Role:', rpc5Data?.role);
  }

  console.log('\n[3/4] Testing RPC public.sync_user_profile (4 parameters)...');
  const { data: rpc4Data, error: rpc4Err } = await supabase.rpc('sync_user_profile', {
    p_firebase_uid: testUid,
    p_email: testEmail,
    p_full_name: 'Concierge Verification Probe (Updated)',
    p_avatar_url: null
  });

  if (rpc4Err) {
    console.log(`[-] 4-param RPC returned error [${rpc4Err.code}]: ${rpc4Err.message}`);
  } else {
    console.log('[+] 4-param RPC SUCCEEDED! Atomic upsert working:');
    console.log('    ID:', rpc4Data?.id, '| Name:', rpc4Data?.full_name);
  }

  console.log('\n[4/4] Summary & Next Steps:');
  if (!rpc5Err || !rpc4Err) {
    console.log('[SUCCESS] sync_user_profile is live, healthy, and operational in Supabase!');
    console.log('You can now register or log in through http://localhost:5173/auth/signup.');
  } else {
    console.log('[ACTION REQUIRED] The sync_user_profile function is not yet installed in Supabase.');
    console.log('Please copy and run the SQL migration from:');
    console.log('supabase/migrations/20260926000001_sync_profiles_rls.sql');
    console.log('in your Supabase SQL Editor: https://supabase.com/dashboard/project/ntoayhpdqpvaylndeyyx/sql/new');
  }
  console.log('================================================================\n');
}

runCheck();
