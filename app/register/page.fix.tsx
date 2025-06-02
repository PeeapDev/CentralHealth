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
import { Heart, User, Loader2, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define validation error and form data interfaces
interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  birthDate?: string;
  gender?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  birthDate: string;
  gender: string;
  emailVerified: boolean;
}

export default function PatientRegistration() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    birthDate: "",
    gender: "",
    emailVerified: false
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
    
    // The input already has +232 prefix in the UI, so we just ensure the format is correct
    return `+232${digits}`;
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined
      });
    }

    // If email field is changed, reset verification
    if (name === 'email' && formData.emailVerified) {
      setFormData(prev => ({ ...prev, emailVerified: false }));
      setOtpSent(false);
    }

    // Check email uniqueness when email changes
    if (name === 'email' && value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      checkEmailUniqueness(value);
    } else if (name === 'email') {
      setEmailExists(false);
    }
  };

  // Check if email already exists in the system
  const checkEmailUniqueness = async (email: string) => {
    setIsCheckingEmail(true);
    try {
      // Call API to check if email exists
      const response = await fetch(`/api/patients/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      setEmailExists(data.exists);
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const errors: ValidationErrors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    } else if (!formData.emailVerified) {
      errors.email = "Please verify your email address";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (formData.phone.length < 8) {
      errors.phone = "Please enter a valid Sierra Leone phone number (8-9 digits)";
    }
    
    if (!formData.gender) {
      errors.gender = "Gender is required";
    }
    
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (!formData.birthDate) {
      errors.birthDate = "Date of birth is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
          birthDate: formData.birthDate,
          gender: formData.gender
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
        throw new Error('Server returned an unexpected response');
      }
      
      if (response.ok) {
        toast.success("Registration successful!");
        // Redirect to onboarding
        router.push('/onboarding');
      } else {
        setError(data.message || "Failed to register. Please try again.");
        toast.error(data.message || "Failed to register. Please try again.");
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-blue-950/20 dark:via-background dark:to-green-950/20 p-4 py-8">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Central Health</h1>
          <p className="text-muted-foreground">Create your patient account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Patient Registration</CardTitle>
            <CardDescription>
              Enter your details to create a new patient account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
                <div className="flex space-x-2">
                  <div className="relative w-full">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${validationErrors.email || emailExists ? "border-destructive" : ""} ${isCheckingEmail ? "pr-10" : ""} ${formData.emailVerified ? "border-green-500 bg-green-50" : ""}`}
                      disabled={formData.emailVerified}
                    />
                    {isCheckingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button 
                    id="verify-email-btn"
                    type="button"
                    variant={formData.emailVerified ? "outline" : "default"}
                    onClick={async () => {
                      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                        toast.error("Please enter a valid email address");
                        return;
                      }

                      if (emailExists) {
                        toast.error("This email is already in use. Please use a different email.");
                        return;
                      }
                      
                      setIsSendingOTP(true);
                      try {
                        toast.loading("Sending verification code...");
                        
                        // For demo purposes, we'll simulate sending an OTP
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        toast.dismiss();
                        toast.success("Verification code sent! (Demo: 123456)");
                        setOtpSent(true);
                        setOtpCode('');
                        setDemoOtpCode('123456'); // Store demo OTP code for display
                      } catch (error) {
                        toast.dismiss();
                        toast.error("Failed to send verification code");
                      } finally {
                        setIsSendingOTP(false);
                      }
                    }}
                    disabled={!formData.email || formData.emailVerified || isSendingOTP || emailExists || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                    className="whitespace-nowrap"
                  >
                    {formData.emailVerified ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verified
                      </>
                    ) : isSendingOTP ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </div>
                {validationErrors.email && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.email}</p>
                )}
                {emailExists && !validationErrors.email && (
                  <p className="text-destructive text-xs mt-1">This email is already in use. Please use a different email.</p>
                )}
                {otpSent && !formData.emailVerified && (
                  <div className="mt-2">
                    <Label htmlFor="otp" className="text-sm">Verification Code</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="otp"
                        placeholder="Enter code from email"
                        value={otpCode}
                        onChange={(e) => {
                          // Only allow numeric input and limit to 6 digits
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setOtpCode(numericValue.slice(0, 6));
                        }}
                        maxLength={6}
                        className="flex-grow"
                      />
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!otpCode || otpCode.length < 4) {
                            toast.error("Please enter the verification code");
                            return;
                          }

                          setIsVerifyingOTP(true);
                          try {
                            toast.loading("Verifying code...");
                            
                            // For demo purposes, we'll verify if the OTP is 123456
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            if (otpCode === '123456') {
                              toast.dismiss();
                              toast.success("Email verified successfully!");
                              setFormData(prev => ({ ...prev, emailVerified: true }));
                              setOtpSent(false);
                            } else {
                              toast.dismiss();
                              toast.error("Invalid verification code");
                            }
                          } catch (error) {
                            toast.dismiss();
                            toast.error("Failed to verify code");
                          } finally {
                            setIsVerifyingOTP(false);
                          }
                        }}
                        disabled={isVerifyingOTP || !otpCode}
                        className="whitespace-nowrap"
                      >
                        {isVerifyingOTP ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Demo mode:</span> Use verification code: 
                          <span className="font-bold text-sm ml-1">{demoOtpCode}</span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Didn't receive the code? 
                        <button 
                          type="button" 
                          className="text-primary underline ml-1" 
                          onClick={() => {
                            // Reset and resend OTP
                            setOtpSent(false);
                            setTimeout(() => {
                              document.getElementById('verify-email-btn')?.click();
                            }, 100);
                          }}
                          disabled={isSendingOTP}
                        >
                          Resend code
                        </button>
                      </p>
                    </div>
                  </div>
                )}
                {formData.emailVerified && (
                  <p className="text-green-600 text-xs mt-1">Your email has been verified successfully!</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex space-x-0">
                  <span className="inline-flex items-center px-4 py-2 border border-r-0 border-input rounded-l-md bg-green-100 text-green-800 font-medium mr-0">
                    +232
                  </span>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => {
                      // Remove non-numeric characters
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      // Remove leading zero if present
                      const noLeadingZero = numericValue.startsWith('0') ? numericValue.substring(1) : numericValue;
                      // Limit to 9 digits
                      const limitedValue = noLeadingZero.slice(0, 9);
                      setFormData({ ...formData, phone: limitedValue });
                    }}
                    className={`rounded-l-none pl-3 ${validationErrors.phone ? "border-destructive" : ""}`}
                    maxLength={9}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.phone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => {
                    setFormData({ ...formData, gender: value });
                    // Clear validation error
                    if (validationErrors.gender) {
                      setValidationErrors({
                        ...validationErrors,
                        gender: undefined
                      });
                    }
                  }}
                >
                  <SelectTrigger 
                    id="gender"
                    className={validationErrors.gender ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.gender && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.gender}</p>
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
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !formData.emailVerified}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              {!formData.emailVerified && (
                <p className="text-amber-600 text-xs text-center mt-2 font-medium">Please verify your email to continue</p>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
