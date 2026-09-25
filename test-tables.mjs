import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase Tables on URL:', url);
if (!url || !key) {
  console.error('URL or Key missing!');
  process.exit(1);
}

const supabase = createClient(url, key);

const tables = [
  'profiles', 
  'destinations', 
  'travel_packages', 
  'trips', 
  'itinerary_items', 
  'favorites', 
  'bookings', 
  'newsletter_subscribers', 
  'admin_activity_logs'
];

async function runAudit() {
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`[-] ${table}: NOT FOUND or ERROR [${error.code}] ${error.message} (HTTP ${status})`);
      } else {
        console.log(`[+] ${table}: TABLE EXISTS and QUERYABLE (HTTP ${status})`);
      }
    } catch (err) {
      console.log(`[!] ${table}: EXCEPTION ${err.message}`);
    }
  }
}

runAudit();
