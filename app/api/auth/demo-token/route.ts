import { NextResponse } from "next/server";
import { getDemoToken } from "@/lib/auth/jwt";

// This endpoint is for development use only
// It returns a demo token based on the requested role and hospital
export async function GET(request: Request) {
  // Only allow in development mode for security
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not available in production", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "doctor";
  const hospitalSlug = searchParams.get("hospital") || "smart-hospital";

  const token = getDemoToken(role, hospitalSlug);

  return NextResponse.json({ token });
}
