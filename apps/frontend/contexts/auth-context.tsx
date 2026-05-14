'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAccessToken, onboardingApi, tryRefresh } from '@/lib/api';
import type { User } from '@/lib/api';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setOnboarded: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = getCookie('access_token');
      const storedUser  = getCookie('user');

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      const parsed: User = JSON.parse(decodeURIComponent(storedUser));
      setUser(parsed);
      setIsOnboarded(parsed.isOnboarded ?? false);
      
      // client.ts
      setAccessToken(storedToken);

      // Verify onboarding status with the backend ONLY once
      onboardingApi.status().then(res => {
        if (res.isOnboarded !== (parsed.isOnboarded ?? false)) {
          setIsOnboarded(res.isOnboarded);
          const updated = { ...parsed, isOnboarded: res.isOnboarded };
          const userStr = encodeURIComponent(JSON.stringify(updated));
          
          // Set cookies with 7-day expiration
          document.cookie = `onboarded=${res.isOnboarded}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `user=${userStr}; path=/; max-age=604800; SameSite=Lax`;
          setUser(updated);
        }
      }).catch(err => {
        if (err.message.includes('401') || err.message.includes('Session expirée')) {
          logout();
        }
      });
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (access_token: string, loggedInUser: User) => {
    // 1. Sync memory token first
    setAccessToken(access_token);

    // 2. Set cookies immediately (Middleware & Client use these)
    const onboardedStr = String(loggedInUser.isOnboarded ?? false);
    const userStr = encodeURIComponent(JSON.stringify(loggedInUser));

    document.cookie = `access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `onboarded=${onboardedStr}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `user=${userStr}; path=/; max-age=604800; SameSite=Lax`;
    
    // 3. Update state
    setUser(loggedInUser);
    setIsOnboarded(loggedInUser.isOnboarded ?? false);
  };

  const logout = () => {
    // Clear cookies
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    setAccessToken(null);
    setUser(null);
    setIsOnboarded(false);
  };

  // Called after onboarding completes successfully
  const setOnboarded = () => {
    setIsOnboarded(true);
    document.cookie = `onboarded=true; path=/; max-age=604800; SameSite=Lax`;
    if (user) {
      const updated = { ...user, isOnboarded: true };
      const userStr = encodeURIComponent(JSON.stringify(updated));
      document.cookie = `user=${userStr}; path=/; max-age=604800; SameSite=Lax`;
      setUser(updated);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      const userStr = encodeURIComponent(JSON.stringify(updated));
      document.cookie = `user=${userStr}; path=/; max-age=604800; SameSite=Lax`;
      setUser(updated);
    }
  };

  // 4. Background refresh timer (pre-emptive refresh)
  useEffect(() => {
    if (!user) return;

    // Refresh every 10 minutes (access token lasts 15m)
    const interval = setInterval(async () => {
      try {
        const success = await tryRefresh();
        if (success) {
          // Re-read user from cookie to sync state if it changed
          const storedUser = getCookie('user');
          if (storedUser) {
            setUser(JSON.parse(decodeURIComponent(storedUser)));
          }
        }
      } catch (e) {
        console.error('Background refresh failed:', e);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Listen for global session expiration events
  useEffect(() => {
    const handleExpired = () => {
      // If we are already on a public page, don't show the expired alert
      const isPublicPage = ['/login', '/register', '/'].includes(window.location.pathname);
      if (isPublicPage) {
        logout();
        return;
      }
      
      logout();
      window.location.href = '/login?expired=true';
    };
    window.addEventListener('skilo:session-expired', handleExpired);
    return () => window.removeEventListener('skilo:session-expired', handleExpired);
  }, []);

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
        updateUser,
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