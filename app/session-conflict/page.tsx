"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, AlertTriangle } from "lucide-react";
import { useEffect, useState } from 'react';

export default function SessionConflictPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams?.get('action') || 'access';
  const [patientName, setPatientName] = useState<string>('');
  const [medicalId, setMedicalId] = useState<string>('');
  
  useEffect(() => {
    // Try to get patient details from session for personalized message
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('patient_session='));
        
      if (sessionCookie) {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        if (sessionData.name) {
          setPatientName(sessionData.name);
        }
        if (sessionData.medicalId) {
          setMedicalId(sessionData.medicalId);
        }
      }
    } catch (error) {
      console.error('Error parsing session cookie:', error);
    }
  }, []);

  const handleSignOut = () => {
    // Redirect to signout API endpoint
    window.location.href = '/api/patients/signout';
  };
  
  const handleGoToDashboard = () => {
    router.push('/patient/dashboard');
  };
  
  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center text-amber-500 mb-4">
            <AlertTriangle size={64} />
          </div>
          <CardTitle className="text-2xl text-center">Session Conflict</CardTitle>
          <CardDescription className="text-center">
            {action === 'register' ? (
              <>
                You are currently logged in{patientName ? ` as ${patientName}` : ''}{medicalId ? ` (Medical ID: ${medicalId})` : ''}.
                <br />
                You cannot create a new account while currently logged in.
              </>
            ) : (
              'You cannot access this resource due to session conflict.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            For your privacy and data security, please sign out of your current session before 
            {action === 'register' ? ' registering a new account' : ' proceeding'}.
          </p>
          <div className="text-sm text-gray-500 mt-4">
            <p>This restriction prevents accidental data mixing between separate patient accounts.</p>
            <p>If you need to create a separate patient account, please sign out first or use a different browser.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleSignOut} className="w-full" variant="destructive">
            <LogOut className="mr-2 h-4 w-4" /> 
            Sign Out {patientName ? `(${patientName})` : 'Current Session'}
          </Button>
          <Button onClick={handleGoToDashboard} className="w-full" variant="outline">
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
