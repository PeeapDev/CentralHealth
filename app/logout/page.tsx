"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Logging you out...");

  useEffect(() => {
    const logout = async () => {
      try {
        // First try the patient session logout
        const patientResponse = await fetch('/api/patients/session/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (patientResponse.ok) {
          console.log('Patient logged out successfully');
          setStatus('success');
          setMessage('You have been successfully logged out.');
          
          // Redirect to the landing page after a short delay
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          // If not a patient, could be an admin/staff using JWT
          console.log('Patient logout failed or not applicable');
          setStatus('error');
          setMessage('There was an issue with the logout process. Please try again.');
        }
      } catch (error) {
        console.error('Error during logout:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during logout.');
      }
    };

    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle>Logging Out</CardTitle>
          <CardDescription>
            Please wait while we securely log you out.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          {status === 'loading' && (
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          )}
          <p className={`text-center ${status === 'error' ? 'text-destructive' : ''}`}>{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === 'error' && (
            <Button 
              variant="default" 
              onClick={() => router.push('/auth/login')}
            >
              Return to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
