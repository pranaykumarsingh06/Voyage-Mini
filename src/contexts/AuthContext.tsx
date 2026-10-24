import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithEmail, registerWithEmail, loginWithGoogle, logoutUser, resetUserPassword, isFirebaseConfigured } from '../lib/firebase';
import { supabase, syncUserProfile, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/database';
import { AuthState } from '../types/auth';

export const ADMIN_EMAIL = 'pranaykrsingh03@gmail.com';
export const ADMIN_PASSWORD = '12341234';

interface AuthContextType extends AuthState {
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, name: string) => Promise<any>;
  signInGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If Firebase is configured, listen to real auth changes
    let unsubscribe = () => {};

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          const isTargetAdmin = currentUser.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
          try {
            const synced = await syncUserProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            });
            if (synced) {
              setProfile({
                ...synced,
                role: isTargetAdmin ? 'admin' : 'traveler',
              });
            } else {
              setProfile({
                id: 'local-' + currentUser.uid,
                firebase_uid: currentUser.uid,
                email: currentUser.email || '',
                full_name: currentUser.displayName || (isTargetAdmin ? 'Pranay Kumar Singh' : 'Traveler'),
                avatar_url: currentUser.photoURL || null,
                role: isTargetAdmin ? 'admin' : 'traveler',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          } catch (e) {
            console.warn('[Auth] Failed to sync profile:', e);
            setProfile({
              id: 'local-' + currentUser.uid,
              firebase_uid: currentUser.uid,
              email: currentUser.email || '',
              full_name: currentUser.displayName || (isTargetAdmin ? 'Pranay Kumar Singh' : 'Traveler'),
              avatar_url: currentUser.photoURL || null,
              role: isTargetAdmin ? 'admin' : 'traveler',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    } else {
      // Offline mode: check if local user is set
      const savedUser = localStorage.getItem('voyage_demo_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const isTargetAdmin = parsed.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
          setProfile({
            ...parsed,
            role: isTargetAdmin ? 'admin' : 'traveler'
          });
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isTargetAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    // Enforce admin password check
    if (isTargetAdmin && pass !== ADMIN_PASSWORD) {
      throw new Error('Incorrect password for administrator account.');
    }

    if (isFirebaseConfigured) {
      const cred = await loginWithEmail(email, pass);
      if (cred?.user) {
        try {
          const synced = await syncUserProfile({
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName,
            photoURL: cred.user.photoURL,
          });
          if (synced) {
            setProfile({
              ...synced,
              role: isTargetAdmin ? 'admin' : 'traveler'
            });
          } else {
            setProfile({
              id: 'local-' + cred.user.uid,
              firebase_uid: cred.user.uid,
              email: cred.user.email || '',
              full_name: cred.user.displayName || (isTargetAdmin ? 'Pranay Kumar Singh' : 'Traveler'),
              avatar_url: cred.user.photoURL || null,
              role: isTargetAdmin ? 'admin' : 'traveler',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch (e: any) {
          console.error('[Auth] Sync after sign in notice:', e);
          setProfile({
            id: 'local-' + cred.user.uid,
            firebase_uid: cred.user.uid,
            email: cred.user.email || '',
            full_name: cred.user.displayName || (isTargetAdmin ? 'Pranay Kumar Singh' : 'Traveler'),
            avatar_url: cred.user.photoURL || null,
            role: isTargetAdmin ? 'admin' : 'traveler',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
      return cred;
    } else {
      // Offline fallback mode
      if (isTargetAdmin && pass !== ADMIN_PASSWORD) {
        throw new Error('Incorrect password for administrator account.');
      }
      const offlineProfile: Profile = {
        id: isTargetAdmin ? 'admin-pranay' : 'mock-' + Math.random().toString(36).substr(2, 9),
        firebase_uid: 'uid-' + cleanEmail,
        full_name: isTargetAdmin ? 'Pranay Kumar Singh' : email.split('@')[0],
        email: email,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: isTargetAdmin ? 'admin' : 'traveler',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(offlineProfile);
      localStorage.setItem('voyage_demo_user', JSON.stringify(offlineProfile));
      return { user: { email, uid: offlineProfile.firebase_uid } };
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      throw new Error('This administrator account is already registered. Please sign in directly.');
    }

    if (isFirebaseConfigured) {
      const cred = await registerWithEmail(email, pass, name);
      if (cred?.user) {
        try {
          const synced = await syncUserProfile({
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: name || cred.user.displayName,
            photoURL: cred.user.photoURL,
          });
          if (synced) setProfile(synced);
        } catch (e: any) {
          console.warn('[Auth] Remote profile sync notice after sign up, continuing with local profile:', e);
          setProfile({
            id: 'local-' + cred.user.uid,
            firebase_uid: cred.user.uid,
            email: cred.user.email,
            full_name: name || (cred.user.email ? cred.user.email.split('@')[0] : 'Traveler'),
            avatar_url: cred.user.photoURL || null,
            role: 'traveler',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
      return cred;
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
      const cred = await loginWithGoogle();
      if (cred?.user) {
        try {
          const synced = await syncUserProfile({
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName,
            photoURL: cred.user.photoURL,
          });
          if (synced) setProfile(synced);
        } catch (e: any) {
          console.warn('[Auth] Remote profile sync notice after Google login, continuing with local profile:', e);
          setProfile({
            id: 'local-' + cred.user.uid,
            firebase_uid: cred.user.uid,
            email: cred.user.email,
            full_name: cred.user.displayName || 'Explorer Google',
            avatar_url: cred.user.photoURL || null,
            role: 'traveler',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
      return cred;
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
    localStorage.removeItem('voyage_demo_user');
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured) {
      await resetUserPassword(email);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>): Promise<Profile | null> => {
    if (!profile) return null;
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(updated);

    if (isSupabaseConfigured) {
      try {
        const synced = await syncUserProfile({
          uid: profile.firebase_uid,
          email: profile.email,
          displayName: updates.full_name !== undefined ? updates.full_name : profile.full_name,
          photoURL: updates.avatar_url !== undefined ? updates.avatar_url : profile.avatar_url,
        });
        if (synced) {
          setProfile(synced);
          return synced;
        }
      } catch (err) {
        console.warn('[Auth] syncUserProfile during profile update notice:', err);
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('firebase_uid', profile.firebase_uid)
          .select()
          .single();
        if (data) {
          setProfile(data as Profile);
          return data as Profile;
        }
      } catch (err) {
        console.warn('[Auth] Direct Supabase update profile error:', err);
      }
    } else {
      localStorage.setItem('voyage_demo_user', JSON.stringify(updated));
    }
    return updated;
  };

  const isAdmin = Boolean(profile?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && profile?.role === 'admin');

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
        updateUserProfile,
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
