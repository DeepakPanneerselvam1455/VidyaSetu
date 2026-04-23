
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import * as api from './api';
import { isNetworkError, isTimeoutError } from './networkErrorHandler';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  updateUserProfile: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps Supabase / fetch errors to user-friendly messages.
 * Priority: specific Supabase codes > HTTP status > network/timeout > raw message.
 */
function getLoginErrorMessage(error: unknown): string {
  const err = error as any;

  // Log full error details for debugging
  console.error('[Auth] Login error details:', {
    message: err?.message,
    status: err?.status,
    code: err?.code,
    name: err?.name,
    error: err,
  });

  const msg: string = (err?.message || '').toLowerCase();

  // --- Supabase auth-specific errors ---
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid email or password') ||
    msg.includes('email not confirmed') === false && msg.includes('invalid credentials')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Please verify your email address before logging in. Check your inbox for a confirmation link.';
  }

  if (msg.includes('account has been disabled') || msg.includes('disabled')) {
    return err.message; // Pass through the exact message from api.ts
  }

  if (msg.includes('user not found') || msg.includes('no user')) {
    return 'No account found with this email address. Please check or create a new account.';
  }

  if (msg.includes('too many requests') || err?.status === 429) {
    return 'Too many login attempts. Please wait a few minutes and try again.';
  }

  if (msg.includes('user profile not found') || msg.includes('profile not found')) {
    return 'Login succeeded but your profile is missing. Please contact support.';
  }

  if (msg.includes('user has no role')) {
    return 'Your account has no role assigned. Please contact an administrator.';
  }

  // --- Network / connectivity errors ---
  if (isTimeoutError(error)) {
    return 'Connection timed out. Please check your internet connection and try again.';
  }

  if (isNetworkError(error) || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return 'Cannot reach the server. Please check your internet connection or try again later.';
  }

  // --- HTTP status fallback ---
  const status = err?.status || err?.statusCode;
  if (status === 400) return 'Invalid login request. Please check your email and password.';
  if (status === 401) return 'Authentication failed. Please check your credentials.';
  if (status === 403) return 'Access denied. Your account may not have the required permissions.';
  if (status === 500 || status === 502 || status === 503) {
    return 'The authentication server is currently unavailable. Please try again later.';
  }

  // --- Final fallback: show the actual error message ---
  return err?.message || 'An unexpected error occurred. Please try again.';
}

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
    try {
      const result = await api.login(email, pass);
      setUser(result.user);
      return result.user;
    } catch (error) {
      const userMessage = getLoginErrorMessage(error);
      throw new Error(userMessage);
    }
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
