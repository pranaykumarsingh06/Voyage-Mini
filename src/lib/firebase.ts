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
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.trim() !== '' && 
  !firebaseConfig.apiKey.includes('your-firebase')
);

export const app = isFirebaseConfigured 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured in .env file. Please provide VITE_FIREBASE_API_KEY.');
  }
  return await signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email: string, pass: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured in .env file.');
  }
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string, name: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured in .env file.');
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (credential.user && name) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential;
}

export async function resetUserPassword(email: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured in .env file.');
  }
  return await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  if (auth) {
    return await signOut(auth);
  }
}
