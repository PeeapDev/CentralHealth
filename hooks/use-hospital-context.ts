"use client";

import { useState, useEffect } from 'react';
import { DEFAULT_HOSPITAL, HospitalData } from '@/lib/hospital-context';

/**
 * Hook to provide hospital context for the patient dashboard
 * This prevents "hospital not found" errors by using the default
 * hospital data rather than trying to fetch it unnecessarily
 */
export function useHospitalContext() {
  const [hospital, setHospital] = useState<HospitalData>(DEFAULT_HOSPITAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always return the default hospital for patient portal
  // This avoids unnecessary API calls and "hospital not found" errors
  return {
    hospital,
    isLoading: false,
    error: null
  };
}
