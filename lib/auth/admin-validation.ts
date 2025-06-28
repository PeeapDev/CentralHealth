// Enhanced authentication utilities to maintain strict admin/staff role separation
// Following Hospital Staff Management Security Policy
import { AuthResult } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Validates if the authenticated user has admin-level access
 * Handles case-insensitive role comparison for compatibility
 */
export function validateAdminAccess(authResult: AuthResult) {
  if (!authResult.authenticated || !authResult.user) {
    console.error("Authentication failed: No valid auth token found");
    return {
      isAuthorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }
  
  // Normalize role for case-insensitive comparison
  const userRole = authResult.user.role.toUpperCase();
  
  // Check if user has admin or manager privileges
  const isAdmin = ["ADMIN", "MANAGER"].includes(userRole);
  
  if (!isAdmin) {
    console.error(`Access denied for user ${authResult.user.email} with role ${authResult.user.role}`);
    return {
      isAuthorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }
  
  return {
    isAuthorized: true,
    user: authResult.user
  };
}
