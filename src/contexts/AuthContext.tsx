import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithEmail, registerWithEmail, loginWithGoogle, logoutUser, resetUserPassword, isFirebaseConfigured } from '../lib/firebase';
import { supabase, syncUserProfile, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/database';
import { AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, name: string) => Promise<any>;
  signInGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  simulateAdminMode: (enable: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAdmin, setDemoAdmin] = useState<boolean>(false);

  useEffect(() => {
    // If Firebase is configured, listen to real auth changes
    let unsubscribe = () => {};

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const synced = await syncUserProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            });
            setProfile(synced);
          } catch (e) {
            console.warn('[Auth] Failed to sync profile:', e);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    } else {
      // Offline / Pre-config mode: check if local demo user is set
      const savedUser = localStorage.getItem('voyage_demo_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setProfile(parsed);
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (isFirebaseConfigured) {
      return await loginWithEmail(email, pass);
    } else {
      // Demo authentication mode
      const mockProfile: Profile = {
        id: 'mock-' + Math.random().toString(36).substr(2, 9),
        firebase_uid: 'mock-uid-' + email,
        full_name: email.split('@')[0],
        email: email,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: email.includes('admin') || demoAdmin ? 'admin' : 'traveler',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
      localStorage.setItem('voyage_demo_user', JSON.stringify(mockProfile));
      return { user: { email, uid: mockProfile.firebase_uid } };
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    if (isFirebaseConfigured) {
      return await registerWithEmail(email, pass, name);
    } else {
      const mockProfile: Profile = {
        id: 'mock-' + Math.random().toString(36).substr(2, 9),
        firebase_uid: 'mock-uid-' + email,
        full_name: name,
        email: email,
        avatar_url: null,
        role: 'traveler',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
      localStorage.setItem('voyage_demo_user', JSON.stringify(mockProfile));
      return { user: { email, uid: mockProfile.firebase_uid } };
    }
  };

  const signInGoogle = async () => {
    if (isFirebaseConfigured) {
      return await loginWithGoogle();
    } else {
      const mockProfile: Profile = {
        id: 'mock-google-1',
        firebase_uid: 'mock-google-uid',
        full_name: 'Explorer Google',
        email: 'explorer@voyage.luxury',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        role: 'traveler',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
      localStorage.setItem('voyage_demo_user', JSON.stringify(mockProfile));
      return { user: { email: mockProfile.email, uid: mockProfile.firebase_uid } };
    }
  };

  const signOut = async () => {
    if (isFirebaseConfigured) {
      await logoutUser();
    }
    setUser(null);
    setProfile(null);
    setDemoAdmin(false);
    localStorage.removeItem('voyage_demo_user');
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured) {
      await resetUserPassword(email);
    }
  };

  const simulateAdminMode = (enable: boolean) => {
    setDemoAdmin(enable);
    if (profile) {
      setProfile({
        ...profile,
        role: enable ? 'admin' : 'traveler'
      });
    }
  };

  const isAdmin = Boolean(profile?.role === 'admin' || demoAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signIn,
        signUp,
        signInGoogle,
        signOut,
        resetPassword,
        simulateAdminMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
