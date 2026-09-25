// Firebase Configuration & Initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || '',
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || 'final-voyage.firebaseapp.com',
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || 'final-voyage',
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || 'final-voyage.firebasestorage.app',
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || '485893142380',
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || '1:485893142380:web:11ef7213752f4c7608e549'
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.trim() !== '' &&
  !firebaseConfig.apiKey.includes('your-firebase')
);

export const firebaseApp = isFirebaseConfigured
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

export const app = firebaseApp;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Format Firebase error codes into friendly user messages
 */
export function getAuthErrorMessage(error) {
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
    throw new Error('Firebase credentials not configured in .env. Please provide VITE_FIREBASE_API_KEY.');
  }
  return await signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email, pass) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured in .env.');
  }
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email, pass, name) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured in .env.');
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (credential.user && name) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential;
}

export async function resetUserPassword(email) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials not configured in .env.');
  }
  return await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  if (auth) {
    return await signOut(auth);
  }
}

export { firebaseConfig };
export default firebaseApp;
