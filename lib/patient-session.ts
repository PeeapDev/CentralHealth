import { cookies } from 'next/headers';
import { encrypt, decrypt } from './encryption';

const SESSION_COOKIE_NAME = 'patient-session';
const SESSION_SECRET = process.env.PATIENT_SESSION_SECRET || 'defaultDevSecretForPatientSessionDontUseInProduction';

// Create a more secure alternative to localStorage with cookie-based sessions
export interface PatientSession {
  id: string;
  medicalNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  isLoggedIn: boolean;
  createdAt: string;
}

export async function createPatientSession(patientData: Omit<PatientSession, 'isLoggedIn'>): Promise<void> {
  console.log('Creating patient session with data:', {
    id: patientData.id,
    medicalNumber: patientData.medicalNumber,
    email: patientData.email,
    hasFirstName: !!patientData.firstName,
    hasLastName: !!patientData.lastName
  });
  
  const session: PatientSession = {
    ...patientData,
    isLoggedIn: true
  };
  
  // Encrypt session data
  const encryptedData = encrypt(JSON.stringify(session), SESSION_SECRET);
  console.log('Session data encrypted successfully, length:', encryptedData.length);
  
  // Set session cookie with HttpOnly for security but more permissive settings for dev
  // Note: In development, secure:false ensures the cookie works on http localhost
  const cookieStore = cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: encryptedData,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    // Debug info
    priority: 'high'
  });
  
  console.log('Patient session cookie set successfully');
}

export async function getPatientSession(): Promise<PatientSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const decryptedData = decrypt(sessionCookie.value, SESSION_SECRET);
    const session = JSON.parse(decryptedData) as PatientSession;
    return session;
  } catch (error) {
    console.error('Failed to parse patient session:', error);
    return null;
  }
}

export async function clearPatientSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
