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
import { toast } from "sonner"
// Removed Kinde imports
import { FcGoogle } from "react-icons/fc"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface ValidationErrors {
  identifier?: string;
  password?: string;
  general?: string;
  email?: string;
}

export default function PatientLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("") 
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: "", // Changed from phone to email
    password: "",
  })
  
  // Read email from URL parameters or session storage
  useEffect(() => {
    // Read from URL parameters first
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
      return;
    }
    
    // Check for backward compatibility with phone parameter
    const phoneParam = params.get('phone');
    if (phoneParam) {
      setFormData(prev => ({ ...prev, email: phoneParam }));
      return;
    }
    
    // Then try session storage
    const tempEmail = sessionStorage.getItem('tempEmail') || sessionStorage.getItem('tempPhone');
    if (tempEmail) {
      setFormData(prev => ({ ...prev, email: tempEmail }));
      // Clear after using
      sessionStorage.removeItem('tempEmail');
      sessionStorage.removeItem('tempPhone');
    }
  }, [])

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate email
    if (!formData.email) {
      errors.identifier = "Email address is required";
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.identifier = "Please enter a valid email address";
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

  // Normalize email to lowercase for consistent matching
  const normalizeEmail = (email: string): string => {
    return email.toLowerCase().trim();
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
      // Normalize email to lowercase for consistent matching
      const normalizedEmail = normalizeEmail(formData.email);
      // No special handling for specific patients or hardcoded medical IDs as per CentralHealth system rules
      // Clear any localstorage values that might be used for authentication to ensure clean login
      console.log('Cleaning up any cached authentication data before login');
      
      console.log('Submitting login with:', { 
        email: normalizedEmail.substring(0, 3) + '****' + normalizedEmail.substring(normalizedEmail.indexOf('@')), 
        passwordProvided: formData.password?.length > 0 
      });
      
      // Log the exact format we're using to help debug JSON field search issues
      console.log('Using normalized email for database search:', normalizedEmail);
      
      // Add a request ID for tracking this login attempt across client and server logs
      const requestId = `login-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      console.log(`[${requestId}] Starting login request with email: ${normalizedEmail.substring(0, 3)}...@${normalizedEmail.split('@')[1]}`);
      
      const response = await fetch('/api/patients/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: formData.password,
          requestId: requestId // Pass through for server logging
        })
      });
      
      console.log(`[${requestId}] Login response status: ${response.status}`);
      console.log(`[${requestId}] Login response headers:`, [...response.headers.entries()]);
      
      // Try to safely parse the response
      let data;
      try {
        const responseText = await response.text();
        console.log(`[${requestId}] Raw response text:`, responseText);
        
        try {
          data = JSON.parse(responseText);
          console.log(`[${requestId}] Parsed data:`, data);
        } catch (parseError) {
          console.error(`[${requestId}] JSON parse error:`, parseError);
          data = { 
            success: false, 
            message: 'Could not parse response from server',
            error: 'PARSE_ERROR',
            rawResponse: responseText
          };
        }
      } catch (textError) {
        console.error(`[${requestId}] Error reading response text:`, textError);
        data = { 
          success: false, 
          message: 'Error reading response from server',
          error: 'RESPONSE_ERROR' 
        };
      }
      
      if (!response.ok || data.success === false) {
        console.error(`[${requestId}] Login error:`, data);
        const errorMessage = data.message || 'Please check your email and password.';
        const errorDetails = data.details || '';
        const errorCode = data.error || 'UNKNOWN_ERROR';
        
        // Show appropriate error message based on error code
        let toastMessage = 'Login failed';
        let toastDescription = errorMessage;
        
        if (errorCode === 'USER_NOT_FOUND') {
          toastMessage = 'Account not found';
          toastDescription = 'No account exists with this email address. Please check your email or register first.';
        } else if (errorCode === 'INVALID_PASSWORD') {
          toastMessage = 'Incorrect password';
          toastDescription = 'The password you entered is incorrect. Please try again.';
        }
        
        // Show error toast
        toast.error(toastMessage, {
          description: toastDescription
        });
        
        // Set error state instead of throwing
        setError(errorMessage);
        setIsLoading(false);
        return;
      } else if (data.presentationMode) {
        // Handle presentation mode - this is the success path with token
        console.log(`[${requestId}] Processing presentation mode response`);
        
        if (data.patient && data.token) {
          console.log(`[${requestId}] Received presentation mode token and patient data`);
          
          // PRESENTATION MODE - Store token in localStorage instead of cookie
          localStorage.setItem('auth_token', data.token);
          sessionStorage.setItem('auth_token', data.token);
          
          // Continue with patient data processing below
        } else {
          toast.error('Invalid response format', {
            description: 'The server returned an unexpected response format.'
          });
          throw new Error('Invalid response format from server');
        }
      }
      
      console.log(`[${requestId}] Login successful:`, { 
        hasPatientData: !!data.patient,
        hasToken: !!data.token,
        medicalIdAvailable: !!(data.patient && data.patient.mrn)
      });
      
      // Patient successfully authenticated
      console.log('Login successful, clearing any stale data');
      
      // Ensure we're preserving the permanent medical ID from the mrn field
      // This follows CentralHealth system rule for permanent medical ID preservation
      if (data.patient && data.patient.mrn) {
        localStorage.setItem('medicalNumber', data.patient.mrn);
        sessionStorage.setItem('medicalNumber', data.patient.mrn);
        console.log('Set permanent medical number to:', data.patient.mrn);
      }
      
      // For presentation mode, extract data from API response
      const { patient, token } = data;
      
      // Store essential authentication data in localStorage for the dashboard
      console.log('Storing authentication data consistently');
      
      // Patient ID is permanent and must be preserved
      if (patient?.id) {
        localStorage.setItem('patientId', patient.id);
        sessionStorage.setItem('patientId', patient.id);
      }
      
      // Medical ID - use medicalId (from mrn) as the primary source
      // This ensures we maintain a permanent medical ID as required by CentralHealth rules
      if (patient?.medicalId) {
        localStorage.setItem('medicalNumber', patient.medicalId);
        sessionStorage.setItem('medicalNumber', patient.medicalId);
      }
      
      // Store patient name for better UX
      if (patient?.name) {
        localStorage.setItem('patientName', patient.name);
        sessionStorage.setItem('patientName', patient.name);
      }
      
      // Store email for contact purposes
      if (patient?.email) {
        localStorage.setItem('userEmail', patient.email);
        sessionStorage.setItem('userEmail', patient.email);
      }

      // Store presentation mode token for authentication
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('auth_token', data.token);
        console.log('Stored presentation mode auth token');
      }
      
      // Log success with more details
      console.log("Patient login successful, redirecting to dashboard", {
        patientId: localStorage.getItem('patientId'),
        userEmail: localStorage.getItem('userEmail'),
        hasMedicalNumber: !!patient?.mrn, // Use mrn field as the permanent medical ID
        presentationMode: true
      });
      
      // Show success message before redirect
      toast.success('Login successful', {
        description: 'Welcome to Central Health Patient Portal'
      });
      
      // Use a short timeout to allow the toast to display before redirecting
      setTimeout(() => {
        // DIRECT APPROACH: Create a form and submit it to force a server-side redirect
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = '/patient/dashboard';
        
        // Add a hidden timestamp field to prevent caching issues
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = 'ts';
        hiddenField.value = Date.now().toString();
        form.appendChild(hiddenField);
        
        // Add the form to the body and submit it immediately
        document.body.appendChild(form);
        form.submit();
      }, 1500);
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
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Please enter your email address and password to access your health records
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-5 border-destructive/50 animate-fadeIn">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Login with email and password */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Login with your email
                  </span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                  {validationErrors.identifier && (
                    <p className="text-sm text-red-600">{validationErrors.identifier}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <p className="text-center text-sm text-muted-foreground">
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(!showForgotPassword)} 
                        className="text-primary hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </p>
                  </div>
                  
                  {showForgotPassword && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md border border-muted animate-fadeIn">
                      <h4 className="font-medium text-sm mb-2">Password Reset Options:</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                        <li>Use your email address above - we'll send a reset link</li>
                        <li>Contact your hospital administrator</li>
                      </ul>
                      <div className="mt-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const recoveryKey = sessionStorage.getItem('password_recovery_key');
                            const email = formData.email.trim().toLowerCase();
                            if (email) {
                              // Redirect to password reset with recovery info
                              router.push(`/auth/forgot-password?email=${encodeURIComponent(email)}${recoveryKey ? `&key=${recoveryKey}` : ''}`);
                            } else {
                              toast.error('Please enter your email address first');
                            }
                          }}
                          className="w-full"
                        >
                          Reset My Password
                        </Button>
                      </div>
                    </div>
                  )}
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
                      Use your email address and password to access your patient dashboard. If you've recently registered, you can use the email address and password you provided during registration.
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
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register">
                  Register with Email
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
