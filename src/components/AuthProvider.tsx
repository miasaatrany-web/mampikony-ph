import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  login: (data: any) => Promise<void>;
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
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.auth.me();
          setUser(userData);
        } catch (err) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (data: any) => {
    const { user, token } = await api.auth.login(data);
    localStorage.setItem('token', token);
    setUser(user);
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    if (res.pendingApproval) {
      return res;
    }
    const { user, token } = res;
    localStorage.setItem('token', token);
    setUser(user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAgent, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
