import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc, setDoc, signInWithPopup, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  login: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isAgent: false,
  login: async () => {},
  register: async () => ({}),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            if (userData.approved) {
              setUser(userData);
            } else {
              // User not approved, sign out
              await signOut(auth);
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
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
    const { email, password } = data;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      if (!userData.approved) {
        await signOut(auth);
        throw new Error('Votre compte est en attente d\'approbation par un administrateur.');
      }
      setUser(userData);
    } else {
      await signOut(auth);
      throw new Error('Profil utilisateur non trouvé.');
    }
  };

  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      if (!userData.approved) {
        await signOut(auth);
        throw new Error('Votre compte est en attente d\'approbation par un administrateur.');
      }
      setUser(userData);
    } else {
      // Create a new profile for Google user
      const role = firebaseUser.email === 'miasaatrany@gmail.com' ? 'admin' : 'agent';
      const approved = role === 'admin';
      
      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || '',
        role: role as any,
        approved,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      if (!approved) {
        await signOut(auth);
        throw new Error('Compte créé avec succès ! Votre compte est en attente d\'approbation par un administrateur.');
      }
      setUser(newUser);
    }
  };

  const register = async (data: any) => {
    const { email, password, displayName, role } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const approved = role === 'admin'; // Admins are auto-approved for now, or use the default admin email logic in rules
    const newUser: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      role,
      approved,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    
    if (!approved) {
      await signOut(auth);
      return { 
        pendingApproval: true, 
        message: 'Compte créé avec succès ! Votre compte est en attente d\'approbation par un administrateur.' 
      };
    }

    setUser(newUser);
    return { user: newUser };
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAgent, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
