import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearPatientData } from '@/utils/session-utils';

// Define all known patient data storage locations to ensure complete isolation
const PATIENT_DATA_KEYS = [
  // Session and authentication
  'patient_session',
  'patientId',
  'medicalNumber',
  'tempPatientId',
  'authToken',
  
  // Personal information
  'userEmail',
  'patientEmail',
  'patientRegistrationData',
  'patientProfile',
  'patientPhoto',
  
  // Onboarding data
  'onboardingData',
  'onboardingStep',
  'onboardingComplete',
  'tempPatientData',
  
  // Medical information
  'medicalHistory',
  'conditions',
  'medications',
  'allergies',
  
  // Appointment and booking
  'appointments',
  'lastAppointment',
  'bookingData'
];

/**
 * API route handler for patient signout
 * Clears all patient session cookies and redirects to login page
 */
export async function GET() {
  console.log('🔑 Patient signout requested');
  
  try {
    // Get the current cookie to log which patient is signing out
    const patientSessionCookie = cookies().get('patient_session');
    if (patientSessionCookie?.value) {
      try {
        const session = JSON.parse(patientSessionCookie.value);
        console.log(`Patient signing out: Medical ID ${session.medicalId}`);
      } catch (parseError) {
        console.error('Error parsing patient session cookie:', parseError);
      }
    }

    // Delete all patient-related cookies by setting them to expire in the past
    // This ensures complete session isolation
    PATIENT_DATA_KEYS.forEach(key => {
      cookies().set(key, '', {
        expires: new Date(0), // Set to epoch time (expired)
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    });
    
    // Return both response and a script to clear localStorage on the client side
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Signing out...</title>
          <script>
            // Clear all patient-related data from localStorage and sessionStorage
            try {
              // Define all patient data keys to ensure complete isolation
              const patientDataKeys = [
                // Session and authentication
                'patientId',
                'medicalNumber',
                'tempPatientId',
                'authToken',
                
                // Personal information
                'userEmail',
                'patientEmail',
                'patientRegistrationData',
                'patientProfile',
                'patientPhoto',
                
                // Onboarding data
                'onboardingData',
                'onboardingStep',
                'onboardingComplete',
                'tempPatientData',
                
                // Medical information
                'medicalHistory',
                'conditions',
                'medications',
                'allergies',
                
                // Appointment and booking
                'appointments',
                'lastAppointment',
                'bookingData'
              ];
              
              // Clear all defined keys from localStorage
              patientDataKeys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
              });
              
              // Additional safety check - clear any items containing patient or medical identifiers
              // This helps catch any custom or dynamically named items
              for(let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('patient') || key.includes('medical') || 
                    key.includes('session') || key.includes('onboarding'))) {
                  localStorage.removeItem(key);
                }
              }
              
              // Do the same for sessionStorage
              for(let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('patient') || key.includes('medical') || 
                    key.includes('session') || key.includes('onboarding'))) {
                  sessionStorage.removeItem(key);
                }
              }
              
              console.log('Successfully cleared all patient data from client storage');
            } catch (error) {
              console.error('Error clearing storage:', error);
            }
            
            // Redirect to login page after clearing storage
            window.location.href = '/auth/login?signedOut=true';
          </script>
        </head>
        <body>
          <p>Signing out, please wait...</p>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error during signout:', error);
    // Even if there's an error, try to redirect to login
    return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  }
}
