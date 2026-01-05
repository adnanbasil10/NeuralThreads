'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface CsrfContextType {
  csrfToken: string | null;
  refreshToken: () => Promise<string | null>;
  isReady: boolean;
  isLoading: boolean;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

// Global token state to share across all components
let globalToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;
let tokenExpiry: number = 0;
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // Refresh every 50 minutes (tokens last 60 minutes)

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string | null>(globalToken);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchToken = useCallback(async (force = false): Promise<string | null> => {
    // If we have a valid token and not forcing refresh, return it
    if (!force && globalToken && Date.now() < tokenExpiry) {
      return globalToken;
    }

    // If there's already a fetch in progress, wait for it
    if (tokenPromise && !force) {
      return tokenPromise;
    }

    setIsLoading(true);
    
    tokenPromise = (async () => {
      try {
        const response = await fetch('/api/security/csrf', {
          method: 'GET',
          headers: { 
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
          },
          credentials: 'include', // Critical: must include cookies
        });
        
        if (!response.ok) {
          console.error('CSRF token fetch failed:', response.status, response.statusText);
          return null;
        }
        
        // Check if cookie was set in response
        const setCookieHeader = response.headers.get('set-cookie');
        if (!setCookieHeader || !setCookieHeader.includes('nt.csrf')) {
          console.warn('⚠️ CSRF cookie not set in response. Set-Cookie header:', setCookieHeader);
        } else {
          console.log('✅ CSRF cookie header found in response');
        }
        
        const data = await response.json();
        if (data.token && typeof data.token === 'string') {
          globalToken = data.token;
          tokenExpiry = Date.now() + TOKEN_REFRESH_INTERVAL;
          setCsrfToken(globalToken);
          setIsReady(true);
          console.log('✅ CSRF token obtained and ready, length:', globalToken?.length || 0);
          
          // Verify cookie is accessible (in browser)
          if (typeof document !== 'undefined') {
            // Note: httpOnly cookies can't be read from JS, but we can check if the request was made
            console.log('✅ CSRF token stored, cookie should be set by browser');
          }
          
          return globalToken;
        }

        console.error('Failed to fetch CSRF token - invalid response', data);
        return null;
      } catch (error) {
        console.error('CSRF token fetch error:', error);
        return null;
      } finally {
        setIsLoading(false);
        tokenPromise = null;
      }
    })();

    return tokenPromise;
  }, []);

  // Initial token fetch
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Auto-refresh token before expiry - optimized to prevent unnecessary re-runs
  useEffect(() => {
    if (!csrfToken) return;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const timeUntilExpiry = tokenExpiry - Date.now();
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000); // Refresh 5 minutes before expiry

      refreshTimeoutRef.current = setTimeout(() => {
        fetchToken(true);
        scheduleRefresh(); // Schedule next refresh
      }, refreshTime);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // Only depend on csrfToken, fetchToken is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csrfToken]);

  // Refresh on window focus (in case token expired while tab was inactive)
  // Use ref to avoid dependency on fetchToken
  const fetchTokenRef = useRef(fetchToken);
  useEffect(() => {
    fetchTokenRef.current = fetchToken;
  }, [fetchToken]);

  useEffect(() => {
    const handleFocus = () => {
      if (!globalToken || Date.now() >= tokenExpiry) {
        fetchTokenRef.current(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const refreshToken = useCallback(async () => {
    return fetchToken(true);
  }, [fetchToken]);

  return (
    <CsrfContext.Provider value={{ csrfToken, refreshToken, isReady, isLoading }}>
      {children}
    </CsrfContext.Provider>
  );
}

export function useCsrf() {
  const context = useContext(CsrfContext);
  if (context === undefined) {
    throw new Error('useCsrf must be used within a CsrfProvider');
  }
  return context;
}

