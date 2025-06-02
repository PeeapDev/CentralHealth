import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// We'll use our new session auth module instead of the old one
import { getPatientFromSession } from './lib/auth/session-auth';

// Toggle to enable or disable debug mode
const DEBUG_MODE = true; // Set to false in production

// Middleware handles all route protection logic
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Always log which path is being accessed
  console.log(`🔍 Middleware processing path: ${path}`);
  
  // Define public paths that should always be accessible
  const publicPaths = [
    '/',
    '/register',
    '/auth/login',
    '/auth/patient-login',
    '/auth/patient-signup',
    '/_next',
    '/api',
    '/admin/auth/login', // Admin login path as public
    '/superadmin',       // Allow superadmin dashboard access
    '/onboarding',       // Onboarding page must be accessible
    '/login'             // Add login path to handle login/home redirects
  ];
  
  // Check if the path is public or starts with a public prefix
  const isPublicPath = publicPaths.some(publicPath => {
    return path === publicPath || path.startsWith(`${publicPath}/`);
  });
  
  if (isPublicPath) {
    console.log('✅ Public path detected, no auth required');
    return NextResponse.next();
  }
  
  // Handle patient routes
  if (path.startsWith('/patient/')) {
    if (DEBUG_MODE) {
      // DEBUG MODE - bypass all auth checks for patient routes
      console.log('🔓 DEBUG MODE: Bypassing authentication for patient routes');
      return NextResponse.next();
    } else {
      // PRODUCTION MODE - enforce onboarding completion
      try {
        const patient = await getPatientFromSession();
        
        // If not authenticated, redirect to login
        if (!patient) {
          console.log('🔒 Not authenticated, redirecting to login');
          return NextResponse.redirect(new URL('/auth/patient-login', request.url));
        }
        
        // If authenticated but onboarding not completed, redirect to onboarding
        if (!patient.onboardingCompleted) {
          console.log('⚠️ Patient onboarding not completed, redirecting');
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
        
        // Authenticated and onboarded, allow access
        console.log('✅ Patient authenticated and onboarded, allowing access');
        return NextResponse.next();
      } catch (error) {
        console.error('Error checking patient authentication:', error);
        // On error, redirect to login for safety
        return NextResponse.redirect(new URL('/auth/patient-login', request.url));
      }
    }
  }
  
  // Allow admin routes without redirection
  if (path.startsWith('/admin/') || path.startsWith('/superadmin/')) {
    console.log('👑 Admin route detected, allowing access');
    return NextResponse.next();
  }
  
  // For all other paths, allow access by default during debugging
  console.log('⚠️ No specific rule matched, allowing access by default');
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
