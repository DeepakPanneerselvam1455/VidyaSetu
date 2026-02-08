
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import * as api from './api';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUserProfile: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const profile = await api.getProfile();
        setUser(profile);
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const result = await api.login(email, pass);
    setUser(result.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateUserProfile = async (updatedData: Partial<User>) => {
    if (!user) throw new Error("No user to update");
    const updatedUser = { ...user, ...updatedData };
    await api.updateUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUserProfile }}>
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
