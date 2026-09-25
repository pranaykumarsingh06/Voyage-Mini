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
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'final-voyage.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'final-voyage',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'final-voyage.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '485893142380',
  appId: env.VITE_FIREBASE_APP_ID || '1:485893142380:web:11ef7213752f4c7608e549'
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.trim() !== '' && 
  !firebaseConfig.apiKey.includes('your-firebase')
);

export const app = isFirebaseConfigured 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

export const firebaseApp = app;
export const auth: Auth | null = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Format Firebase error codes into friendly user messages
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please check and try again.';
    case 'auth/user-disabled':
      return 'This traveler account has been deactivated. Please contact concierge.';
    case 'auth/user-not-found':
      return 'No traveler account found with this email. Please check your credentials or join the club.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/weak-password':
      return 'Your security passport password must be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in window can be open at a time.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily restricted. Please try again shortly.';
    default:
      return error.message || 'Authentication error occurred. Please try again.';
  }
}

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

export { firebaseConfig };
export default app;
