import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../api';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  db,
  doc,
  getDoc,
  setDoc
} from '../firebase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isCashier: boolean;
  login: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isAgent: false,
  isCashier: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => ({}),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.email === 'miasaatrany@gmail.com';
  const isAgent = user?.role === 'agent' || isAdmin;
  const isCashier = user?.role === 'caissier' || isAdmin;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // This might happen if the user is in Firebase Auth but not in Firestore
            // We should probably handle this or just logout
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (data: any) => {
    try {
      setLoading(true);
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, data.email, data.password);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.approved || userData.email === 'miasaatrany@gmail.com') {
          setUser(userData);
        } else {
          await signOut(auth);
          throw new Error('Votre compte est en attente d\'approbation par un administrateur.');
        }
      } else {
        await signOut(auth);
        throw new Error('Profil utilisateur introuvable.');
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.approved || userData.email === 'miasaatrany@gmail.com') {
          setUser(userData);
          return { user: userData };
        } else {
          await signOut(auth);
          return { 
            pendingApproval: true, 
            message: 'Votre compte est en attente d\'approbation par un administrateur.' 
          };
        }
      } else {
        // Create new user profile if it doesn't exist
        const isOwner = firebaseUser.email === 'miasaatrany@gmail.com';
        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          role: isOwner ? 'admin' : 'agent',
          approved: isOwner,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        
        if (newUser.approved) {
          setUser(newUser);
          return { user: newUser };
        } else {
          await signOut(auth);
          return { 
            pendingApproval: true, 
            message: 'Compte créé ! En attente d\'approbation par un administrateur.' 
          };
        }
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      const isOwner = data.email === 'miasaatrany@gmail.com';
      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        email: data.email,
        displayName: data.displayName,
        role: isOwner ? 'admin' : (data.role || 'agent'),
        approved: isOwner,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      if (newUser.approved) {
        setUser(newUser);
        return { user: newUser };
      } else {
        await signOut(auth);
        return { 
          pendingApproval: true, 
          message: 'Compte créé avec succès ! Votre compte est en attente d\'approbation par un administrateur.' 
        };
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAgent, isCashier, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
