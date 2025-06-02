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
  timeout?: number; // Request timeout in milliseconds
  initialData?: any; // Optional initial data to use before fetching
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
  timeout: 8000, // 8 second timeout
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
    timeout,
    initialData,
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

  // Use initialData if provided
  useEffect(() => {
    if (options.initialData !== undefined) {
      setData(options.initialData);
      setIsLoading(false);
    }
  }, [options.initialData]);

  // Main fetch function with timeout support
  const fetchData = useCallback(async (shouldUpdateLoading = true) => {
    const requestId = Date.now();
    requestTimeRef.current = requestId;

    // If there was a recent request, don't fetch again (deduping)
    const timeSinceLastRequest = requestId - requestTimeRef.current;
    if (dedupingInterval && timeSinceLastRequest < dedupingInterval) {
      return;
    }

    // Check if we have valid cached data first
    if (isCacheValid(url)) {
      const cachedData = cache[url];
      if (!cachedData.error) {
        setData(cachedData.data);
        setIsLoading(false);
        setError(null);
        // Still revalidate in background if needed
        if (cachedData.timestamp < Date.now() - (cacheTime || defaultOptions.cacheTime!) / 2) {
          // If cache is more than half expired, revalidate in background
          setTimeout(() => fetchData(false), 0);
        }
        return;
      }
    }

    if (shouldUpdateLoading) {
      setIsLoading(true);
    }

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout || defaultOptions.timeout!);
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
        },
        credentials: 'include', // Include credentials for cookie-based auth
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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
        // Special handling for timeout errors
        const errorMessage = err.name === 'AbortError' 
          ? 'Request timed out. Please try again.'
          : err.message || 'An error occurred';
        
        const timeoutError = err.name === 'AbortError' 
          ? new Error(errorMessage)
          : err;

        setError(timeoutError);
        setIsLoading(false);

        // Update cache with error
        cache[url] = {
          data: null,
          timestamp: Date.now(),
          error: timeoutError,
        };

        // Retry logic - but don't retry timeouts more than once
        const shouldRetry = shouldRetryOnError && 
          retryCountRef.current < (errorRetryCount || 3) &&
          (err.name !== 'AbortError' || retryCountRef.current === 0);
        
        if (shouldRetry) {
          retryCountRef.current++;
          setTimeout(() => {
            fetchData(false);
          }, errorRetryInterval);
        }
      }
    }
  }, [url, fetchOptions, isCacheValid, dedupingInterval, shouldRetryOnError, errorRetryCount, errorRetryInterval, timeout]);

  // Initial fetch and refetching on dependencies change
  useEffect(() => {
    retryCountRef.current = 0;
    
    // Quick check for valid cache first to prevent flash of loading state
    if (isCacheValid(url)) {
      const cachedData = cache[url];
      if (!cachedData.error) {
        setData(cachedData.data);
        setIsLoading(false);
        // Still fetch in background to update cache
        setTimeout(() => fetchData(false), 0);
        return;
      }
    }
    
    fetchData();
  }, [fetchData, url, isCacheValid]);

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

  // Expose a function to manually revalidate the data
  const revalidate = useCallback(() => {
    // Immediately use cached data if available
    if (isCacheValid(url)) {
      const cachedData = cache[url];
      if (!cachedData.error) {
        setData(cachedData.data);
      }
    }
    
    // Then fetch fresh data
    fetchData(false);
  }, [fetchData, url, isCacheValid]);

  return { data, isLoading, error, revalidate };
}
