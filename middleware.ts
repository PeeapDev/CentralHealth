import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidMedicalID } from './utils/medical-id';

// PRESENTATION MODE - Authentication checks disabled
const PRESENTATION_MODE = true; // For presentation purposes
const DEBUG_MODE = true; // Disable authentication checks

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
  
  // PRESENTATION MODE - Token-based authentication
  if (PRESENTATION_MODE) {
    console.log('👋 PRESENTATION MODE - Using token authentication');
    
    // In presentation mode, we'll check for auth token in the request headers
    // But we won't block requests if token is missing to allow easier testing
    const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (authToken) {
      console.log('📝 Found presentation mode auth token in request headers');
      // We could verify the token here if needed, but in presentation mode we're keeping it simple
    } else {
      console.log('⚠️ No auth token found in presentation mode, but allowing access for testing');
    }
    
    // Allow all requests to proceed for presentation purposes
    // But we log all protected accesses for debugging
    if (path.startsWith('/patient/')) {
      console.log(`🔐 Allowing access to protected patient path: ${path}`);
    }
    
    return NextResponse.next();
  }
  
  // Normal authentication mode - would check session cookie
  // This code is not reached in presentation mode
  console.log('⚠️ Normal auth mode active but skipping checks for development');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
