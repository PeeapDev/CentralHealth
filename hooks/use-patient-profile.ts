"use client";

import { useState, useEffect } from 'react';
import { DEFAULT_HOSPITAL } from '@/lib/hospital-context';
import { getUserEmail, getPatientId, clearPatientData } from '@/utils/session-utils';

export type PatientProfile = {
  id: string;
  patientId: string;
  medicalNumber?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dob: string;
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
  room?: string;
  admittedDate?: string;
  attendingDoctor?: string;
  onboardingCompleted?: boolean;
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
};

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
  
  // Use the values we've retrieved
  const email = userEmail;
  const id = patientId;
  
  // Build the API URL with the email parameter
  const url = new URL('/api/patients/profile', window.location.origin);
  
  // Add user identification parameters if available
  if (email) {
    url.searchParams.append('email', email);
    console.log('Fetching patient profile with email:', email);
  } else if (id) {
    url.searchParams.append('patientId', id);
    console.log('Fetching patient profile with ID:', id);
  } else {
    console.error('No patient identifier available in storage, even after fallback');
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
      
      return data;
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
        // Check if we have authentication data before making API call
        const userEmail = getUserEmail();
        const patientId = getPatientId();
        
        if (!userEmail && !patientId) {
          console.log('No auth data found, will redirect to login');
          setError('Please sign in to view your dashboard');
          setRedirectTarget('/auth/login');
          setShouldRedirect(true);
          return;
        }
        
        setIsLoading(true);
        const profileData = await fetchPatientProfile();
        
        // Load profile photo from registration data if available
        try {
          const registrationData = localStorage.getItem('patientRegistrationData');
          if (registrationData) {
            const parsedData = JSON.parse(registrationData);
            if (parsedData.photo) {
              // Store the onboarding photo in localStorage for consistent access
              localStorage.setItem('patientProfilePhoto', parsedData.photo);
              console.log('Successfully loaded patient photo from registration data');
            }
          }
        } catch (photoError) {
          console.error('Error loading patient photo from registration data:', photoError);
        }
        
        setProfile(profileData);
        setError(null);

        // Check if onboarding is needed
        if (profileData && !profileData.onboardingCompleted) {
          console.log('Patient onboarding not completed');
          // Could redirect to onboarding here or handle in the UI
        }
      } catch (err) {
        console.error("Error loading patient profile:", err);
        
        // Check if this was a 401/403 authentication error to provide a helpful message
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('401') || errorMessage.includes('403')) {
          setError("Your session has expired. Please sign in again.");
          setRedirectTarget('/auth/login');
          setShouldRedirect(true);
        } else if (errorMessage.includes('404')) {
          setError("We couldn't find your patient profile. Please complete the onboarding process.");
          // For 404, we should redirect to onboarding
          setRedirectTarget('/onboarding');
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

  // Generate QR code data string
  const getQrCodeValue = () => {
    if (!profile) return "";
    return `PATIENT:${profile.patientId}|NAME:${profile.name}|DOB:${profile.dob}|BLOOD:${profile.bloodType}`;
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
