"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { getUserEmail, getPatientId, clearPatientData } from '../utils/session-utils';
import { redirect } from 'next/navigation';

// Default hospital fallback
const DEFAULT_HOSPITAL = 'CENTRAL';

/**
 * Patient profile interface
 * Comprehensive patient information model
 */
export interface PatientProfile {
  // Patient identifiers
  id: string;
  patientId: string;
  mrn: string; // Standard medical record number per CentralHealth standards
  medicalNumber: string; // Legacy field - maintained for backward compatibility
  displayMedicalNumber: string; // Legacy field - maintained for backward compatibility
  
  // Personal information
  name: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dob: string;
  dateOfBirth: string;
  birthDate: Date | string | null;
  age: number;
  gender: string;
  
  // Medical information
  bloodType: string;
  height: string;
  weight: string;
  
  // Contact information
  address: string;
  phone: string;
  email: string;
  
  // Hospital information
  hospitalCode: string;
  hospitalName: string;
  room: string;
  admittedDate: string;
  attendingDoctor: string;
  
  // Media and identification
  photo?: string;
  profileImage?: string;
  avatarUrl?: string;
  qrCode?: string;
  
  // Status flags
  onboardingCompleted: boolean;
  
  // Insurance details
  insurance: {
    provider: string;
    policyNumber: string;
    group: string;
    expirationDate: string;
  };
  
  // Emergency contacts
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  
  // Medical details
  allergies: string[];
  conditions: string[];
  medications: string[];
}

/**
 * Return type definition for the usePatientProfile hook
 */
interface UsePatientProfileResult {
  profile: PatientProfile | null;
  isLoading: boolean;
  error: string;
  qrCodeValue: string;
  profilePhotoUrl: string;
  isProfilePhotoLoading: boolean;
  refreshProfile: () => Promise<void>;
}

/**
 * Global in-memory cache for patient profiles during the session
 * This avoids redundant fetches across component instances
 */
interface ProfileCacheEntry {
  profile: PatientProfile;
  timestamp: number;
}

// Using let instead of const to allow cache clearing
let globalProfileCache: Record<string, ProfileCacheEntry> = {};

// Cache time-to-live in milliseconds (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;

// Force refresh flag key in localStorage
const FORCE_REFRESH_KEY = 'patient_profile_force_refresh';

// Profile cache key in localStorage
const PROFILE_CACHE_KEY = 'cached_patient_profile';

// Navigation timestamp to prevent redundant loading on page changes
let lastNavigationTimestamp = 0;

// Optimization flag to track if we've already loaded the profile during this session
let initialProfileLoadComplete = false;

// Utility function to safely access localStorage
function safeLocalStorage(operation: 'get' | 'set' | 'remove', key: string, value?: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    if (operation === 'get') {
      return localStorage.getItem(key);
    } else if (operation === 'set' && value !== undefined) {
      localStorage.setItem(key, value);
      return value;
    } else if (operation === 'remove') {
      localStorage.removeItem(key);
    }
    return null;
  } catch (error) {
    console.error(`LocalStorage ${operation} error for key ${key}:`, error);
    return null;
  }
}

/**
 * Safe JSON parse with error handling
 */
function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
}

/**
 * Calculate age from date of birth
 */
function calculateAgeFromDob(dob: string): number {
  if (!dob) return 0;
  
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
}

/**
 * Generate QR code value from patient data
 * Following CentralHealth rules: NEVER regenerate medical IDs for existing patients
 */
function generateQRCodeValue(profile: PatientProfile | null): string {
  if (!profile) return '';
  
  // Use existing medical number if available (never regenerate according to CentralHealth rules)
  if (profile.medicalNumber) {
    return `CentralHealth:${profile.medicalNumber}`;
  }
  
  // Fallback to patientId if medical number is not available
  if (profile.patientId) {
    return `CentralHealth:ID:${profile.patientId}`;
  }
  
  // Last resort (should never happen in production systems per CentralHealth rules)
  return '';
}

/**
 * Generate a consistent cache key based on available patient identifiers
 * Prioritizes medicalNumber > patientId > email
 */
function getCacheKey(medicalNumber?: string | null, patientId?: string | null, email?: string | null): string {
  if (medicalNumber) return `med_${medicalNumber}`;
  if (patientId) return `pid_${patientId}`;
  if (email) return `email_${email}`;
  return 'unknown_patient';
}

/**
 * Fetch patient profile from API
 * Includes multiple identifier strategies and comprehensive error handling
 */
async function fetchPatientProfile(
  email?: string | null,
  patientId?: string | null,
  mrn?: string | null
): Promise<PatientProfile | null> {
  console.log('Fetching patient profile with identifiers:', { email, patientId, mrn });
  const startTime = performance.now();
  
  try {
    // Build query params with available identifiers
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (patientId) params.append('patientId', patientId);
    if (mrn) params.append('medicalNumber', mrn); // Still using medicalNumber as param name for API compatibility
    
    const response = await fetch(`/api/patients/profile?${params.toString()}`);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('Session expired, redirecting to login');
        clearPatientData();
        redirect('/login');
      }
      
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Performance logging
    const endTime = performance.now();
    console.log(`Profile fetch completed in ${Math.round(endTime - startTime)}ms`);
    
    // Normalize the response into our PatientProfile structure
    const profile: PatientProfile = {
      // Core identifiers - preserve existing medical ID (critical for CentralHealth)
      id: data.id || '',
      patientId: data.patientId || patientId || '',
      mrn: data.mrn || data.medicalNumber || mrn || '', // Standard field name per CentralHealth
      medicalNumber: data.medicalNumber || '', // Legacy field - keep for backward compatibility
      displayMedicalNumber: data.displayMedicalNumber || data.medicalNumber || '', // Legacy field
      
      // Name fields
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      fullName: data.fullName || data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      
      // Date of birth fields
      dob: data.dob || data.dateOfBirth || '',
      dateOfBirth: data.dateOfBirth || data.dob || '',
      birthDate: data.birthDate || null,
      
      // Calculate age or use provided value
      age: data.age || calculateAgeFromDob(data.dob || data.dateOfBirth),
      
      // Contact and demographic information
      gender: data.gender || '',
      bloodType: data.bloodType || '',
      height: data.height || '',
      weight: data.weight || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || email || '', // Use provided email as fallback
      
      // Hospital information
      hospitalCode: data.hospitalCode || DEFAULT_HOSPITAL,
      hospitalName: data.hospitalName || '',
      room: data.room || '',
      admittedDate: data.admittedDate || '',
      attendingDoctor: data.attendingDoctor || '',
      
      // Photo and QR code data
      photo: data.photo || data.profileImage || data.profilePicture || '',
      profileImage: data.profileImage || data.photo || data.profilePicture || '',
      avatarUrl: data.avatarUrl || data.userPhoto || '',
      qrCode: data.qrCode || '',
      
      // Status flags
      onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : true,
      
      // Insurance information
      insurance: data.insurance || {
        provider: '',
        policyNumber: '',
        group: '',
        expirationDate: ''
      },
      
      // Emergency contacts
      emergencyContacts: data.emergencyContacts || [],
      
      // Medical details
      allergies: data.allergies || [],
      conditions: data.conditions || [],
      medications: data.medications || []
    };
    
    // Update cache with fresh data
    if (profile.medicalNumber || profile.patientId || profile.email) {
      const cacheKey = getCacheKey(profile.medicalNumber, profile.patientId, profile.email);
      
      // Update in-memory cache
      globalProfileCache[cacheKey] = {
        profile,
        timestamp: Date.now()
      };
      
      // Update localStorage cache
      const localStorageCache = safeJsonParse<Record<string, ProfileCacheEntry>>(
        safeLocalStorage('get', PROFILE_CACHE_KEY), 
        {}
      );
      
      localStorageCache[cacheKey] = {
        profile,
        timestamp: Date.now()
      };
      
      safeLocalStorage('set', PROFILE_CACHE_KEY, JSON.stringify(localStorageCache));
    }
    
    return profile;
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    
    // Handle session expiration
    if (error instanceof Error && error.message.includes('401')) {
      clearPatientData();
      redirect('/login');
    }
    
    return null;
  }
}

/**
 * Hook for accessing and caching patient profile data with built-in caching
 * Uses a multi-level approach:
 * 1. In-memory cache during the session
 * 2. LocalStorage persistence across page reloads
 * 3. Progressive loading to provide immediate feedback
 */
export function usePatientProfile(
  options: {
    forceRefresh?: boolean;
    skipCache?: boolean;
    loadProfilePhoto?: boolean;
  } = {}
): UsePatientProfileResult {
  // State for patient profile data
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [qrCodeValue, setQRCodeValue] = useState<string>('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [isProfilePhotoLoading, setIsProfilePhotoLoading] = useState<boolean>(false);
  
  // Prevent duplicate refreshes
  const isRefreshingRef = useRef<boolean>(false);
  
  // Function to fetch patient profile with multi-level caching
  const loadPatientProfile = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    
    try {
      setIsLoading(true);
      setError('');
      
      // Get patient identifiers
      const email = getUserEmail();
      const patientId = getPatientId();
      
      // Try to get medical record number from localStorage - use mrn field per CentralHealth standards
      // Check both mrn (new standard) and medicalNumber (legacy) for backward compatibility
      const mrn = safeLocalStorage('get', 'mrn') || safeLocalStorage('get', 'medicalNumber');
      
      if (!email && !patientId && !mrn) {
        throw new Error('No patient identifiers available');
      }
      
      // Generate cache key from available identifiers
      const cacheKey = getCacheKey(mrn, patientId, email);
      
      // Check if we need to force refresh
      const shouldForceRefresh = forceRefresh || options.forceRefresh || 
        safeJsonParse<boolean>(safeLocalStorage('get', FORCE_REFRESH_KEY), false);
      
      // Clear force refresh flag after checking
      if (shouldForceRefresh) {
        safeLocalStorage('remove', FORCE_REFRESH_KEY);
      }
      
      // Skip cache if explicitly requested or forced refresh
      if (!options.skipCache && !shouldForceRefresh) {
        // Try in-memory cache first (fastest)
        const inMemoryCacheEntry = globalProfileCache[cacheKey];
        
        if (inMemoryCacheEntry) {
          const isCacheValid = (Date.now() - inMemoryCacheEntry.timestamp) < CACHE_TTL;
          
          if (isCacheValid) {
            console.log('Using in-memory cached profile data');
            setProfile(inMemoryCacheEntry.profile);
            setQRCodeValue(generateQRCodeValue(inMemoryCacheEntry.profile));
            setIsLoading(false);
            
            // Return early but still update in background after a delay
            setTimeout(() => {
              fetchPatientProfile(email, patientId, mrn)
                .then(freshProfile => {
                  if (freshProfile) {
                    setProfile(freshProfile);
                    setQRCodeValue(generateQRCodeValue(freshProfile));
                  }
                })
                .catch(console.error)
                .finally(() => {
                  isRefreshingRef.current = false;
                });
            }, 2000);
            
            return;
          }
        }
        
        // Try localStorage cache if in-memory cache is not available or expired
        const localStorageCacheData = safeLocalStorage('get', PROFILE_CACHE_KEY);
        const localStorageCache = safeJsonParse<Record<string, ProfileCacheEntry>>(localStorageCacheData, {});
        const localStorageCacheEntry = localStorageCache[cacheKey];
        
        if (localStorageCacheEntry) {
          const isCacheValid = (Date.now() - localStorageCacheEntry.timestamp) < CACHE_TTL;
          
          if (isCacheValid) {
            console.log('Using localStorage cached profile data');
            
            // Update in-memory cache
            globalProfileCache[cacheKey] = localStorageCacheEntry;
            
            // Update state
            setProfile(localStorageCacheEntry.profile);
            setQRCodeValue(generateQRCodeValue(localStorageCacheEntry.profile));
            setIsLoading(false);
            
            // Return early but still update in background after a delay
            setTimeout(() => {
              fetchPatientProfile(email, patientId, mrn)
                .then(freshProfile => {
                  if (freshProfile) {
                    setProfile(freshProfile);
                    setQRCodeValue(generateQRCodeValue(freshProfile));
                  }
                })
                .catch(console.error)
                .finally(() => {
                  isRefreshingRef.current = false;
                });
            }, 2000);
            
            return;
          }
        }
      }
      
      // If we get here, we need to fetch fresh data
      console.log('Fetching fresh profile data');
      const freshProfile = await fetchPatientProfile(email, patientId, mrn);
      
      if (freshProfile) {
        setProfile(freshProfile);
        setQRCodeValue(generateQRCodeValue(freshProfile));
      } else {
        throw new Error('Failed to fetch patient profile');
      }
    } catch (error) {
      console.error('Error loading patient profile:', error);
      setError(error instanceof Error ? error.message : String(error));
      
      // Handle auth errors
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('403'))) {
        clearPatientData();
        redirect('/login');
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [options.forceRefresh, options.skipCache]);
  
  // Function to manually refresh the profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    console.log('Manual profile refresh requested');
    
    // Set force refresh flag in localStorage so other components know to refresh as well
    safeLocalStorage('set', FORCE_REFRESH_KEY, JSON.stringify(true));
    
    // Clear in-memory cache to force fresh fetch
    globalProfileCache = {};
    
    return loadPatientProfile(true);
  }, [loadPatientProfile]);
  
  // Load profile photo from dedicated endpoint
  const loadProfilePhoto = useCallback(async (medicalId: string) => {
    if (!medicalId || isProfilePhotoLoading) return;
    
    setIsProfilePhotoLoading(true);
    
    // Set default avatar immediately for better UX
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg==';
    setProfilePhotoUrl(defaultAvatar);
    
    // Check localStorage first for cached photo
    try {
      const cachedPhoto = safeLocalStorage('get', `patient_photo_${medicalId}`);
      const cachedTimestamp = safeLocalStorage('get', `patient_photo_timestamp_${medicalId}`);
      const now = Date.now();
      const cacheMaxAge = 1000 * 60 * 30; // 30 minutes cache duration
      
      // Check if we have a valid cached timestamp and it's recent enough
      const timestamp = cachedTimestamp ? parseInt(cachedTimestamp as string, 10) : 0;
      const isCacheValid = now - timestamp < cacheMaxAge;
      
      if (cachedPhoto && typeof cachedPhoto === 'string' && isCacheValid) {
        if (cachedPhoto === 'NO_PHOTO_AVAILABLE') {
          // We previously determined this patient has no photo
          console.log('Using cached "no photo" status from localStorage');
          // Already set default above, keep that
          // Skip the API call entirely by returning early
          setIsProfilePhotoLoading(false);
          return;
        } else {
          // We have a valid cached photo
          console.log('Using cached profile photo from localStorage');
          setProfilePhotoUrl(cachedPhoto);
          // Set loading false since we have a good cached value
          setIsProfilePhotoLoading(false);
          return; // Skip API call entirely
        }
      } else if (cachedTimestamp && !isCacheValid) {
        console.log('Cached photo expired, fetching fresh version');
      }
    } catch (e) {
      console.warn('Error accessing cached profile photo:', e);
    }
    
    // Create an AbortController with a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutMs = 8000; // 8 second timeout
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`Making API request for profile photo with ID: ${medicalId}`);
      
      // Make the fetch request with proper signal and headers
      const response = await fetch(`/api/patients/${medicalId}/profile-picture`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error(`Profile photo fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.imageUrl) {
        console.log('Successfully loaded profile photo from API');
        setProfilePhotoUrl(data.imageUrl);
        // Cache successful photos in localStorage for faster subsequent loads
        safeLocalStorage('set', `patient_photo_${medicalId}`, data.imageUrl);
        // Store timestamp of when we last fetched this photo
        safeLocalStorage('set', `patient_photo_timestamp_${medicalId}`, Date.now().toString());
      } else {
        console.log('No profile image found, using default avatar');
        // Also cache negative results to prevent repeated API calls
        // Store a special value to indicate "no photo found"
        safeLocalStorage('set', `patient_photo_${medicalId}`, 'NO_PHOTO_AVAILABLE');
        safeLocalStorage('set', `patient_photo_timestamp_${medicalId}`, Date.now().toString());
      }
    } catch (err) {
      // Handle errors gracefully
      console.error('Error fetching profile photo:', err instanceof Error ? err.message : String(err));
      // Keep using the default photo or cached one - already set above
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsProfilePhotoLoading(false);
    }
  }, [isProfilePhotoLoading]); // Remove profilePhotoUrl from deps to prevent loops

  // Effect to load profile photo when profile data is available - MUST BE FIRST useEffect
  // This effect should run only once per profile change and not block rendering
  useEffect(() => {
    if (profile && options.loadProfilePhoto !== false) {
      const medicalId = profile.medicalNumber || profile.displayMedicalNumber || profile.patientId || profile.id;
      
      // Safety check to prevent unnecessary rerenders
      if (medicalId) {
        // Small delay to ensure UI rendering isn't blocked
        const timer = setTimeout(() => {
          console.log(`Loading profile photo for medical ID: ${medicalId}`);
          loadProfilePhoto(medicalId);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [profile, options.loadProfilePhoto, loadProfilePhoto]);
  
  // Guaranteed exit from loading state
  useEffect(() => {
    // Add a safety timeout to ensure we're never stuck loading
    const maxLoadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('usePatientProfile forcing exit from loading state after timeout');
        setIsLoading(false);
        if (!profile) {
          setError('Failed to load profile data in a reasonable time. Please try again.');
        }
      }
    }, 5000); // 5 seconds maximum loading time
    
    return () => clearTimeout(maxLoadingTimeout);
  }, [isLoading, profile]);
  
  // Effect to load profile data on mount (must be in same position as before)
  useEffect(() => {
    // Check if we've navigated very recently (within 1 second)
    // This prevents duplicate loading during page navigation
    const now = Date.now();
    const hasRecentlyNavigated = now - lastNavigationTimestamp < 1000;
    
    if (options.forceRefresh || !initialProfileLoadComplete || hasRecentlyNavigated === false) {
      // Set a very short timeout to ensure React can render initial UI first
      const timer = setTimeout(() => {
        loadPatientProfile(options.forceRefresh);
      }, 10);
      
      // Update navigation timestamp
      lastNavigationTimestamp = now;
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fallback effect - ensure UI is not stuck in loading state for too long
  useEffect(() => {
    const maxLoadingTime = 10000; // 10 seconds maximum loading time
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('Profile loading took too long, forcing loading state to false');
        setIsLoading(false);
      }
    }, maxLoadingTime);
    
    return () => clearTimeout(fallbackTimer);
  }, [isLoading]);
  
  // Return hook result
  return {
    profile,
    isLoading,
    error,
    qrCodeValue,
    profilePhotoUrl,
    isProfilePhotoLoading,
    refreshProfile
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