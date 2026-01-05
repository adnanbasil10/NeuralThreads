'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getErrorMessage } from '@/components/ui/ErrorMessage';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  errorType: 'error' | 'warning' | 'network' | 'auth' | 'notfound' | 'server' | null;
}

interface UseFetchOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;
  cacheKey?: string;
  staleTime?: number; // in milliseconds
}

// Simple cache
const cache = new Map<string, { data: any; timestamp: number }>();

export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions<T> = {}
): FetchState<T> & {
  refetch: () => Promise<void>;
  mutate: (data: T | ((prev: T | null) => T)) => void;
} {
  const {
    initialData = null,
    onSuccess,
    onError,
    enabled = true,
    refetchOnFocus = false,
    refetchOnReconnect = true,
    cacheKey,
    staleTime = 0,
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: initialData,
    isLoading: !!url && enabled,
    error: null,
    errorType: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  // Store callbacks in refs to avoid dependency issues
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    // Check cache
    const key = cacheKey || url;
    const cached = cache.get(key);
    if (cached && staleTime > 0) {
      const age = Date.now() - cached.timestamp;
      if (age < staleTime) {
        setState({
          data: cached.data,
          isLoading: false,
          error: null,
          errorType: null,
        });
        return;
      }
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, error: null, errorType: null }));

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorInfo = getErrorMessage(new Error(`${response.status}`));
        setState({
          data: null,
          isLoading: false,
          error: errorInfo.message,
          errorType: errorInfo.type || null,
        });
        onErrorRef.current?.(errorInfo.message);
        return;
      }

      const data = await response.json();

      // Update cache
      cache.set(key, { data, timestamp: Date.now() });

      setState({
        data,
        isLoading: false,
        error: null,
        errorType: null,
      });
      onSuccessRef.current?.(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }

      const errorInfo = getErrorMessage(err);
      setState({
        data: null,
        isLoading: false,
        error: errorInfo.message,
        errorType: errorInfo.type || null,
      });
      onErrorRef.current?.(errorInfo.message);
    }
  }, [url, enabled, cacheKey, staleTime]);

  // Initial fetch
  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Refetch on focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, fetchData]);

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => {
      fetchData();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetchOnReconnect, fetchData]);

  // Manual refetch - memoized to prevent unnecessary recreations
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Optimistic update
  const mutate = useCallback((data: T | ((prev: T | null) => T)) => {
    setState((prev) => ({
      ...prev,
      data: typeof data === 'function' ? (data as (prev: T | null) => T)(prev.data) : data,
    }));
  }, []);

  return { ...state, refetch, mutate };
}

// Mutation hook for POST/PUT/DELETE
interface MutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  errorType: 'error' | 'warning' | 'network' | 'auth' | 'notfound' | 'server' | null;
  isSuccess: boolean;
}

interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: string, variables: V) => void;
  onSettled?: () => void;
}

export function useMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): MutationState<T> & {
  mutate: (variables: V) => Promise<void>;
  mutateAsync: (variables: V) => Promise<T>;
  reset: () => void;
} {
  const { onSuccess, onError, onSettled } = options;

  const [state, setState] = useState<MutationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    errorType: null,
    isSuccess: false,
  });

  const mutateAsync = useCallback(
    async (variables: V): Promise<T> => {
      setState({
        data: null,
        isLoading: true,
        error: null,
        errorType: null,
        isSuccess: false,
      });

      try {
        const data = await mutationFn(variables);

        setState({
          data,
          isLoading: false,
          error: null,
          errorType: null,
          isSuccess: true,
        });

        onSuccess?.(data, variables);
        return data;
      } catch (err) {
        const errorInfo = getErrorMessage(err);

        setState({
          data: null,
          isLoading: false,
          error: errorInfo.message,
          errorType: errorInfo.type || null,
          isSuccess: false,
        });

        onError?.(errorInfo.message, variables);
        throw err;
      } finally {
        onSettled?.();
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    async (variables: V) => {
      try {
        await mutateAsync(variables);
      } catch {
        // Error already handled in mutateAsync
      }
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      errorType: null,
      isSuccess: false,
    });
  }, []);

  return { ...state, mutate, mutateAsync, reset };
}

// Helper for API calls
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Error: ${response.status}`);
  }

  return response.json();
}

export default useFetch;




