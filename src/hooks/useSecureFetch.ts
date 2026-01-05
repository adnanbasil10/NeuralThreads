'use client';

import { useCallback } from 'react';
import { useCsrf } from '@/contexts/CsrfContext';

export function useSecureFetch() {
  const { csrfToken, refreshToken, isReady, isLoading } = useCsrf();

  const ensureToken = useCallback(async (retries = 3): Promise<string> => {
    // If token is ready, use it
    if (csrfToken) {
      return csrfToken;
    }

    // If still loading, wait a bit and try again
    if (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (csrfToken) return csrfToken;
    }

    // Try to refresh
    const refreshed = await refreshToken();
    if (refreshed) {
      return refreshed;
    }

    // Retry logic
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return ensureToken(retries - 1);
    }

    throw new Error('Unable to obtain CSRF token after multiple attempts. Please refresh the page.');
  }, [csrfToken, refreshToken, isLoading]);

  const secureFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}, providedToken?: string) => {
      try {
        // Use provided token if available, otherwise get from context
        let token: string;
        if (providedToken) {
          token = providedToken;
          console.log('Using provided CSRF token');
        } else {
          // Wait for token to be ready (with timeout)
          token = await Promise.race([
            ensureToken(),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('CSRF token fetch timeout')), 10000)
            ),
          ]);

          if (!token) {
            throw new Error('Unable to obtain CSRF token. Please refresh the page.');
          }
        }

        // Verify token is valid
        if (!token || typeof token !== 'string' || token.length === 0) {
          throw new Error('Invalid CSRF token. Please refresh the page.');
        }

        const headers = new Headers(init.headers || {});
        
        // CRITICAL: Set the CSRF token header
        headers.set('x-csrf-token', token);
        
        // Verify it was set
        if (!headers.has('x-csrf-token')) {
          throw new Error('Failed to set CSRF token header');
        }

        if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }

        // Ensure credentials are always included
        const fetchOptions: RequestInit = {
          ...init,
          headers,
          credentials: 'include', // Include cookies for authentication and CSRF
        };

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          const headerValue = headers.get('x-csrf-token');
          console.log('🔐 Making secure request:', {
            url: typeof input === 'string' ? input : input.toString(),
            method: fetchOptions.method || 'GET',
            hasCsrfHeader: headers.has('x-csrf-token'),
            csrfHeaderValue: headerValue ? headerValue.substring(0, 10) + '...' : 'MISSING',
            csrfTokenLength: token.length,
            credentials: fetchOptions.credentials,
          });
        }

        const response = await fetch(input, fetchOptions);

        // If we get a 403 CSRF error, refresh token and retry once
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.includes('CSRF') || errorData.error?.includes('csrf') || errorData.message?.includes('CSRF')) {
            console.warn('⚠️ CSRF token rejected, refreshing and retrying...');
            const newToken = await refreshToken();
            if (newToken) {
              headers.set('x-csrf-token', newToken);
              
              console.log('🔄 Retrying with new CSRF token');
              const retryResponse = await fetch(input, {
                ...init,
                headers,
                credentials: 'include',
              });
              
              // If retry also fails, throw error
              if (retryResponse.status === 403) {
                throw new Error('CSRF token validation failed after retry. Please refresh the page.');
              }
              
              console.log('✅ Retry successful');
              return retryResponse;
            } else {
              throw new Error('Unable to refresh CSRF token. Please refresh the page.');
            }
          }
        }

        return response;
      } catch (error) {
        // If it's already an Error, rethrow it
        if (error instanceof Error) {
          throw error;
        }
        // Otherwise wrap it
        throw new Error('Network error occurred. Please try again.');
      }
    },
    [ensureToken, refreshToken]
  );

  return {
    secureFetch,
    csrfToken,
    isFetchingCsrfToken: isLoading,
    refreshCsrfToken: refreshToken,
    isReady,
  };
}




