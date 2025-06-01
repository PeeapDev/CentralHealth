"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, User, Loader2 } from "lucide-react"

// Define validation error and form data interfaces
interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  birthDate?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  birthDate: string;
}

export default function PatientRegistration() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    birthDate: ""
  });
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Format phone number to conform to Sierra Leone format
  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove any non-digit characters
    let digits = phoneNumber.replace(/\D/g, "");
    
    // If it starts with 0, remove the 0
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    
    // Ensure it has the Sierra Leone country code
    if (!digits.startsWith('232')) {
      digits = `232${digits}`;
    }
    
    return `+${digits}`;
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    let isValid = true;
    const errors: ValidationErrors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else if (formData.phone.trim().length < 9) {
      errors.phone = "Phone number is too short";
      isValid = false;
    }
    
    if (!formData.password.trim()) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.trim().length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }
    
    if (!formData.birthDate) {
      errors.birthDate = "Date of birth is required";
      isValid = false;
    } else {
      // Check if the date is valid and not in the future
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        errors.birthDate = "Invalid date format";
        isValid = false;
      } else if (birthDate > today) {
        errors.birthDate = "Date of birth cannot be in the future";
        isValid = false;
      }
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  // Handle registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form inputs
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Format phone number
      const formattedPhone = formatPhoneNumber(formData.phone);
      
      console.log('Submitting registration with data:', {
        ...formData,
        phone: formattedPhone,
        password: '[REDACTED]'
      });
      
      // Call the server-side API to register the patient
      const response = await fetch('/api/patients/session/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formattedPhone,
          password: formData.password,
          birthDate: formData.birthDate
        })
      });
      
      // Check if the response is valid JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response format');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed with status: ' + response.status);
      }
      
      // Success message with more details
      toast.success('Registration successful! You can now log in with your email and password.');
      
      // Redirect to login page after a brief delay to show the toast
      setTimeout(() => {
        router.push('/login');
        router.refresh(); // Force a refresh to ensure the redirect happens
      }, 2000);
    } catch (error: any) {
      console.error('Patient registration error:', error);
      setError(error.message || "An error occurred during registration. Please try again later.");
      toast.error("Registration failed. Please try again.");
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
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Register as a patient to access health services</CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-5 border-destructive/50 animate-fadeIn">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={validationErrors.firstName ? "border-destructive" : ""}
                  />
                  {validationErrors.firstName && (
                    <p className="text-destructive text-xs mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={validationErrors.lastName ? "border-destructive" : ""}
                  />
                  {validationErrors.lastName && (
                    <p className="text-destructive text-xs mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={validationErrors.email ? "border-destructive" : ""}
                />
                {validationErrors.email && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+232 XX XXX XXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className={validationErrors.phone ? "border-destructive" : ""}
                />
                {validationErrors.phone && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.phone}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Sierra Leone format (+232)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={validationErrors.password ? "border-destructive" : ""}
                />
                {validationErrors.password && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date of Birth</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className={validationErrors.birthDate ? "border-destructive" : ""}
                />
                {validationErrors.birthDate && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.birthDate}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 border-t p-6 bg-muted/20">
            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors hover:underline">
                Already have an account? Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
