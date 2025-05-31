import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/auth/login',
    '/auth/signup',
    '/auth/parent-login',
    '/register'
  ]
  
  // Skip middleware for API routes, static files, and public paths
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    publicPaths.includes(path)
  ) {
    // Handle login redirection differently based on path
    const token = request.cookies.get('token')?.value
    
    // Only redirect for admin login, not for patient login
    if (token && path === '/login') {
      try {
        const payload = await verifyToken(token)
        if (payload.role === 'superadmin') {
          return NextResponse.redirect(new URL('/superadmin', request.url))
        }
        // Other roles will be handled as needed
      } catch (error) {
        // Invalid token, let them access login
      }
    }
    
    // For /auth/login (patient login), never redirect to superadmin
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

  // Check for patient routes first - these are at the root level
  if (path.startsWith('/patient/')) {
    // Check if we have a token cookie
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      console.log('Patient route access denied: no token', path);
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      // Verify the token and check if it belongs to a patient
      const payload = await verifyToken(token)
      
      // Allow access for any authenticated user to patient routes
      // In a real system you might want to check for specific patient role
      return NextResponse.next()
    } catch (error) {
      console.error('Token verification failed:', error)
      // Clear the invalid token
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
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
      console.log(`Checking hospital access: ${hospitalSlug}`)

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
