"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, User, Loader2 } from "lucide-react"
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { FcGoogle } from "react-icons/fc"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface ValidationErrors {
  phone?: string;
  password?: string;
  general?: string;
}

export default function PatientLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("") 
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  })
  
  // Read phone from URL parameters or session storage
  useEffect(() => {
    // Read from URL parameters first
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get('phone');
    
    if (phoneParam) {
      setFormData(prev => ({ ...prev, phone: phoneParam }));
      return;
    }
    
    // Then try session storage
    const tempPhone = sessionStorage.getItem('tempPhone');
    if (tempPhone) {
      setFormData(prev => ({ ...prev, phone: tempPhone }));
      // Clear after using
      sessionStorage.removeItem('tempPhone');
    }
  }, [])

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate phone number
    if (!formData.phone) {
      errors.phone = "Phone number is required";
      isValid = false;
    }

    // Validate password if provided
    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }

  // Format phone number with country code
  const formatPhoneNumber = (phone: string): string => {
    // If phone already has country code, return it
    if (phone.startsWith('+232')) {
      return phone;
    }
    
    // Remove leading zero if exists
    let formattedPhone = phone.startsWith('0') ? phone.substring(1) : phone;
    
    // Add country code
    return '+232' + formattedPhone;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[id as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [id]: undefined
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    
    // Validate form inputs
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Format phone number before sending
      const formattedPhone = formatPhoneNumber(formData.phone);
      
      // Call the API to authenticate the patient
      const response = await fetch('/api/patients/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }
      
      // Patient successfully authenticated
      const { patient, redirectTo } = data;
      
      // Store authentication data in localStorage
      localStorage.setItem('medicalNumber', patient.medicalNumber);
      localStorage.setItem('patientName', patient.name || 'Patient');
      localStorage.setItem('userType', 'patient');
      localStorage.setItem('isPatientLoggedIn', 'true');
      
      // Store additional patient data for the dashboard
      const patientData = {
        medicalNumber: patient.medicalNumber,
        name: patient.name,
        email: patient.email || '',
        phone: patient.phone || '',
        gender: patient.gender || '',
        dateOfBirth: patient.birthDate || '',
        isLoggedIn: true
      };
      
      localStorage.setItem('patientData', JSON.stringify(patientData));
      
      // Log success
      console.log("Patient login successful, redirecting to dashboard");
      
      // Redirect to dashboard using window.location.href for reliability
      window.location.href = redirectTo || '/patient/dashboard';
      return;
    } catch (error: any) {
      console.error('Patient login error:', error);
      setError(error.message || "An error occurred during login. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-blue-950/20 dark:via-background dark:to-green-950/20 p-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Central Health</h1>
          <p className="text-muted-foreground">Sierra Leone's National Health System</p>
        </div>

        <Card className="w-full shadow-lg border-primary/10">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4 transform transition-transform hover:scale-105 duration-300">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Patient Login</CardTitle>
            <CardDescription>Access your health records and appointments</CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-5 border-destructive/50 animate-fadeIn">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Kinde Google Authentication */}
            <div className="mb-6 space-y-4">
              <LoginLink className="w-full" authUrlParams={{provider: "google"}}>
                <Button 
                  type="button"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center py-5 text-base"
                >
                  <FcGoogle className="mr-2 h-6 w-6 bg-white rounded-full p-1" />
                  Sign in with Google
                </Button>
              </LoginLink>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or sign in with phone
                  </span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="77 505 3410"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`pl-20 ${validationErrors.phone ? "border-destructive" : ""}`}
                      autoComplete="tel"
                    />
                    <div className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center rounded-l-md bg-green-500 text-white font-medium">
                      +232
                    </div>
                  </div>
                  {validationErrors.phone && (
                    <p className="text-sm text-destructive mt-1 animate-fadeIn">
                      {validationErrors.phone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your 8-digit phone number without the leading zero
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Link 
                      href="/auth/forgot-password"
                      className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={validationErrors.password ? "border-destructive" : ""}
                    disabled={isLoading}
                    required
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-destructive mt-1 animate-fadeIn">
                      {validationErrors.password}
                    </p>
                  )}
                </div>
                
                {/* Patient Login Instructions */}
                <div className="mt-5 border-t pt-4 bg-primary/5 -mx-4 px-4 pb-4 rounded-b-lg">
                  <h3 className="text-base font-medium text-primary mb-2">
                    Patient Login Instructions:
                  </h3>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Use your phone number and password to access your patient dashboard. If you've recently registered, you can use the phone number and password you provided during registration.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      If you need assistance, please contact the hospital administration.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Access My Health Records"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t p-6 bg-muted/20">
            <div className="text-center text-sm">
              <Link href="/admin/auth/login" className="text-primary hover:text-primary/80 transition-colors flex items-center justify-center">
                <User className="mr-1.5 h-4 w-4" />
                Staff Login
              </Link>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors hover:underline">
                Register here
              </Link>
              {" or "}
              <RegisterLink authUrlParams={{provider: "google"}} className="font-medium text-primary hover:text-primary/80 transition-colors hover:underline">
                Register with Google
              </RegisterLink>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
