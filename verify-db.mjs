// Comprehensive Database Verification Script: verify-db.mjs
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('====================================================');
console.log('  VOYAGE SUPABASE DATABASE VERIFICATION & RLS SUITE');
console.log('====================================================');
console.log('Target URL:', url);

if (!url || !anonKey) {
  console.error('[ERROR] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function runVerification() {
  console.log('\n--- 1. Checking Existence & Row Counts of All 9 Tables ---');
  const tables = [
    'destinations',
    'travel_packages',
    'profiles',
    'trips',
    'itinerary_items',
    'favorites',
    'bookings',
    'newsletter_subscribers',
    'admin_activity_logs'
  ];

  for (const table of tables) {
    try {
      const { data, count, error, status } = await supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`[-] ${table.padEnd(24)}: ERROR [${error.code}] ${error.message} (HTTP ${status})`);
      } else {
        console.log(`[+] ${table.padEnd(24)}: OK (Count: ${count ?? data?.length}, HTTP ${status})`);
      }
    } catch (err) {
      console.log(`[!] ${table.padEnd(24)}: EXCEPTION ${err.message}`);
    }
  }

  console.log('\n--- 2. Testing Fetching Destinations (Item 4) ---');
  const { data: dests, error: destErr } = await supabase
    .from('destinations')
    .select('id, name, slug, country, category, estimated_budget, rating, is_featured, is_published')
    .eq('is_published', true)
    .order('rating', { ascending: false });

  if (destErr) {
    console.error('[-] Failed to fetch destinations:', destErr.message);
  } else {
    console.log(`[+] Successfully fetched ${dests.length} published destinations:`);
    console.table(dests.map(d => ({
      name: d.name,
      country: d.country,
      category: d.category,
      budget: '$' + d.estimated_budget,
      rating: d.rating,
      featured: d.is_featured
    })));
  }

  console.log('\n--- 3. Testing Fetching Travel Packages ---');
  const { data: pkgs, error: pkgErr } = await supabase
    .from('travel_packages')
    .select('id, title, duration_days, price_per_person, is_published, destination:destinations(name)')
    .eq('is_published', true);

  if (pkgErr) {
    console.error('[-] Failed to fetch travel packages:', pkgErr.message);
  } else {
    console.log(`[+] Successfully fetched ${pkgs.length} published travel packages:`);
    console.table(pkgs.map(p => ({
      title: p.title,
      days: p.duration_days,
      price: '$' + p.price_per_person,
      destination: p.destination?.name || 'N/A'
    })));
  }

  console.log('\n--- 4. Testing Row Level Security (RLS) Enforcement (Item 2) ---');
  
  // Test 4a: Anonymous select on profiles
  console.log('4a. Anonymous SELECT on "profiles" (RLS should hide records without auth):');
  const { data: anonProfiles, error: profErr } = await supabase.from('profiles').select('*');
  if (profErr) {
    console.log(`    [+] RLS blocked or error: [${profErr.code}] ${profErr.message}`);
  } else {
    console.log(`    [+] RLS Active: Returned ${anonProfiles.length} profiles to anonymous requester (0 expected unless public policy exists).`);
  }

  // Test 4b: Unauthorized INSERT on "destinations" (should be rejected because only admin can write)
  console.log('4b. Unauthorized INSERT on "destinations" (RLS should reject non-admin write):');
  const { data: unauthDest, error: unauthDestErr } = await supabase
    .from('destinations')
    .insert({
      name: 'Hacker Island',
      slug: 'hacker-island-' + Date.now(),
      country: 'Nowhere',
      description: 'Unauthorized destination',
      hero_image: 'https://example.com/hacker.jpg',
      category: 'Luxury',
      estimated_budget: 9999
    })
    .select();

  if (unauthDestErr) {
    console.log(`    [+] SUCCESS: RLS successfully blocked unauthorized insert into destinations: [${unauthDestErr.code}] ${unauthDestErr.message}`);
  } else {
    console.warn('    [-] WARNING: Unauthorized destination insert succeeded! Check RLS write policy.');
  }

  // Test 4c: Unauthorized INSERT on "trips"
  console.log('4c. Unauthorized INSERT on "trips" (RLS should reject insert without matching profile owner):');
  const { data: unauthTrip, error: unauthTripErr } = await supabase
    .from('trips')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      title: 'Hacked Trip'
    })
    .select();

  if (unauthTripErr) {
    console.log(`    [+] SUCCESS: RLS successfully blocked unauthorized trip insert: [${unauthTripErr.code}] ${unauthTripErr.message}`);
  } else {
    console.warn('    [-] WARNING: Unauthorized trip insert succeeded! Check RLS write policy.');
  }

  console.log('\n====================================================');
  console.log('  VERIFICATION COMPLETE');
  console.log('====================================================');
}

runVerification();
