import { useState, useEffect, useRef, useCallback } from 'react';

// Simple in-memory cache
const cache: Record<string, {
  data: any;
  timestamp: number;
  error?: Error;
}> = {};

interface UseCachedFetchOptions {
  cacheTime?: number; // Time in milliseconds to consider cache valid
  dedupingInterval?: number; // Time to dedupe requests in milliseconds
  revalidateOnFocus?: boolean; // Whether to revalidate when window gains focus
  revalidateOnReconnect?: boolean; // Whether to revalidate when browser regains network connection
  shouldRetryOnError?: boolean; // Whether to retry on error
  errorRetryCount?: number; // Number of times to retry on error
  errorRetryInterval?: number; // Time between retries in milliseconds
}

// Default options
const defaultOptions: UseCachedFetchOptions = {
  cacheTime: 5 * 60 * 1000, // 5 minutes
  dedupingInterval: 2000, // 2 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5 seconds
};

/**
 * Custom hook for data fetching with caching capabilities similar to SWR
 */
export function useCachedFetch<T = any>(
  url: string,
  options: RequestInit & UseCachedFetchOptions = {}
) {
  const {
    cacheTime,
    dedupingInterval,
    revalidateOnFocus,
    revalidateOnReconnect,
    shouldRetryOnError,
    errorRetryCount,
    errorRetryInterval,
    ...fetchOptions
  } = { ...defaultOptions, ...options };

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const requestTimeRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  // Function to check if cache is valid
  const isCacheValid = useCallback((key: string) => {
    const cacheEntry = cache[key];
    return (
      cacheEntry &&
      Date.now() - cacheEntry.timestamp < (cacheTime || defaultOptions.cacheTime!)
    );
  }, [cacheTime]);

  // Main fetch function
  const fetchData = useCallback(async (shouldUpdateLoading = true) => {
    const requestId = Date.now();
    requestTimeRef.current = requestId;

    // If there was a recent request, don't fetch again (deduping)
    const timeSinceLastRequest = requestId - requestTimeRef.current;
    if (dedupingInterval && timeSinceLastRequest < dedupingInterval) {
      return;
    }

    // Check if we have valid cached data
    if (isCacheValid(url)) {
      const cachedData = cache[url];
      if (!cachedData.error) {
        setData(cachedData.data);
        setIsLoading(false);
        setError(null);
        return;
      }
    }

    if (shouldUpdateLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
        },
        credentials: 'include', // Include credentials for cookie-based auth
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();

      // Only update state if this is the most recent request
      if (requestId === requestTimeRef.current) {
        setData(jsonData);
        setIsLoading(false);
        setError(null);

        // Update cache
        cache[url] = {
          data: jsonData,
          timestamp: Date.now(),
        };
      }
    } catch (err: any) {
      // Only update state if this is the most recent request
      if (requestId === requestTimeRef.current) {
        setError(err);
        setIsLoading(false);

        // Update cache with error
        cache[url] = {
          data: null,
          timestamp: Date.now(),
          error: err,
        };

        // Retry logic
        if (shouldRetryOnError && retryCountRef.current < (errorRetryCount || 3)) {
          retryCountRef.current++;
          setTimeout(() => {
            fetchData(false);
          }, errorRetryInterval);
        }
      }
    }
  }, [url, fetchOptions, isCacheValid, dedupingInterval, shouldRetryOnError, errorRetryCount, errorRetryInterval]);

  // Initial fetch and refetching on dependencies change
  useEffect(() => {
    retryCountRef.current = 0;
    fetchData();
  }, [fetchData]);

  // Set up revalidation on window focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, revalidateOnFocus]);

  // Set up revalidation on network reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(false);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchData, revalidateOnReconnect]);

  // Function to manually revalidate data
  const revalidate = () => {
    fetchData();
  };

  return { data, isLoading, error, revalidate };
}
