import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MedicalIDValidator } from './utils/medical-id';

// SECURITY ENFORCEMENT - Per CentralHealth System Requirements
const ENFORCE_STRICT_AUTH = true; // This must ALWAYS be true in production

// Middleware handles all route protection logic
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Get the cookies for logging purposes only
  const cookies = request.cookies;
  const sessionCookie = cookies.get('patient_session');
  
  // Always log which path is being accessed
  console.log(`🔍 Middleware processing path: ${path} | Has session cookie: ${!!sessionCookie}`);
  
  // Define public paths that should always be accessible
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/patient-login',
    '/auth/patient-signup',
    '/_next',
    '/api',
    '/admin/auth/login',   // Admin login path as public
    '/superadmin',         // Allow superadmin dashboard access
    '/onboarding',         // Onboarding page must be accessible
    '/login',              // Login path to handle login/home redirects
    '/clear-cache.html'    // Allow access to cache clearing page
  ];
  
  // Special handling for registration page - PREVENT registration when patient is already logged in
  // This ensures proper patient isolation and prevents the bug where Tracy's registration redirects to Fatima's account
  if (path === '/register' || path.startsWith('/register')) {
    // If a patient is already logged in (has a session cookie), redirect to dashboard where they can sign out
    if (sessionCookie) {
      console.log('⚠️ Attempted to access registration page while already logged in');
      try {
        // Try to get the user name from the session for logging purposes
        const session = JSON.parse(sessionCookie.value);
        console.log(`Patient with medical ID ${session.medicalId} tried to access registration while logged in`);
      } catch (error) {
        console.error('Error parsing session cookie:', error);
      }
      
      // Redirect to patient dashboard with a notification parameter
      // The dashboard can show a notification based on this parameter
      return NextResponse.redirect(
        new URL('/patient/dashboard?notification=session_warning', request.url)
      );
    }
    // If no session exists, allow access to registration
    return NextResponse.next();
  }
  
  // Always allow access to public paths
  if (publicPaths.some(pp => path.startsWith(pp))) {
    return NextResponse.next();
  }
  
  // STRICT SECURITY: Patient route protection - secure all /patient/* routes
  if (ENFORCE_STRICT_AUTH && path.startsWith('/patient/')) {
    console.log('🔒 Enforcing strict patient route protection for:', path);
    
    // Security audit logging for all access attempts
    console.log(`🛡️ Security audit: Access attempt to ${path}`);
    
    // Check for valid authentication - The order matters for priority
    const patientSession = request.cookies.get('patient_session');
    const authToken = request.cookies.get('authToken');
    const medicalNumber = request.cookies.get('medicalNumber');
    const patientId = request.cookies.get('patientId');
    
    // Security audit logging for credentials
    console.log(`🔍 Auth check: Session=${!!patientSession}, Token=${!!authToken}, MRN=${!!medicalNumber}, ID=${!!patientId}`);
    
    // STRICTLY enforce authentication - NO exceptions for patient routes
    const hasValidAuth = patientSession || authToken || medicalNumber || patientId;
    
    if (!hasValidAuth) {
      console.log('⛔ SECURITY ALERT: Unauthorized access attempt to patient route');
      
      // Redirect to patient login page with return URL for user convenience
      const loginUrl = new URL('/auth/patient-login', request.url);
      loginUrl.searchParams.append('redirect', path);
      
      // Log the redirect for security audit
      console.log(`🔄 Redirecting unauthorized access to ${loginUrl.pathname}`);
      
      return NextResponse.redirect(loginUrl);
    }
    
    // If we have a session, STRICTLY validate it per CentralHealth standards
    if (patientSession) {
      try {
        // Parse and validate the patient session
        const session = JSON.parse(patientSession.value);
        
        // Ensure we have a valid medical ID according to CentralHealth standards
        // Either medicalId or mrn must be present and valid
        const hasMedicalId = session.medicalId && MedicalIDValidator.validate(session.medicalId);
        const hasMRN = session.mrn && MedicalIDValidator.validate(session.mrn);
        
        if (!hasMedicalId && !hasMRN) {
          console.log('⚠️ SECURITY VIOLATION: Invalid medical ID in session');
          const loginUrl = new URL('/auth/patient-login', request.url);
          loginUrl.searchParams.append('error', 'invalid_medical_id');
          loginUrl.searchParams.append('redirect', path);
          return NextResponse.redirect(loginUrl);
        }
        
        console.log(`✅ Valid session confirmed: MRN=${session.mrn || session.medicalId}`);
      } catch (error) {
        console.error('⚠️ SECURITY ERROR: Session validation failed:', error);
        // If session parsing fails, redirect to login with error
        const loginUrl = new URL('/auth/patient-login', request.url);
        loginUrl.searchParams.append('error', 'security_validation_failed');
        loginUrl.searchParams.append('redirect', path);
        return NextResponse.redirect(loginUrl);
      }
    }
    
    // Allow access only after all security checks pass
    console.log('✅ Security verification complete - Access granted');
    return NextResponse.next();
  }
  
  // For all other routes that aren't handled above
  return NextResponse.next();
}

// Define SPECIFIC matchers for different security levels
export const config = {
  matcher: [
    // Strictly protect all patient routes
    '/patient/:path*',
    
    /*
     * Match other paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|public\/).*)'
  ],
}
