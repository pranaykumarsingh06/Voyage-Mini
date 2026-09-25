import { User as FirebaseUser } from 'firebase/auth';
import { Profile } from './database';

export interface AuthState {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
}
