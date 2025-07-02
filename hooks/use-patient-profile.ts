"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { getUserEmail, getPatientId } from '../utils/session-utils';
import { redirect } from 'next/navigation';

// Constants
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache TTL
const PROFILE_CACHE_KEY = 'PROFILE_CACHE';
const FORCE_REFRESH_KEY = 'FORCE_REFRESH_PROFILE';
const PHOTO_CACHE_PREFIX = 'patient_photo_';
const DEFAULT_AVATAR = '/images/default-avatar.png';

// Types
export type PatientProfile = {
  id: string;
  mrn: string; // Medical Record Number - permanent and immutable per CentralHealth policy
  medicalNumber: string; // Same as MRN but for backward compatibility
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
};

type ProfileCacheEntry = {
  profile: PatientProfile;
  timestamp: number;
};

type PhotoCacheEntry = {
  url: string;
  timestamp: number;
};

// In-memory cache for profiles
let globalProfileCache: Record<string, ProfileCacheEntry> = {};

/**
 * Clear all patient data from localStorage and in-memory caches
 * Used on logout and when session expires
 */
export function clearPatientData(): void {
  if (typeof window !== 'undefined') {
    try {
      // Clear ALL patient data to ensure a fresh start
      // When the user logs in again, they'll get their correct medical ID from the database
      localStorage.removeItem('userEmail');
      localStorage.removeItem('patientId');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('PROFILE_CACHE');
      localStorage.removeItem('AUTH_EXPIRY');
      localStorage.removeItem('mrn');
      localStorage.removeItem('medicalNumber');
      
      // Also clear any cached profile photos
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(PHOTO_CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear global runtime cache too
      globalProfileCache = {};
      
      console.log('Patient data cleared completely');
    } catch (err) {
      console.error('Error clearing patient data:', err);
    }
  }
}

/**
 * Safe localStorage operations with error handling
 */
function safeLocalStorage(
  operation: 'get' | 'set' | 'remove',
  key: string,
  value?: string
): string | null {
  try {
    if (typeof window === 'undefined') return null;
    
    if (operation === 'get') {
      return localStorage.getItem(key);
    } else if (operation === 'set' && value !== undefined) {
      localStorage.setItem(key, value);
      return value;
    } else if (operation === 'remove') {
      localStorage.removeItem(key);
    }
    return null;
  } catch (err) {
    console.error(`LocalStorage ${operation} error:`, err);
    return null;
  }
}

/**
 * Helper function to parse JSON with error handling
 */
function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (err) {
    console.error('JSON parse error:', err);
    return defaultValue;
  }
}

/**
 * Mask identifier for safe logging (show only first and last characters)
 */
function maskIdentifier(identifier: string): string {
  if (!identifier || identifier.length <= 4) return '****';
  return `${identifier.slice(0, 2)}...${identifier.slice(-2)}`;
}

/**
 * Generate a cache key from available identifiers
 */
function getCacheKey(
  mrn?: string | null,
  patientId?: string | null,
  email?: string | null
): string {
  return `${mrn || ''}:${patientId || ''}:${email || ''}`;
}

/**
 * Fetch patient profile from API
 */
async function fetchPatientProfile(
  email?: string | null,
  patientId?: string | null,
  mrn?: string | null
): Promise<PatientProfile | null> {
  try {
    const queryParams = new URLSearchParams();
    
    if (email) queryParams.append('email', email);
    if (patientId) queryParams.append('patientId', patientId);
    if (mrn) {
      queryParams.append('mrn', mrn);
      queryParams.append('medicalNumber', mrn); // For backward compatibility
    }
    
    const queryString = queryParams.toString();
    
    // Use proper fetch error handling
    const response = await fetch(`/api/patients/profile?${queryString}`);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearPatientData();
        redirect('/login');
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data) {
      console.error('No profile data returned from API');
      return null;
    }
    
    // Process the data to ensure we have name fields properly populated
    if (data.name && (!data.firstName || !data.lastName)) {
      // Split full name into first and last name if they're not provided
      const nameParts = data.name.split(' ');
      if (nameParts.length > 0) {
        data.firstName = data.firstName || nameParts[0];
        data.lastName = data.lastName || nameParts.slice(1).join(' ');
      }
    }
    
    // CRITICAL: Per CentralHealth policy, medical IDs are PERMANENT and IMMUTABLE
    // MRN is the single source of truth for medical IDs
    
    // First, check for a proper NHS-style MRN (5-char alphanumeric)
    if (data.mrn && data.mrn.length === 5) {
      // MRN is the primary ID - always synchronize medicalNumber to match MRN
      data.medicalNumber = data.mrn;
      console.log(`[MEDICAL ID] Using permanent NHS-style MRN: ${maskIdentifier(data.mrn)}`);
    } else if (data.medicalNumber && data.medicalNumber.length === 5) {
      // CRITICAL: If medicalNumber is valid but mrn is missing/invalid, use medicalNumber as permanent MRN
      // This ensures we maintain a SINGLE permanent medical ID for this patient's lifetime
      data.mrn = data.medicalNumber;
      console.log(`[MEDICAL ID] Fixed: Setting MRN to match valid medicalNumber: ${maskIdentifier(data.medicalNumber)}`);
    } else {
      // We have a data issue - but never regenerate IDs - log a critical error
      console.error('[CRITICAL ERROR] Invalid or missing medical ID format', { 
        mrn: data.mrn ? maskIdentifier(data.mrn) : 'missing', 
        medicalNumber: data.medicalNumber ? maskIdentifier(data.medicalNumber) : 'missing' 
      });
      
      // Force consistency but NEVER create new IDs for existing patients
      if (data.mrn) {
        // If mrn exists, use it as the canonical ID
        data.medicalNumber = data.mrn;
        console.log(`[MEDICAL ID] Consistency fix: Using existing MRN as canonical ID`);
      } else if (data.medicalNumber) {
        // If only medicalNumber exists, use it as mrn
        data.mrn = data.medicalNumber;
        console.log(`[MEDICAL ID] Consistency fix: Using existing medicalNumber as canonical ID`);
      }
    }
    
    // Store permanent medical IDs in localStorage
    if (data.mrn) {
      safeLocalStorage('set', 'mrn', data.mrn);
      safeLocalStorage('set', 'medicalNumber', data.mrn);
    }
    
    // Log full profile data for debugging
    console.log('Profile data loaded:', {
      id: data.id,
      mrn: data.mrn,
      medicalNumber: data.medicalNumber,
      name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : 'Unknown',
      email: data.email ? maskIdentifier(data.email) : 'Unknown'
    });
    
    // Update cache
    const cacheKey = getCacheKey(data.mrn, data.id, data.email);
    const cacheEntry: ProfileCacheEntry = { profile: data, timestamp: Date.now() };
    globalProfileCache[cacheKey] = cacheEntry;
    
    // Update localStorage cache
    const existingCache = safeJsonParse<Record<string, ProfileCacheEntry>>(
      safeLocalStorage('get', PROFILE_CACHE_KEY),
      {}
    );
    existingCache[cacheKey] = cacheEntry;
    safeLocalStorage('set', PROFILE_CACHE_KEY, JSON.stringify(existingCache));
    
    return data;
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    throw err;
  }
}

/**
 * Fetch patient photo URL
 */
async function fetchProfilePhotoUrl(mrn: string): Promise<string> {
  if (!mrn) {
    return DEFAULT_AVATAR;
  }
  
  try {
    const response = await fetch(`/api/patients/mrn/${encodeURIComponent(mrn)}/profile-picture`);
    if (!response.ok) {
      return DEFAULT_AVATAR;
    }
    
    const data = await response.json();
    
    // Use the actual image URL from the database
    if (data && data.imageUrl) {
      return data.imageUrl;
    }
    
    return DEFAULT_AVATAR;
  } catch (err) {
    console.error('Error loading profile photo:', err);
    return DEFAULT_AVATAR;
  }
}

/**
 * Main patient profile hook
 */
export function usePatientProfile(options: {
  persistSession?: boolean;
  loadProfilePhoto?: boolean;
  forceRefresh?: boolean;
  skipCache?: boolean;
  skipPhotoLoading?: boolean;
} = {}) {
  // Map new option names to our internal options for backward compatibility
  const skipCache = options.skipCache === undefined 
    ? !options.persistSession 
    : options.skipCache;
  const skipPhotoLoading = options.skipPhotoLoading === undefined 
    ? !options.loadProfilePhoto 
    : options.skipPhotoLoading;
  const forceRefresh = options.forceRefresh || false;
  
  // State
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>(DEFAULT_AVATAR);
  const [isProfilePhotoLoading, setIsProfilePhotoLoading] = useState(false);
  const [qrCodeValue, setQRCodeValue] = useState<string>('');
  
  // Refs to prevent re-entry and duplicate fetches
  const isRefreshingRef = useRef<boolean>(false);
  const isFetchingPhotoRef = useRef<boolean>(false);
  
  // Memoized function to load the main patient profile data
  const loadPatientProfile = useCallback(async (isForced: boolean = false): Promise<void> => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsLoading(true);
    setError('');

    try {
      const email = getUserEmail();
      const patientId = getPatientId();
      const mrn = safeLocalStorage('get', 'mrn') || safeLocalStorage('get', 'medicalNumber');
      const cacheKey = getCacheKey(mrn, patientId, email);

      // Cache check (in-memory and localStorage)
      if (!isForced && !skipCache) {
        const inMemoryCache = globalProfileCache[cacheKey];
        if (inMemoryCache && (Date.now() - inMemoryCache.timestamp < CACHE_TTL)) {
          setProfile(inMemoryCache.profile);
          setIsLoading(false);
          setIsLoaded(true);
          isRefreshingRef.current = false;
          return;
        }
        
        const localStorageCacheData = safeLocalStorage('get', PROFILE_CACHE_KEY);
        const localStorageCache = safeJsonParse<Record<string, ProfileCacheEntry>>(localStorageCacheData, {});
        const localStorageEntry = localStorageCache[cacheKey];
        if (localStorageEntry && (Date.now() - localStorageEntry.timestamp < CACHE_TTL)) {
          setProfile(localStorageEntry.profile);
          globalProfileCache[cacheKey] = localStorageEntry; // Promote to memory cache
          setIsLoading(false);
          setIsLoaded(true);
          isRefreshingRef.current = false;
          return;
        }
      }

      // API Fetch
      const fetchedProfile = await fetchPatientProfile(email, patientId, mrn);
      if (fetchedProfile) {
        // Ensure both MRN fields are consistent (required by CentralHealth policy)
        if (fetchedProfile.mrn) {
          fetchedProfile.medicalNumber = fetchedProfile.mrn;
        } else if (fetchedProfile.medicalNumber) {
          fetchedProfile.mrn = fetchedProfile.medicalNumber;
        }
        
        // Debug logging to verify patient data
        console.log('Patient profile loaded:', {
          name: `${fetchedProfile.firstName} ${fetchedProfile.lastName}`,
          mrn: fetchedProfile.mrn,
          medicalNumber: fetchedProfile.medicalNumber,
          email: maskIdentifier(fetchedProfile.email)
        });
        
        setProfile(fetchedProfile);
      } else {
        setError('Failed to load patient profile.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      isRefreshingRef.current = false;
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [skipCache]);

  // Function to manually refresh the profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    console.log('Manual profile refresh requested');
    // Clear in-memory cache to force fresh fetch
    globalProfileCache = {};
    // Clear localStorage cache to ensure we get fresh data
    safeLocalStorage('remove', PROFILE_CACHE_KEY);
    
    // Clear photo cache
    if (profile?.mrn) {
      safeLocalStorage('remove', `${PHOTO_CACHE_PREFIX}${profile.mrn}`);
    }
    
    await loadPatientProfile(true);
  }, [loadPatientProfile, profile]);

  // Effect to load the main profile on mount or when forced
  useEffect(() => {
    const shouldForceRefresh = forceRefresh || safeLocalStorage('get', FORCE_REFRESH_KEY) === 'true';
    if (shouldForceRefresh) {
      safeLocalStorage('remove', FORCE_REFRESH_KEY);
      loadPatientProfile(true);
    } else if (!isLoaded) { 
      loadPatientProfile(false);
    }
  }, [forceRefresh, isLoaded, loadPatientProfile]);

  // Effect to set QR code value when profile changes
  useEffect(() => {
    if (profile?.mrn) {
      setQRCodeValue(profile.mrn);
    }
  }, [profile]);
  
  // Effect to load profile photo when profile changes
  useEffect(() => {
    // If profile is null or undefined, nothing to do
    if (!profile) {
      return;
    }
    
    const shouldLoadPhoto = !skipPhotoLoading && profile.mrn && !isFetchingPhotoRef.current;
    
    if (shouldLoadPhoto) {
      isFetchingPhotoRef.current = true;
      setIsProfilePhotoLoading(true);
      
      fetchProfilePhotoUrl(profile.mrn)
        .then((url) => {
          setProfilePhotoUrl(url);
        })
        .catch(() => {
          setProfilePhotoUrl(DEFAULT_AVATAR);
        })
        .finally(() => {
          setIsProfilePhotoLoading(false);
          isFetchingPhotoRef.current = false;
        });
    } else if (!profile.mrn) {
      setProfilePhotoUrl(DEFAULT_AVATAR);
    }
  }, [skipPhotoLoading, profile]);

  return {
    profile,
    isLoading,
    error,
    qrCodeValue,
    profilePhotoUrl,
    isProfilePhotoLoading,
    refreshProfile,
  };
}

// Export utility functions for use in other components
export async function updatePatientProfile(profileData: Partial<PatientProfile>): Promise<PatientProfile> {
  const response = await fetch('/api/patients/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`);
  }

  const data = await response.json();
  return data;
}