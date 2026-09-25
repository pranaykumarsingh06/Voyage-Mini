import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  Auth
} from 'firebase/auth';

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForDevelopmentPurposesOnly',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'voyage-luxury.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'voyage-luxury',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'voyage-luxury.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};

export const isFirebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY && 
  env.VITE_FIREBASE_API_KEY.trim() !== '' && 
  !env.VITE_FIREBASE_API_KEY.includes('your-firebase')
);

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase credentials not configured in .env file. Please supply VITE_FIREBASE_API_KEY.');
  }
  return await signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email: string, pass: string) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase credentials not configured in .env file.');
  }
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string, name: string) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase credentials not configured in .env file.');
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (credential.user) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential;
}

export async function resetUserPassword(email: string) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase credentials not configured in .env file.');
  }
  return await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  return await signOut(auth);
}
