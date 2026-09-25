// Database connection tester for VOYAGE
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('--------------------------------------------------');
console.log('VOYAGE - Testing Supabase Connection');
console.log('--------------------------------------------------');
console.log('Project URL :', url || '(NOT SET)');
console.log('Anon/API Key:', key ? `${key.substring(0, 10)}...${key.slice(-5)}` : '(NOT SET)');
console.log('--------------------------------------------------');

if (!url || !key || key.trim() === '') {
  console.error('\x1b[31m[ERROR]\x1b[0m Supabase URL or Anon Key is missing.');
  console.log('Please provide your SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  try {
    console.log('Querying Supabase "destinations" table...');
    const { data, error, status } = await supabase
      .from('destinations')
      .select('id, name, country, rating')
      .limit(3);

    if (error) {
      if (status === 404 || error.code === '42P01') {
        console.log('\x1b[33m[NOTICE]\x1b[0m Connected to Supabase, but the "destinations" table does not exist yet.');
        console.log('Please apply the migration file in supabase/migrations/20260925205500_create_voyage_schema.sql in the Supabase Dashboard SQL Editor.');
        process.exit(0);
      }
      console.error('\x1b[31m[ERROR]\x1b[0m Query failed:', error.message);
      process.exit(1);
    }

    console.log('\x1b[32m[SUCCESS]\x1b[0m Database connection verified successfully! HTTP Status:', status);
    console.log('Sample rows returned:', data);
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m[ERROR]\x1b[0m Unexpected error while querying database:', err.message);
    process.exit(1);
  }
}

testConnection();
