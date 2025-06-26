// Using the non-promise version of cookies() from next/headers
// This is important for middleware which runs synchronously
import { cookies } from 'next/headers';

/**
 * Interface for our session data structure from the create-session API
 */
interface PatientSession {
  medicalId: string;
  email?: string;
  isLoggedIn: boolean;
  isTemporary?: boolean;
  createdAt?: string;
  onboardingCompleted?: boolean; // Added to match the API's session data structure
}

/**
 * Patient information returned from session authentication
 */
interface PatientAuthInfo {
  id: string;
  medicalId: string;
  email?: string;
  name?: string;
  authenticated: boolean;
  onboardingCompleted: boolean;
}

/**
 * Gets the authenticated patient from the session cookie.
 * Uses the JSON session cookie format from the create-session API.
 * 
 * @returns The patient data object if authenticated, null otherwise
 */
export function getPatientFromSession(): PatientAuthInfo | null {
  try {
    // Get the cookies store - handling both synchronous and asynchronous cases
    const cookieStore = cookies();
    // Check if cookies() returned a promise (middleware context) or direct object
    let sessionCookie;
    let cookieValue;
    
    // Handle both sync and async cookie stores
    if ('get' in cookieStore) {
      try {
        // Direct access (synchronous) with proper type casting
        const typedCookieStore = cookieStore as { get(name: string): { value: string } | undefined };
        sessionCookie = typedCookieStore.get('patient_session');
        cookieValue = sessionCookie?.value;
      } catch (e) {
        console.error('Error accessing cookie:', e);
        return null;
      }
    } else {
      // This is likely a Promise - we can't await in middleware
      // Instead, we'll use localStorage as fallback for compatibility
      console.log('Cookie store is not directly accessible, using fallback');
      return null;
    }
    
    // No cookie value means no session
    if (!cookieValue) {
      console.log('No patient session cookie found');
      return null;
    }
    
    // Try to parse the cookie as JSON
    try {
      const sessionData = JSON.parse(cookieValue) as PatientSession;
      
      // Validate the session data has a medical ID which is our identifier
      if (sessionData?.medicalId) {
        console.log('Valid patient session found with medical ID:', sessionData.medicalId);
        
        // Use the actual onboardingCompleted status from the session
        // This is critical because the middleware checks for this property
        const isOnboardingCompleted = sessionData.onboardingCompleted === true;
        
        console.log('Session onboardingCompleted status:', {
          fromSession: sessionData.onboardingCompleted,
          finalValue: isOnboardingCompleted
        });
        
        return {
          id: sessionData.medicalId,
          medicalId: sessionData.medicalId,
          email: sessionData.email || '',
          authenticated: true,
          onboardingCompleted: isOnboardingCompleted
        };
      }
    } catch (error) {
      console.error('Error parsing session cookie:', error);
    }
    
    return null;
  } catch (error) {
    console.error('Error accessing patient session:', error);
    return null;
  }
}
