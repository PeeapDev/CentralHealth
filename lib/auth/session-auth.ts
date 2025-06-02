import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';

// Extend the JWTPayload to include patient-specific properties
interface PatientJWTPayload extends JWTPayload {
  patientId?: string;
  name?: string;
  onboardingCompleted?: boolean;
  // Add other patient-specific fields as needed
}

/**
 * Get the authenticated patient from the session
 * @returns The patient data if authenticated, null otherwise
 */
export async function getPatientFromSession() {
  try {
    // Get the cookie store and handle it as a promise if needed
    const cookieStore = cookies();
    // Since cookieStore is not a promise in the latest Next.js, this works without await
    const sessionCookie = cookieStore.get('patient_session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    
    // Verify the JWT token from the cookie
    try {
      const payload = await verifyToken(sessionCookie.value) as PatientJWTPayload;
      
      // Check if this is a patient token (not an admin/staff token)
      if (!payload || !payload.patientId) {
        return null;
      }
      
      // Return the patient data from the token payload
      return {
        id: payload.patientId,
        name: payload.name,
        onboardingCompleted: payload.onboardingCompleted || false,
        authenticated: true,
        ...payload
      };
    } catch (jwtError) {
      console.error('Invalid or expired JWT token:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('Error getting patient from session:', error);
    return null;
  }
}
