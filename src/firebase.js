// Firebase Configuration & Initialization
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY || '',
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env?.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '');

export const firebaseApp = isFirebaseConfigured
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApps()[0])
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
