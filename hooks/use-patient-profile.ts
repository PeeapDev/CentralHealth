"use client";

import { useState, useEffect } from 'react';
import { DEFAULT_HOSPITAL } from '@/lib/hospital-context';
import { getUserEmail, getPatientId, clearPatientData } from '@/utils/session-utils';

export interface PatientProfile {
  id: string;
  patientId: string;
  medicalNumber?: string;
  displayMedicalNumber?: string;
  medicalID?: string; // Added for compatibility with variations in API responses
  name: string;
  fullName?: string; // Added to match API response format
  firstName?: string;
  lastName?: string;
  dob: string;
  dateOfBirth?: string; // Added for compatibility with variations in API responses
  birthDate?: Date | null;
  age: number;
  gender: string;
  bloodType: string;
  height: string;
  weight: string;
  address: string;
  phone: string;
  email: string;
  hospitalCode: string;
  hospitalName?: string; // Added to match hospital data in API responses
  room?: string;
  admittedDate?: string;
  attendingDoctor?: string;
  onboardingCompleted?: boolean;
  profileImage?: string; // Added for profile photo from API
  avatarUrl?: string; // Added for profile photo URL
  insurance: {
    provider: string;
    policyNumber: string;
    group: string;
    expirationDate: string;
  };
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  allergies: Array<{
    name: string;
    severity: string;
  }>;
  conditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
  photo?: string; // Patient profile photo as base64 string
  qrCode?: string; // Added for stored QR code data from registration
}

// Note: We're now using the clearPatientData function imported from utils/session-utils.ts
// This provides better consistency across the application

// Fetch patient profile from the API
async function fetchPatientProfile(): Promise<PatientProfile> {
  console.log('DEBUG: Checking localStorage values')
  console.log('localStorage.userEmail:', typeof window !== 'undefined' ? localStorage.getItem('userEmail') : 'N/A');
  console.log('localStorage.patientId:', typeof window !== 'undefined' ? localStorage.getItem('patientId') : 'N/A');
  console.log('sessionStorage.userEmail:', typeof window !== 'undefined' ? sessionStorage.getItem('userEmail') : 'N/A');
  
  // Get the current user's email
  const userEmail = getUserEmail();
  const patientId = getPatientId();
  
  console.log('Resolved userEmail:', userEmail);
  console.log('Resolved patientId:', patientId);
  
  // Do not override real authentication data if it exists
  // Only log that we're missing identifiers for debugging purposes
  if (!userEmail && !patientId) {
    console.log('No authentication data found. User may need to sign in again.');
  }
  
  // Check for session cookie data first (most reliable source)
  const sessionCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('patient_session='));
  
  let sessionData = null;
  if (sessionCookie) {
    try {
      const decodedCookie = decodeURIComponent(sessionCookie.split('=')[1]);
      sessionData = JSON.parse(decodedCookie);
      console.log('Found session cookie data:', 
        { patientId: sessionData.patientId, medicalNumber: sessionData.medicalNumber });
    } catch (e) {
      console.error('Failed to parse session cookie:', e);
    }
  }

  // Use standard session data for all patients
  const email = userEmail;
  let id = sessionData?.patientId || patientId;
  let medicalNumber = sessionData?.medicalNumber || localStorage.getItem('medicalNumber') || localStorage.getItem('medicalId');
  
  // Build the API URL with all possible parameters for maximum chance of success
  const url = new URL('/api/patients/profile', window.location.origin);
  
  // Store these values in localStorage to aid in recovery if needed
  if (id) localStorage.setItem('patientId', id);
  if (medicalNumber) localStorage.setItem('medicalNumber', medicalNumber);
  if (email) localStorage.setItem('userEmail', email);
  
  // Add ALL available identifiers to maximize chances of finding the patient
  // Previously we only sent one parameter, now we send all we have
  let hasIdentifier = false;
  
  if (id) {
    url.searchParams.append('patientId', id);
    console.log('Including patientId in profile request:', id);
    hasIdentifier = true;
  }
  
  if (medicalNumber) {
    url.searchParams.append('medicalNumber', medicalNumber);
    console.log('Including medicalNumber in profile request:', medicalNumber);
    hasIdentifier = true;
  }
  
  if (email) {
    url.searchParams.append('email', email);
    console.log('Including email in profile request:', email);
    hasIdentifier = true;
  }
  
  if (!hasIdentifier) {
    console.error('No patient identifier available in storage or cookies');
    throw new Error('Please log in or register to view your profile');
  }
  
  console.log('Sending API request to:', url.toString());
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API response status:', response.status);
    
    // Handle non-OK responses with more detailed error info
    if (!response.ok) {
      // Check the content type to avoid parsing HTML as JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          console.error('API error response data:', errorData);
          throw new Error(errorData.error || `Failed with status ${response.status}`);
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          throw new Error(`API error ${response.status}: ${response.statusText}`);
        }
      } else {
        // If not JSON, don't try to parse it
        console.error('Non-JSON response received:', await response.text().catch(() => 'Unable to read response text'));
        throw new Error(`API returned non-JSON response with status ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse successful response
    // Check if the response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Expected JSON response but got:', contentType);
      const responseText = await response.text().catch(() => 'Unable to read response text');
      console.error('Response text preview:', responseText.substring(0, 200) + '...');
      throw new Error('API returned non-JSON response');
    }
    
    try {
      const data = await response.json();
      console.log('API returned patient data successfully');
      
      // Ensure hospitalCode exists to prevent "hospital not found" errors
      // This is important because we're using a centralized hospital system
      if (!data.hospitalCode) {
        data.hospitalCode = DEFAULT_HOSPITAL.id;
      }
      
      // Helper function to calculate age from DOB string
      const calculateAgeFromDob = (dobString: string | undefined | null): number => {
        if (!dobString) return 0;
        try {
          const dob = new Date(dobString);
          if (isNaN(dob.getTime())) return 0;
          
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          
          return age;
        } catch (e) {
          console.error('Error calculating age:', e);
          return 0;
        }
      };
      
      // Format profile data with default values as needed
      return {
        id: data.id || id,
        patientId: data.id || id,
        medicalNumber: data.medicalNumber,
        displayMedicalNumber: data.displayMedicalNumber || medicalNumber,
        medicalID: data.medicalID || data.medicalNumber || medicalNumber, // For compatibility
        name: data.fullName || data.name || data.displayName || 'Unknown',
        fullName: data.fullName || data.name || data.displayName || 'Unknown',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        dob: data.dob || data.dateOfBirth || '',
        dateOfBirth: data.dateOfBirth || data.dob || '',
        birthDate: data.birthDate || null,
        age: data.age || calculateAgeFromDob(data.dob || data.dateOfBirth),
        gender: data.gender || 'Other',
        bloodType: data.bloodType || 'Unknown',
        height: data.height || '',
        weight: data.weight || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || userEmail || '',
        hospitalCode: data.hospitalCode || DEFAULT_HOSPITAL.id,
        hospitalName: data.hospitalName || DEFAULT_HOSPITAL.name,
        room: data.room || '',
        admittedDate: data.admittedDate || '',
        attendingDoctor: data.attendingDoctor || '',
        onboardingCompleted: data.onboardingCompleted || false,
        // Include default values for required properties in the PatientProfile interface
        insurance: data.insurance || {
          provider: '',
          policyNumber: '',
          group: '',
          expirationDate: ''
        },
        allergies: data.allergies || [],
        conditions: data.conditions || [],
        medications: data.medications || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        profileImage: data.photo || data.profileImage || data.avatarUrl || 
          (data.id ? `${window.location.origin}/api/patients/${data.id}/photo` : undefined),
        avatarUrl: data.avatarUrl || 
          (data.id ? `${window.location.origin}/api/patients/${data.id}/photo` : undefined),
        photo: data.photo || data.profileImage || data.avatarUrl || 
          (data.id ? `${window.location.origin}/api/patients/${data.id}/photo` : undefined)
      };
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse patient data from server');
    }
  } catch (fetchError) {
    console.error('Fetch operation failed:', fetchError);
    throw fetchError;
  }
}

export function usePatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('/auth/login');

  useEffect(() => {
    // If we need to redirect due to auth issues
    if (shouldRedirect) {
      // Clear all stored data since it's causing problems
      clearPatientData();
      
      // Redirect to login/onboarding page
      if (typeof window !== 'undefined') {
        console.log(`Redirecting to ${redirectTarget} due to auth issues`);
        setTimeout(() => {
          window.location.href = redirectTarget;
        }, 2000); // Small delay to allow user to see the error message
        return;
      }
    }
  }, [shouldRedirect, redirectTarget]);

  useEffect(() => {
    async function loadPatientProfile() {      
      try {
        // Clear any cached incorrect medical IDs from localStorage
        // No special handling for specific medical IDs as per CentralHealth rules

        // Check if we have authentication data before making API call
        const userEmail = getUserEmail();
        const patientId = getPatientId();
        
        if (!userEmail && !patientId) {
          console.log('No auth data found, will redirect to login');
          setError('Please sign in to view your dashboard');
          setRedirectTarget('/auth/login');
          setShouldRedirect(true);
          return null;
        }
        
        // Check if we're in a recovery loop by using a counter in sessionStorage
        const recoveryAttempts = parseInt(sessionStorage.getItem('profileRecoveryAttempts') || '0');
        if (recoveryAttempts > 2) { // Limit to 3 attempts (0, 1, 2)
          console.error('Too many recovery attempts, showing error to user');
          setError("We're having trouble loading your profile. Please try logging in again.");
          setRedirectTarget('/auth/login');
          setShouldRedirect(true);
          setIsLoading(false);
          return null;
        }
        
        setIsLoading(true);
        const profileData = await fetchPatientProfile();
        
        // Success! Reset recovery counter
        sessionStorage.removeItem('profileRecoveryAttempts');
        
        // Try to find photo URL - use our new endpoint if a photo isn't provided directly
        try {
          // Check if profile has photo
          if (profileData.photo) {
            localStorage.setItem('patientProfilePhoto', profileData.photo);
          } else {
            // Try to load from registration data as fallback
            const registrationData = localStorage.getItem('patientRegistrationData');
            if (registrationData) {
              const parsedData = JSON.parse(registrationData);
              if (parsedData.photo) {
                localStorage.setItem('patientProfilePhoto', parsedData.photo);
              }
            }
          }
        } catch (photoError) {
          console.error('Error loading patient photo:', photoError);
        }
        
        // Make sure we have the name property populated from fullName for frontend compatibility
        const processedProfile = {
          ...profileData,
          // If API returns fullName but not name, use fullName as name
          name: profileData.name || profileData.fullName || 'Unknown',
          // If API returns name but not fullName, use name as fullName
          fullName: profileData.fullName || profileData.name || 'Unknown'
        };
        
        setProfile(processedProfile);
        setError(null);

        // Check if onboarding is needed
        if (profileData && !profileData.onboardingCompleted) {
          console.log('Patient onboarding not completed');
          // Could redirect to onboarding here or handle in the UI
        }
      } catch (error: any) {
        console.error('Error fetching patient profile:', error);
        setIsLoading(false);
        
        // Extract error message
        let errorMessage = error.message || 'Failed to load profile';
        console.error('Error message:', errorMessage);
        
        // Handle 404 errors specially - try to create a session with stored medical ID or patient ID
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          // Increment recovery counter to prevent infinite loops
          const currentAttempts = parseInt(sessionStorage.getItem('profileRecoveryAttempts') || '0');
          const newAttempts = currentAttempts + 1;
          sessionStorage.setItem('profileRecoveryAttempts', newAttempts.toString());
          
          console.log(`Patient not found (404), recovery attempt ${newAttempts}/3`);
          
          // Stop after 3 attempts to prevent infinite loops
          if (newAttempts > 2) {
            console.error('Maximum recovery attempts reached, giving up');
            errorMessage = 'We could not find your patient account. Please log in again.';
            setError(errorMessage);
            setRedirectTarget('/auth/login');
            setShouldRedirect(true);
            return null;
          }
          
          try {
            console.log('Attempting to use available medical ID from storage');
            // No hardcoded medical IDs or special handling for test accounts as per CentralHealth rules
            const storedPatientId = localStorage.getItem('patientId');
            const storedMedicalNumber = localStorage.getItem('medicalNumber');
            
            // Use ONLY the real medical ID - never generate a new one or use invalid cached ones
            const medicalId = storedMedicalNumber;
            
            console.log(`Forcing recovery with Fatima Kamara's real medical ID: ${medicalId}`);
            
            // Request body for the API call - only send the real medical ID
            // This ensures we never create new patients or IDs
            const requestBody = {
              medicalId: medicalId,
              onboardingCompleted: true, // Always true to prevent redirect loops
            };
            
            // Call the create-session API
            const response = await fetch('/api/patients/create-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
              // If first attempt failed, try one more time with just the patientId if we have it
              if (storedPatientId) {
                console.log('First attempt failed, trying with patientId:', storedPatientId);
                const secondResponse = await fetch('/api/patients/create-session', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ patientId: storedPatientId, onboardingCompleted: true })
                });
                
                if (!secondResponse.ok) {
                  throw new Error(`Session creation failed: ${secondResponse.status} ${secondResponse.statusText}`);
                }
              } else {
                throw new Error(`Session creation failed: ${response.status} ${response.statusText}`);
              }
            }
            
            // Add a small delay before reloading to prevent too rapid retries
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // If we successfully created a session, reload the page to access the dashboard with new cookie
            window.location.href = `/patient/dashboard?ts=${Date.now()}`;
            return null; // Return null since we're reloading the page
          } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError);
            errorMessage = 'We could not find your patient account. Please log in again.';
          }  
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          setError("Your session has expired. Please sign in again.");
          setRedirectTarget('/auth/login');
          setShouldRedirect(true);
        } else if (errorMessage.includes('5')) { // 500 errors
          setError("The server encountered an error. Please try again later.");
        } else {
          setError("We're having trouble loading your profile. Please try again or sign in again.");
          setRedirectTarget('/auth/login');
          setShouldRedirect(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadPatientProfile();
  }, []);

  // Get QR code from profile or generate a fallback
  const getQrCodeValue = () => {
    if (!profile) return "";
    
    // If the profile has a stored QR code from registration, use it
    if (profile.qrCode) {
      console.log('Using stored QR code from database');
      return profile.qrCode;
    }
    
    // Fallback to generating QR code data if not stored in database
    // This uses the same format as our QR code generator: CentralHealth:MRN
    console.log('No stored QR code found, using fallback format');
    const medicalId = profile.medicalNumber || profile.displayMedicalNumber || profile.medicalID || '';
    return `CentralHealth:${medicalId}`;
  };

  return { 
    profile, 
    isLoading, 
    error,
    qrCodeValue: getQrCodeValue()
  };
}

// API functions for updating patient profile
export async function updatePatientProfile(profileData: Partial<PatientProfile>): Promise<PatientProfile> {
  const response = await fetch('/api/patients/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update patient profile');
  }

  return await response.json();
}

export async function completeOnboarding(onboardingData: any): Promise<{ success: boolean }> {
  const response = await fetch('/api/patients/onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(onboardingData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to complete patient onboarding');
  }

  return await response.json();
}
