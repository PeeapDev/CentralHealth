import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get the redirect URL from the query parameters
  const searchParams = request.nextUrl.searchParams
  const redirectTo = searchParams.get("redirect") || "/"

  // Create a response that redirects to the specified URL
  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  // Clear the auth cookies
  response.cookies.delete("token")
  response.cookies.delete("hospitalToken")

  return response
}
