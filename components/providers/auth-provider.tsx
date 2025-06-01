"use client";

import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

// Simple auth provider that doesn't use Kinde
// The application uses session-based authentication for patients
// and JWT-based authentication for hospital staff and admins
export function AuthProvider({ children }: AuthProviderProps) {
  // Just pass children through - authentication is handled by middleware and API routes
  return <>{children}</>;
}
