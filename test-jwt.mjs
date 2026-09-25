import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/profiles';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function test() {
  console.log('Testing Supabase REST URL:', url);

  // Test 1: Standard anon request
  const r1 = await fetch(url + '?select=*', {
    headers: {
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey
    }
  });
  console.log('1. Anon request status:', r1.status);
  const data1 = await r1.json();
  console.log('   Data:', data1);

  // Test 2: Custom / Firebase token in Authorization
  const fakeToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZmluYWwtdm95YWdlIiwic3ViIjoidGVzdC11aWQtMTIzIn0.fakeSig';
  const r2 = await fetch(url + '?select=*', {
    headers: {
      'apikey': anonKey,
      'Authorization': 'Bearer ' + fakeToken
    }
  });
  console.log('2. Firebase token request status:', r2.status);
  const data2 = await r2.json();
  console.log('   Response:', data2);
}

test();
