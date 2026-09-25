// Script: server/scripts/create-admin.mjs
// Usage: node server/scripts/create-admin.mjs <user_email_or_firebase_uid>
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const targetIdentifier = process.argv[2];

if (!targetIdentifier) {
  console.error('\x1b[31m[ERROR]\x1b[0m Please provide the user email or Firebase UID:');
  console.log('Usage: node server/scripts/create-admin.mjs <user_email_or_firebase_uid>');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31m[ERROR]\x1b[0m Supabase credentials not found in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteAdmin() {
  console.log(`Promoting "${targetIdentifier}" to administrator...`);

  // Query profile by email or firebase_uid
  let query = supabase
    .from('profiles')
    .update({ role: 'admin', updated_at: new Date().toISOString() });

  if (targetIdentifier.includes('@')) {
    query = query.eq('email', targetIdentifier);
  } else {
    query = query.eq('firebase_uid', targetIdentifier);
  }

  const { data, error } = await query.select();

  if (error) {
    console.error('\x1b[31m[FAIL]\x1b[0m Failed to update user role:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('\x1b[33m[NOTICE]\x1b[0m User was not found in profiles table yet. Creating new pre-authorized admin profile...');
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: targetIdentifier,
        email: targetIdentifier.includes('@') ? targetIdentifier : null,
        full_name: 'Administrator',
        role: 'admin'
      })
      .select()
      .single();

    if (insertErr) {
      console.error('\x1b[31m[FAIL]\x1b[0m Could not create admin record:', insertErr.message);
      process.exit(1);
    }
    console.log('\x1b[32m[SUCCESS]\x1b[0m Admin profile established:', inserted);
  } else {
    console.log('\x1b[32m[SUCCESS]\x1b[0m User successfully granted Administrator clearance:', data[0]);
  }
}

promoteAdmin();
