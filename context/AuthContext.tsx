import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// Reverting to signInWithPopup as signInWithRedirect may cause issues in sandboxed environments.
import { 
    onAuthStateChanged, 
    signInWithPopup, // Reverted from signInWithRedirect
    signOut, 
    User as FirebaseUser,
    setPersistence,
    browserSessionPersistence
} from 'firebase/auth';
import { auth, provider } from '../services/firebase';
import { User } from '../types';
import Loader from '../components/shared/Loader';

interface AuthContextType {
  user: User | null;
  isFirstTimeUser: boolean;
  login: () => void;
  logout: () => void;
  dismissGuide: () => void;
  isAuthLoading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [loading, setLoading] = useState(true); // Initial page load
  const [isAuthLoading, setIsAuthLoading] = useState(false); // For login action

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Check if it's a new user by comparing creation time and last sign-in time
        const isNew = firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;
        setIsFirstTimeUser(isNew);
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Explorer',
          photoURL: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setIsAuthLoading(true);
    try {
      // Use session persistence which is often more reliable in sandboxed/iframe environments.
      await setPersistence(auth, browserSessionPersistence);
      // The popup flow might be more compatible with the environment than a full redirect.
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the successful login and update the user state.
    } catch (error) {
      console.error("Error signing in with Google", error);
      // It's important to turn off loading even if there's an error (e.g., user closes popup).
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };
  
  const dismissGuide = () => {
    setIsFirstTimeUser(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader message="Authenticating..." /></div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isFirstTimeUser, dismissGuide, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};