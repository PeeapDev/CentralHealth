import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

  // Define paths that use different authentication systems
  const publicPaths = [
    '/',
    '/register'
  ]

  const patientAuthPaths = [
    '/auth/patient-login',
    '/auth/patient-signup',
    '/patient/',
  ]

  const hospitalAdminPaths = [
    '/login', 
    '/auth/login'
  ]
  
  // Skip middleware for API routes, static files, public paths and patient-specific Kinde auth paths
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    publicPaths.includes(path) ||
    patientAuthPaths.some(p => path.startsWith(p))
  ) {
    // No middleware processing for these paths
    return NextResponse.next()
  }

  // Special case for hospital admin login routes (only for main login routes, not hospital-specific)
  if (hospitalAdminPaths.some(p => path === p)) {
    // Handle login redirection for hospital admin login
    const token = request.cookies.get('token')?.value
    
    // Check if token exists and redirect based on role
    if (token) {
      try {
        const payload = await verifyToken(token)
        if (payload.role === 'superadmin') {
          return NextResponse.redirect(new URL('/superadmin', request.url))
        } else if (payload.role === 'admin' && payload.hospitalId) {
          // For hospital admin, redirect to their specific hospital admin dashboard
          return NextResponse.redirect(new URL(`/${payload.hospitalId}/admin/dashboard`, request.url))
        }
        // If token is invalid or role doesn't match, let them access login
      } catch (error) {
        // Invalid token, let them access login
      }
    }
    
    return NextResponse.next()
  }

  // Strictly enforce authentication for superadmin routes
  if (path === '/superadmin' || path.startsWith('/superadmin/')) {
    console.log('Checking superadmin route access:', path)
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      console.log('No token found - redirecting to login')
      // Log this access attempt for security monitoring
      console.warn(`SECURITY: Unauthorized access attempt to ${path} without token`)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      const payload = await verifyToken(token)
      console.log('Token payload:', payload)
      
      // Enhanced role verification
      if (!payload || payload.role !== 'superadmin') {
        console.log('User is not superadmin - access denied')
        // Log this access attempt for security monitoring
        console.warn(`SECURITY: Unauthorized access attempt to ${path} by non-superadmin user: ${payload?.email || 'unknown'}`)
        
        // Clear the invalid token
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('token')
        return response
      }
      
      // Double check that we have a valid userId
      if (!payload.userId || !payload.email) {
        console.error('Invalid token payload - missing required fields')
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('token')
        return response
      }
      
      console.log('Superadmin access granted')
      return NextResponse.next()
    } catch (error) {
      console.error('Token verification failed:', error)
      // Clear the invalid token
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }

  // Check for hospital admin routes (subdomain/admin/*)
  // Make sure to use exact matching to avoid catching auth paths
  const hospitalAdminMatch = path.match(/^\/([\w-]+)\/admin\//)
  if (hospitalAdminMatch) {
    const hospitalSubdomain = hospitalAdminMatch[1]
    console.log(`Checking hospital admin access for ${hospitalSubdomain}:`, path)
    
    // Skip auth check for login page itself
    if (path.includes('/admin/auth/login')) {
      return NextResponse.next()
    }
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      console.log('Hospital admin access denied: no token')
      return NextResponse.redirect(new URL(`/${hospitalSubdomain}/admin/auth/login`, request.url))
    }
    
    try {
      // Verify the token and check if it belongs to an admin of this hospital
      const payload = await verifyToken(token)
      
      // Check if user is an admin for this specific hospital
      if (payload.role !== 'admin' || payload.hospitalId !== hospitalSubdomain) {
        console.log(`Hospital admin access denied: user is not admin for ${hospitalSubdomain}`)
        console.warn(`SECURITY: Unauthorized hospital admin access attempt to ${path} by ${payload?.email || 'unknown'}`)
        
        // Clear the invalid token
        const response = NextResponse.redirect(new URL(`/${hospitalSubdomain}/admin/auth/login`, request.url))
        response.cookies.delete('token')
        return response
      }
      
      // User is authorized for this hospital's admin area
      return NextResponse.next()
    } catch (error) {
      console.error('Token verification failed:', error)
      // Clear the invalid token
      const response = NextResponse.redirect(new URL(`/${hospitalSubdomain}/admin/auth/login`, request.url))
      response.cookies.delete('token')
      return response
    }
  }

  // Check if the path is a hospital slug route
  const pathParts = path.split('/')
  if (pathParts.length > 1) {
    const hospitalSlug = pathParts[1]
    // Only check real hospital routes (not system paths)
    if (hospitalSlug && 
        hospitalSlug !== '_next' && 
        hospitalSlug !== 'api' && 
        hospitalSlug !== 'static' && 
        hospitalSlug !== 'superadmin' && 
        hospitalSlug !== 'auth' && 
        hospitalSlug !== 'patient' && 
        !hospitalSlug.includes('.')) {
      // Log potential hospital access
      console.log(`Hospital route detected: ${path} for hospital: ${hospitalSlug}`)

      // Hospital landing pages are public
      if (pathParts.length === 2) {
        return NextResponse.next()
      }
      
      // Hospital home pages are public
      if (pathParts.length >= 3 && pathParts[2] === 'home') {
        return NextResponse.next()
      }
      
      // Hospital auth pages are public
      if (pathParts.length >= 3 && pathParts[2] === 'auth') {
        console.log(`Hospital auth page detected: ${path}`);
        // Make sure this is not caught by any token verification
        return NextResponse.next()
      }
      
      // Other hospital routes require authentication
      const token = request.cookies.get('token')?.value
      if (!token) {
        return NextResponse.redirect(new URL(`/${hospitalSlug}/auth/login`, request.url))
      }
      
      // Allow authenticated hospital access
      return NextResponse.next()
    }
  }

  // Protected routes authentication check
  const token = request.cookies.get('token')?.value
  
  
  // Check for other protected routes that require authentication
  const requiresAuth = 
    path.includes('/dashboard') ||
    path.includes('/admin') ||
    path.includes('/settings')

  if (requiresAuth && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check specific roles for protected routes
  if (requiresAuth && token) {
    try {
      const payload = await verifyToken(token)
      
      // For superadmin routes, verify role
      if (path.startsWith('/superadmin') && payload.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      // Token is invalid, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
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
