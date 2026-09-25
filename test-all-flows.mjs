// Script: test-all-flows.mjs
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

console.log('====================================================');
console.log('  VOYAGE END-TO-END SUPABASE VERIFICATION');
console.log('====================================================\n');

async function main() {
  // Test 1: Check destinations
  console.log('1. Checking destinations table...');
  const { data: dests, error: destErr } = await supabase.from('destinations').select('*').limit(3);
  if (destErr) {
    console.log('[-] Destination fetch error:', destErr);
  } else {
    console.log(`[+] Fetched ${dests.length} destinations successfully. First destination: "${dests[0]?.name}" (${dests[0]?.country})`);
  }

  // Test 2: Check travel packages
  console.log('\n2. Checking travel_packages table...');
  const { data: pkgs, error: pkgErr } = await supabase.from('travel_packages').select('*, destination:destinations(name)').limit(3);
  if (pkgErr) {
    console.log('[-] Packages fetch error:', pkgErr);
  } else {
    console.log(`[+] Fetched ${pkgs.length} packages successfully. First package: "${pkgs[0]?.title}" for ${pkgs[0]?.destination?.name}`);
  }

  // Test 3: Profile operations under current RLS
  console.log('\n3. Testing profile lookup by firebase_uid...');
  const testUid = 'test-firebase-uid-' + Date.now();
  const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('firebase_uid', testUid).maybeSingle();
  console.log('    Profile lookup result:', { found: Boolean(prof), error: profErr ? profErr.message : null });

  console.log('    Testing profile creation under current RLS...');
  const { data: insertedProf, error: insProfErr } = await supabase.from('profiles').insert({
    firebase_uid: testUid,
    full_name: 'Julian Vance',
    email: 'julian@voyage.luxury',
    role: 'traveler'
  }).select().single();
  console.log('    Profile insert result:', { 
    success: Boolean(insertedProf), 
    error: insProfErr ? `[${insProfErr.code}] ${insProfErr.message}` : null 
  });

  // Test 4: Trip creation
  console.log('\n4. Testing trip creation under current RLS...');
  const { data: trip, error: tripErr } = await supabase.from('trips').insert({
    user_id: insertedProf?.id || '00000000-0000-0000-0000-000000000000',
    title: 'Autumn in Kyoto',
    destination_id: dests?.[0]?.id || null,
    travelers: 2,
    budget: 3500
  }).select().single();
  console.log('    Trip insert result:', { 
    success: Boolean(trip), 
    error: tripErr ? `[${tripErr.code}] ${tripErr.message}` : null 
  });

  // Test 5: Admin role check
  console.log('\n5. Checking admin permissions...');
  const { data: unauthUpdate, error: unauthUpdateErr } = await supabase
    .from('destinations')
    .update({ name: 'Hacked Destination' })
    .eq('id', dests?.[0]?.id || '00000000-0000-0000-0000-000000000000')
    .select();
  console.log('    Admin destination update protection:', {
    blocked: Boolean(unauthUpdateErr || unauthUpdate?.length === 0),
    error: unauthUpdateErr ? `[${unauthUpdateErr.code}] ${unauthUpdateErr.message}` : 'Protected by 0 rows updated under RLS'
  });
}

main();
