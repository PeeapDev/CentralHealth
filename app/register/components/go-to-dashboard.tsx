"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PatientFormData } from "./multi-step-form"
import { CheckCircle2, Loader2 } from "lucide-react"

interface GoToDashboardProps {
  formData: PatientFormData
}

export function GoToDashboard({ formData }: GoToDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDashboardRedirect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const medicalNum = formData.medicalNumber || `P${Math.floor(10000 + Math.random() * 90000)}`;
      console.log('Attempting auto-login for newly registered patient:', medicalNum);
      
      // Make a direct API call to login the patient using their phone number and password
      // The API expects phone number, not medical number
      const response = await fetch('/api/patients/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formData.phone, // The API expects phone, not medical number
          password: medicalNum // Password defaults to medical number during registration
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to authenticate');
      }
      
      console.log('Auto-login successful');
      
      // Save data to localStorage for client-side access
      localStorage.setItem('medicalNumber', medicalNum);
      localStorage.setItem('patientName', `${formData.firstName} ${formData.lastName}`);
      localStorage.setItem('userType', 'patient');
      localStorage.setItem('isPatientLoggedIn', 'true');
      
      // Save all patient data returned from API
      if (data.patient) {
        localStorage.setItem('patientData', JSON.stringify(data.patient));
      } else {
        // Fallback if API doesn't return expected data
        const patientData = {
          medicalNumber: medicalNum,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          isLoggedIn: true
        };
        localStorage.setItem('patientData', JSON.stringify(patientData));
      }
      
      // If token returned directly, store it
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      // Redirect to dashboard
      window.location.href = '/patient/dashboard';
    } catch (err: any) {
      console.error('Auto-login failed:', err);
      setError(err.message || 'Failed to login automatically');
      
      // If auto-login fails, store only the medical number and redirect to login page
      sessionStorage.setItem('tempMedicalNumber', formData.medicalNumber || '');
      window.location.href = `/auth/login?medicalNumber=${formData.medicalNumber}`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button 
        variant="default" 
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        onClick={handleDashboardRedirect}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Access Dashboard
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-center text-red-500">{error}</p>
      )}
    </div>
  );
}
