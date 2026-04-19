'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setOnboarded: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on first load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      const parsed: User = JSON.parse(storedUser);
      setUser(parsed);
      setIsOnboarded(parsed.isOnboarded ?? false);
    } catch {
      // Corrupted data — clean up
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (access_token: string, loggedInUser: User) => {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    // Mirror in a cookie so Next.js middleware can detect auth state
    document.cookie = `access_token=${access_token}; path=/; SameSite=Lax`;
    setUser(loggedInUser);
    setIsOnboarded(loggedInUser.isOnboarded ?? false);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    setIsOnboarded(false);
  };

  // Called after onboarding completes successfully
  const setOnboarded = () => {
    setIsOnboarded(true);
    if (user) {
      const updated = { ...user, isOnboarded: true };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isOnboarded,
        isLoading,
        login,
        logout,
        setOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}