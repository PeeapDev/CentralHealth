/**
 * Utility functions for making authenticated API requests
 * Follows CentralHealth System rules for consistent data handling
 */

/**
 * Interface for fetchWithAuth options
 */
export interface FetchWithAuthOptions extends RequestInit {
  silent?: boolean; // If true, don't log errors to console
  suppressAuthErrors?: boolean; // If true, don't log 401 errors
}

/**
 * Make an authenticated API request with proper error handling
 * @param url The API endpoint URL
 * @param options Additional fetch options including silent mode
 * @returns Response data or throws an error
 */
export async function fetchWithAuth<T>(url: string, options: FetchWithAuthOptions = {}): Promise<T> {
  // Extract custom options
  const { silent = false, suppressAuthErrors = true, ...fetchOptions } = options;
  
  // Normalize URL to ensure consistent format
  const normalizedUrl = normalizeApiUrl(url);
  
  if (!silent) {
    console.log(`Making authenticated request to: ${normalizedUrl}`);
  }
  
  // Always include credentials for authentication
  const requestOptions: RequestInit = {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {})
    }
  };

  try {
    // Make the request
    const response = await fetch(normalizedUrl, requestOptions);

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      
      // Don't log authentication errors if suppressAuthErrors is true
      if (!(suppressAuthErrors && response.status === 401)) {
        console.error(`API Error (${response.status}): ${errorText}`);
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Parse and return the response data
    const data = await response.json() as T;
    return data;
  } catch (error) {
    if (!silent) {
      console.error(`Failed request to ${normalizedUrl}:`, error);
    }
    throw error;
  }
}

/**
 * Get the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
}

/**
 * Normalize API URL to ensure consistent formatting
 * - Ensures hospital names in URLs are properly formatted
 * - Handles any special character encoding needed
 * @param url The original API URL
 * @returns Normalized URL string
 */
export function normalizeApiUrl(url: string): string {
  // Check if this is a hospital API endpoint
  if (url.includes('/api/hospitals/')) {
    // Extract the hospital name from the URL
    const match = url.match(/\/api\/hospitals\/([^\/]+)\//); 
    if (match && match[1]) {
      const hospitalName = match[1];
      const normalizedHospitalName = hospitalName.toLowerCase().replace(/\s+/g, '-');
      
      // Replace the hospital name in the URL with the normalized version
      return url.replace(`/api/hospitals/${hospitalName}/`, `/api/hospitals/${normalizedHospitalName}/`);
    }
  }
  
  return url;
}

/**
 * Check if the user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
