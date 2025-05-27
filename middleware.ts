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
    '/auth/signup'
  ]
  
  // Skip middleware for API routes, static files, and public paths
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    publicPaths.includes(path)
  ) {
    // Check if already logged in and trying to access login pages
    const token = request.cookies.get('token')?.value
    if (token && (path === '/login' || path === '/auth/login')) {
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
    return NextResponse.next()
  }

  // Strictly enforce authentication for superadmin routes
  if (path === '/superadmin' || path.startsWith('/superadmin/')) {
    console.log('Checking superadmin route access:', path)
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      console.log('No token found - redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      const payload = await verifyToken(token)
      console.log('Token payload:', payload)
      
      if (payload.role !== 'superadmin') {
        console.log('User is not superadmin - redirecting to login')
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      
      console.log('Superadmin access granted')
      return NextResponse.next()
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
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
        !hospitalSlug.includes('.')) {
      // Log potential hospital access
      console.log(`Checking hospital access: ${hospitalSlug}`)

      // Hospital landing pages are public
      if (pathParts.length === 2) {
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
  
  // Check for protected routes that require authentication
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
