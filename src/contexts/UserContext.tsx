'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'DESIGNER' | 'TAILOR';
  isEmailVerified: boolean;
  profile?: any;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache user data to prevent duplicate API calls
let userCache: { user: User | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
      setUser(userCache.user);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store', // Always fetch fresh data
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        userCache = { user: data.data, timestamp: Date.now() };
        setUser(data.data);
      } else {
        userCache = { user: null, timestamp: Date.now() };
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      userCache = { user: null, timestamp: Date.now() };
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const refreshUser = useCallback(async () => {
    await fetchUser(true); // Force refresh
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

