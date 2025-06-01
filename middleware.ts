import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPatientSession } from '@/lib/patient-session';

// Middleware handles all route protection logic
export function middleware(request: NextRequest) {
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
    '/admin/auth/login', // Add admin login path as public
    '/superadmin'        // Allow superadmin dashboard access
  ];
  
  // Check if the path is public or starts with a public prefix
  const isPublicPath = publicPaths.some(publicPath => {
    return path === publicPath || path.startsWith(`${publicPath}/`);
  });
  
  if (isPublicPath) {
    console.log('✅ Public path detected, no auth required');
    return NextResponse.next();
  }
  
  // IMPORTANT: Debug mode - bypass all auth checks for patient routes
  // This allows direct access to the patient dashboard for testing
  if (path.startsWith('/patient/')) {
    console.log('🔓 DEBUG MODE: Bypassing authentication for patient routes');
    return NextResponse.next();
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
