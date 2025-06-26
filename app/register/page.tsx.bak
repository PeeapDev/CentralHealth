"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { storeUserEmail, storePatientId } from "@/hooks/use-patient-storage"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, User, Loader2, CheckCircle } from "lucide-react"

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
  medicalId?: string;
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
    birthDate: "",
    gender: "",
    emailVerified: false,
    medicalId: ""
  });
  
  // OTP verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [demoOtpCode, setDemoOtpCode] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
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
    
    if (!formData.firstName) {
      errors.firstName = "First name is required";
      isValid = false;
    }
    
    if (!formData.lastName) {
      errors.lastName = "Last name is required";
      isValid = false;
    }
    
    if (!formData.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    if (!formData.emailVerified) {
      // Don't set an error message but prevent form submission
      isValid = false;
    }
    
    if (!formData.phone) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else if (formData.phone.trim().length < 9) {
      errors.phone = "Phone number is too short";
      isValid = false;
    }
    
    if (!formData.password) {
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
    
    if (!formData.gender) {
      errors.gender = "Gender is required";
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  // Generate a unique 5-character medical ID
  useEffect(() => {
    if (!formData.medicalId) {
      const generateMedicalId = () => {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
        let result = '';
        for (let i = 0; i < 5; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };
      
      setFormData(prev => ({
        ...prev,
        medicalId: generateMedicalId()
      }));
    }
  }, []);

  // Handle registration submission
  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Form validation
    if (!validateForm()) {
      return;
    }
    
    // Clear validation errors
    setValidationErrors({});
    
    setIsLoading(true);
    setError("");
    
    // Format phone number to ensure it starts with +232
    const phoneNumber = formData.phone.startsWith('+232') 
      ? formData.phone 
      : '+232' + formData.phone.replace(/^0+/, '').replace(/^\+232/, '');
    
    // Submit registration data with formatted phone, medical ID and email verification status
    const registrationData = {
      ...formData,
      phone: phoneNumber,
      emailVerified: formData.emailVerified, // Add this flag which is required by the API
    };
    
    // Store data in localStorage for the onboarding page
    localStorage.setItem('patientRegistrationData', JSON.stringify({
      fullName: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phoneNumber: phoneNumber,
      dateOfBirth: formData.birthDate,
      gender: formData.gender,
      medicalId: formData.medicalId
    }));
    
    try {
      console.log('Sending registration data:', JSON.stringify(registrationData));
    
    const response = await fetch('/api/patients/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    let data;
    try {
      data = await response.json();
      console.log('Registration API response:', response.status, data);
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      data = {};
    }
      
      if (response.ok) {
        // Registration successful
        console.log('Registration successful');
        
        // Save patient info even if we get a partial response
        storeUserEmail(formData.email);
        
        // Make sure we handle all possible response formats
        if (data && data.patient && data.patient.id) {
          storePatientId(data.patient.id);
        } else if (data && data.id) {
          storePatientId(data.id);
        }
        
        // Always store the medical ID for onboarding
        // Use the one from the API if available, otherwise use what we generated
        const medicalId = data?.patient?.medicalNumber || data?.medicalNumber || formData.medicalId;
        if (medicalId) {
          console.log('Storing medical ID for onboarding:', medicalId);
          localStorage.setItem('medicalNumber', medicalId);
        }
        
        // Always store registration data with consistent format
        localStorage.setItem('patientRegistrationData', JSON.stringify({
          fullName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phoneNumber: formData.phone,
          dateOfBirth: formData.birthDate,
          gender: formData.gender,
          medicalId: medicalId || formData.medicalId || ''
        }));
        
        // Show success message
        toast.success('Registration successful!');
        
        // Redirect to onboarding
        console.log('Redirecting to patient onboarding');
        setIsLoading(false); // Stop loading before redirect
        router.push('/onboarding');
        return; // Important: return to prevent further execution
      } else {
        // Registration failed
        console.error('Registration failed:', data);
        const errorMsg = typeof data?.error === 'string' ? data.error : 
                       typeof data?.message === 'string' ? data.message : 
                       'Failed to create account';
        setError(errorMsg);
        toast.error("Registration failed: " + errorMsg);
        setIsLoading(false);
      }
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
                <div className="flex space-x-2">
                  <div className="relative w-full">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        handleChange(e);
                        // Reset verification when email changes
                        if (formData.emailVerified) {
                          setFormData(prev => ({ ...prev, emailVerified: false }));
                        }
                      }}
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
                        
                        // Send real OTP via API
                        const response = await fetch('/api/patients/send-otp', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            type: 'email',
                            value: formData.email
                          })
                        });
                        
                        const data = await response.json();
                        
                        toast.dismiss();
                        
                        if (data.success) {
                          toast.success("Verification code sent to your email");
                          setOtpSent(true);
                          setOtpCode('');
                          // For development environments only, we'll show the demo OTP
                          if (data.demo_otp) {
                            setDemoOtpCode(data.demo_otp);
                          } else {
                            setDemoOtpCode('Check your email');
                          }
                          
                          // Log email details for debugging
                          console.log('OTP email sent successfully. Details:', data);
                        } else {
                          toast.error(data.error || "Failed to send verification code");
                          console.error('OTP email failed:', data);
                        }
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          // Only allow numeric input and limit to 6 digits
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setOtpCode(numericValue.slice(0, 6));
                        }}
                        maxLength={6}
                        className="flex-grow"
                      />
                      <Button
                        id="verify-otp-btn"
                        type="button"
                        onClick={async () => {
                          if (!otpCode || otpCode.length < 4) {
                            toast.error("Please enter the verification code");
                            return;
                          }

                          setIsVerifyingOTP(true);
                          try {
                            toast.loading("Verifying code...");
                            
                            // Verify OTP via API
                            const response = await fetch('/api/patients/verify-otp', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                email: formData.email,
                                otp: otpCode
                              })
                            });
                            
                            const data = await response.json();
                            toast.dismiss();
                            
                            console.log('OTP verification response:', data);
                            if (data.success) {
                              toast.success("Email verified successfully!");
                              // Update formData directly instead of using prev state callback
                              setFormData({ ...formData, emailVerified: true });
                              setOtpSent(false);
                              console.log('Email verified, formData updated:', { ...formData, emailVerified: true });
                              
                              // Force UI update to enable the submit button
                              setTimeout(() => {
                                const createAccountBtn = document.querySelector('button[type="submit"]');
                                if (createAccountBtn && createAccountBtn instanceof HTMLButtonElement) {
                                  createAccountBtn.disabled = false;
                                  console.log('Create Account button enabled');
                                }
                              }, 100);
                            } else {
                              toast.error(data.message || "Invalid verification code");
                              console.error('OTP verification failed:', data.message);
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
                      {otpSent && (
                        <div className="rounded-md bg-green-50 p-3 mb-2">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-800">
                                Verification OTP sent! 
                                {!demoOtpCode.startsWith('Check') && (
                                  <>
                                    <span className="ml-1 font-bold">{demoOtpCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOtpCode(demoOtpCode);
                                        toast.success("OTP copied to input field");
                                      }}
                                      className="ml-2 rounded-md bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                      Copy to input
                                    </button>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                <div className="flex">
                  <div className="bg-green-100 text-green-800 font-semibold py-2 px-3 rounded-l-md border border-r-0 border-input flex items-center">
                    +232
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="XX XXX XXXX"
                    value={formData.phone.replace(/^\+232/, '')}
                    onChange={(e) => {
                      // Strip any non-numeric characters
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      handleChange({
                        ...e,
                        target: {
                          ...e.target,
                          name: 'phone',
                          value: numericValue
                        }
                      });
                    }}
                    className={`rounded-l-none ${validationErrors.phone ? "border-destructive" : ""}`}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.phone}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Sierra Leone format</p>
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
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      gender: value
                    }));
                    
                    // Clear validation error for gender if it exists
                    if (validationErrors.gender) {
                      setValidationErrors(prev => ({
                        ...prev,
                        gender: ''
                      }));
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
              
              {/* Medical ID is now generated in the background and not shown on registration form */}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.emailVerified}
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
              {!formData.emailVerified && (
                <p className="text-amber-600 text-xs text-center mt-2 font-medium">Please verify your email to continue</p>
              )}
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
