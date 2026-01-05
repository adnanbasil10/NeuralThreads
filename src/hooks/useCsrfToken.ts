import { useCallback, useEffect, useState } from 'react';

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchToken = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/security/csrf', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-store' },
        credentials: 'include', // Important: include cookies for CSRF
      });
      
      if (!response.ok) {
        console.error('CSRF token fetch failed:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      if (data.token) {
        setCsrfToken(data.token);
        return data.token as string;
      }

      console.error('Failed to fetch CSRF token - no token in response', data);
      return null;
    } catch (error) {
      console.error('CSRF token fetch error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return { csrfToken, refreshCsrfToken: fetchToken, isFetchingCsrfToken: isLoading };
}

