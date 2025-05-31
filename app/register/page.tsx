"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { FcGoogle } from "react-icons/fc"
import { Separator } from "@/components/ui/separator"

export default function SimpleRegistrationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  // Debug log on any field change
  useEffect(() => {
    console.log('Form state updated:', { firstName, lastName, email, phone: phone || 'empty' });
  }, [firstName, lastName, email, phone]);
  
  // Direct button click handler with simpler logic
  const handleRegisterClick = async () => {
    console.log('Register button clicked');
    
    // Clear previous errors
    setFormError("");
    
    // Validate fields
    if (!firstName || !lastName || !email || !phone || !password) {
      setFormError("All fields are required");
      toast.error("All fields are required");
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Format phone number
      let formattedPhone = phone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+232${formattedPhone}`;
      }
      
      // Prepare data
      const userData = {
        firstName,
        lastName,
        email,
        phone: formattedPhone,
        password
      };
      
      console.log('Sending registration data:', userData);
      
      // Make API request
      const response = await fetch('/api/patients/quick-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone, // We'll let the backend add the +232 prefix if needed
          password,
        })
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        toast.success(data.message);
        
        // Store patient info in localStorage for immediate access
        if (data.patient) {
          localStorage.setItem('patientInfo', JSON.stringify(data.patient));
        }
        
        // Since this is quick registration with auto-login, redirect to dashboard
        router.push('/patient/dashboard');
      } else {
        // Handle known error from API
        const errorMsg = data.error || data.message || 'Registration failed';
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple field change handlers
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value);
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value);
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Sierra Leone National Health Service
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm hover:underline">
                Home
              </Link>
              <Link href="/" className="text-sm hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex-1 py-12">
        <div className="max-w-md mx-auto w-full">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Patient Registration</CardTitle>
              <CardDescription className="text-center">
                Enter your details to create an account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google Registration with Kinde */}
              <div className="mb-6">
                <RegisterLink className="w-full" authUrlParams={{provider: "google"}}>
                  <Button 
                    type="button"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center py-5 text-base"
                  >
                    <FcGoogle className="mr-2 h-6 w-6 bg-white rounded-full p-1" />
                    Register with Google
                  </Button>
                </RegisterLink>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or register with your details
                    </span>
                  </div>
                </div>
              </div>
              
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={handleFirstNameChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={handleLastNameChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number (Sierra Leone)
                  </Label>
                  <div className="flex">
                    <div className="bg-muted flex items-center justify-center px-3 rounded-l-md border border-r-0 border-input">
                      <span className="text-sm text-muted-foreground">+232</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      className="rounded-l-none"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <Button 
                  type="button" 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={handleRegisterClick}
                >
                  {isLoading ? "Registering..." : "Register"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <footer className="bg-muted py-6">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sierra Leone National Health Service. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
