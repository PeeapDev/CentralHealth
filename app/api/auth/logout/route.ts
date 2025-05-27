import { NextRequest, NextResponse } from "next/server"

// Common logout logic used by both GET and POST handlers
const handleLogout = (request: NextRequest) => {
  // Get the redirect URL from the query parameters
  const searchParams = request.nextUrl.searchParams
  const redirectTo = searchParams.get("redirect") || "/auth/login"

  // Initialize response variable
  let response: NextResponse
  
  // Create appropriate response based on request method
  if (request.method === 'GET') {
    // For GET requests, return a redirect response
    response = NextResponse.redirect(new URL(redirectTo, request.url))
  } else {
    // For POST requests, return a JSON response
    response = NextResponse.json({ success: true, message: "Logged out successfully" })
  }

  // Clear cookies by setting them to empty with past expiration
  // This approach works around the TypeScript limitations with NextResponse cookies API
  const expiredDate = new Date(0).toUTCString()
  
  // Set standard deletion cookies for each auth cookie
  response.headers.append('Set-Cookie', `token=; path=/; expires=${expiredDate}; httpOnly; secure=${process.env.NODE_ENV === 'production'}`)
  response.headers.append('Set-Cookie', `hospitalToken=; path=/; expires=${expiredDate}; httpOnly; secure=${process.env.NODE_ENV === 'production'}`)
  
  // Also try with domain specified
  const domain = request.headers.get('host')?.split(':')[0]
  if (domain) {
    response.headers.append('Set-Cookie', `token=; path=/; domain=${domain}; expires=${expiredDate}; httpOnly; secure=${process.env.NODE_ENV === 'production'}`)
    response.headers.append('Set-Cookie', `hospitalToken=; path=/; domain=${domain}; expires=${expiredDate}; httpOnly; secure=${process.env.NODE_ENV === 'production'}`)
  }

  return response
}

// GET handler (for browser redirects)
export async function GET(request: NextRequest) {
  return handleLogout(request)
}

// POST handler (for API calls)
export async function POST(request: NextRequest) {
  return handleLogout(request)
}
