'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function PatientHomeRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Add a timestamp to prevent caching issues
    const timestamp = Date.now();
    router.replace(`/patient/dashboard?ts=${timestamp}`);
  }, [router]);
  
  // Show a loading spinner while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <Spinner className="h-10 w-10 mx-auto" />
        <p className="mt-4 text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
