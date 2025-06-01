"use client";

import { ReactNode, useEffect, useState } from "react";
import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import { usePathname } from "next/navigation";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  
  // Determine if the current route is a patient route that should use Kinde
  const isPatientRoute = (): boolean => {
    // Add all patient-specific routes here
    const patientRoutes = [
      '/auth/patient-login',
      '/auth/patient-signup',
      '/patient/',
      '/patient/dashboard',
      '/patient/appointments',
      '/patient/records',
      '/patient/profile'
    ];
    
    return patientRoutes.some(route => pathname?.startsWith(route));
  };
  
  // Only apply Kinde provider to patient routes
  if (isPatientRoute()) {
    return <KindeProvider>{children}</KindeProvider>;
  }
  
  // For all other routes (admin, hospital staff, etc.), don't use Kinde
  return <>{children}</>;
}
