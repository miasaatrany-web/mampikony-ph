import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc, setDoc, signInWithPopup, googleProvider, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
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

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profileRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
          console.log('Auth Profile Update:', docSnap.exists() ? docSnap.data() : 'No profile');
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserProfile;
            // Hardcoded admin is always approved
            if (userData.approved || firebaseUser.email === 'miasaatrany@gmail.com') {
              setUser(userData);
            } else {
              // If not approved, we don't set the user but we don't sign out here
              // to avoid race conditions during registration/login
              setUser(null);
            }
          } else {
            // Document doesn't exist yet (might be in progress of creation)
            setUser(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error listening to user profile:', err);
          setUser(null);
          setLoading(false);
        });
      } else {
        unsubscribeProfile();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const login = async (data: any) => {
    const { email, password } = data;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (!userData.approved && firebaseUser.email !== 'miasaatrany@gmail.com') {
          await signOut(auth);
          throw new Error('Votre compte est en attente d\'approbation par un administrateur.');
        }
        setUser(userData);
      } else {
        // If user exists in Auth but not in Firestore, try to create a basic profile
        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || email.split('@')[0],
          role: 'agent',
          approved: false,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
        await signOut(auth);
        throw new Error('Profil créé. Votre compte est en attente d\'approbation par un administrateur.');
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Email ou mot de passe incorrect.');
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Erreur de réseau. Veuillez vérifier votre connexion.');
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (!userData.approved && firebaseUser.email !== 'miasaatrany@gmail.com') {
          await signOut(auth);
          return { 
            pendingApproval: true, 
            message: 'Votre compte est en attente d\'approbation par un administrateur.' 
          };
        }
        setUser(userData);
        return { user: userData };
      } else {
        // Create a new profile for Google user
        const role = firebaseUser.email === 'miasaatrany@gmail.com' ? 'admin' : 'agent';
        const approved = firebaseUser.email === 'miasaatrany@gmail.com';
        
        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || '',
          role: role as any,
          approved,
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
        
        if (!approved) {
          await signOut(auth);
          return { 
            pendingApproval: true, 
            message: 'Compte créé avec succès ! Votre compte est en attente d\'approbation par un administrateur.' 
          };
        }
        setUser(newUser);
        return { user: newUser };
      }
    } catch (error: any) {
      console.error('Google Login Error:', error);
      if (error.code === 'auth/popup-blocked') {
        throw new Error("Le popup de connexion a été bloqué. Veuillez autoriser les popups pour ce site.");
      }
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error("Ce domaine n'est pas autorisé dans votre console Firebase (Authentication -> Settings -> Authorized Domains).");
      }
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("La méthode de connexion (Google ou Email) n'est pas activée dans votre console Firebase.");
      }
      throw error;
    }
  };

  const register = async (data: any) => {
    const { email, password, displayName, role } = data;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const approved = firebaseUser.email === 'miasaatrany@gmail.com';
      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        role,
        approved,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }
      
      if (!approved) {
        await signOut(auth);
        return { 
          pendingApproval: true, 
          message: 'Compte créé avec succès ! Votre compte est en attente d\'approbation par un administrateur.' 
        };
      }

      setUser(newUser);
      return { user: newUser };
    } catch (error: any) {
      console.error('Registration Auth Error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Cet email est déjà utilisé par un autre compte.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Le mot de passe est trop faible (6 caractères minimum).');
      }
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('La méthode d\'inscription par email n\'est pas activée. Veuillez utiliser Google ou contacter l\'administrateur.');
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Erreur de réseau. Veuillez vérifier votre connexion.');
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAgent, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
