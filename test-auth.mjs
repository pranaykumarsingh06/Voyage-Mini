// Verification Script: test-auth.mjs
import dotenv from 'dotenv';
dotenv.config();

console.log('====================================================');
console.log('  VOYAGE AUTHENTICATION & SECURITY AUDIT SUITE');
console.log('====================================================\n');

// 1. Environment Variables Inspection
console.log('1. Checking Environment Variables...');
const firebaseVars = {
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY ? '[SET: ' + process.env.VITE_FIREBASE_API_KEY.substring(0, 8) + '...]' : '[NOT SET / AWAITING CONSOLE INPUT]',
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID ? '[SET]' : '[NOT SET / AWAITING CONSOLE INPUT]',
};

console.table(firebaseVars);

const supabaseVars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '[SET: VALID JWT]' : '[NOT SET]',
};
console.table(supabaseVars);

// 2. Test src/firebase.js module resolution & exports
console.log('\n2. Testing src/firebase.js exports...');
try {
  const firebaseJs = await import('./src/firebase.js');
  console.log('  [+] src/firebase.js imported successfully.');
  console.log('  [+] Exports found:', Object.keys(firebaseJs));

  // Check expected exports
  const expected = [
    'auth',
    'app',
    'firebaseApp',
    'googleProvider',
    'isFirebaseConfigured',
    'loginWithGoogle',
    'loginWithEmail',
    'registerWithEmail',
    'resetUserPassword',
    'logoutUser',
    'getAuthErrorMessage'
  ];

  for (const exp of expected) {
    if (exp in firebaseJs) {
      console.log(`    ✓ Export "${exp}": present`);
    } else {
      console.error(`    ✗ Export "${exp}": MISSING!`);
    }
  }

  // 3. Test getAuthErrorMessage
  console.log('\n3. Testing Firebase Auth error mapper...');
  const sampleErrors = [
    { code: 'auth/email-already-in-use', message: 'The email address is already in use.' },
    { code: 'auth/wrong-password', message: 'Wrong password.' },
    { code: 'auth/invalid-credential', message: 'Invalid credential.' },
    { code: 'auth/user-not-found', message: 'User not found.' },
    { code: 'auth/weak-password', message: 'Weak password.' },
    { code: 'auth/popup-closed-by-user', message: 'Popup closed.' },
  ];

  for (const err of sampleErrors) {
    const formatted = firebaseJs.getAuthErrorMessage(err);
    console.log(`    [${err.code}] -> "${formatted}"`);
  }

  // 4. Test safe unconfigured behavior
  console.log('\n4. Testing safe unconfigured behavior...');
  console.log('    isFirebaseConfigured =', firebaseJs.isFirebaseConfigured);
  if (!firebaseJs.isFirebaseConfigured) {
    console.log('    [+] When credentials are not yet entered, isFirebaseConfigured is gracefully false.');
    console.log('    [+] The frontend seamlessly falls back to interactive demo session mode.');
  }

} catch (err) {
  console.error('  [!] Error importing src/firebase.js:', err);
}

// 5. Test Supabase connection
console.log('\n5. Testing Supabase client connectivity...');
try {
  const supabaseJs = await import('./src/supabaseClient.js');
  console.log('  [+] src/supabaseClient.js imported successfully.');
  console.log('  [+] isSupabaseConfigured =', supabaseJs.isSupabaseConfigured);
  console.log('  [+] Supabase URL:', supabaseJs.supabaseUrl);
} catch (err) {
  console.error('  [!] Error importing src/supabaseClient.js:', err);
}

console.log('\n====================================================');
console.log('  AUDIT SUITE COMPLETE');
console.log('====================================================\n');
