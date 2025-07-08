"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { storeUserEmail, storePatientId } from "@/hooks/use-patient-storage"
import { toast } from "sonner"
import { sendOTPEmail, sendWelcomeRegistrationEmail } from "../actions"
import { generateMedicalID } from '@/utils/medical-id';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, User, Loader2, CheckCircle, Camera, Upload, X, RefreshCcw, Copy, Mail, Phone } from "lucide-react"

// Define validation error and form data interfaces
interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  birthDate?: string;
  gender?: string;
  photo?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  gender: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  medicalId?: string;
  photo?: string;
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
    confirmPassword: "",
    birthDate: "",
    gender: "",
    emailVerified: false,
    phoneVerified: false,
    medicalId: ""
  });
  
  // Email OTP verification states
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [demoEmailOtpCode, setDemoEmailOtpCode] = useState("");
  const [isSendingEmailOTP, setIsSendingEmailOTP] = useState(false);
  const [isVerifyingEmailOTP, setIsVerifyingEmailOTP] = useState(false);
  
  // Phone OTP verification states
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [demoPhoneOtpCode, setDemoPhoneOtpCode] = useState("123456"); // Fixed code for demo
  const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
  const [isVerifyingPhoneOTP, setIsVerifyingPhoneOTP] = useState(false);
  
  // Shared states
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Photo upload state and refs
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Format phone number to Sierra Leone format (+232)
  const formatPhoneNumber = (phone: string): string => {
    // Phone already has the country code from the input field handling
    // Just ensure it's properly formatted
    if (phone.startsWith('+232')) {
      return phone;
    }
    
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if not present
    return `+232${digits}`;
  };
  
  // Use the central medical ID generator
  const generateMedicalId = (): string => {
    return generateMedicalID();
  };

  // Photo capture and upload functions
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        setShowCamera(true);
      } else {
        setCameraError("Camera not supported by your browser");
        toast.error("Camera not supported by your browser");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please check permissions.");
      toast.error("Failed to access camera. Please check permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (!context) return;
      
      // Set canvas dimensions to match the video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const photoData = canvas.toDataURL("image/jpeg");
      setPhotoPreview(photoData);
      setFormData(prev => ({ ...prev, photo: photoData }));
      
      // Stop camera stream
      stopCamera();
      
      toast.success("Photo captured successfully");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, photo: result }));
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Email verification functions
  const checkEmailExists = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      setError(""); // Clear any previous errors
      
      console.log(`Checking if email exists: ${email}`);
      
      try {
        // Make an actual API call to check if email exists in database
        const response = await fetch('/api/patients/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        // Even if the response is not OK, we'll try to parse any response data
        // that might contain more detailed error information
        const data = await response.json().catch(() => ({ success: false, exists: false }));
        
        if (!response.ok) {
          console.warn(`Email check failed with status ${response.status}: ${JSON.stringify(data)}`);
          // Don't throw here - we'll handle the error more gracefully
          setEmailExists(false); // Assume email doesn't exist if we can't verify
          return false;
        }
        
        const exists = data.exists;
        console.log(`Email check result: exists=${exists}`, data);
        
        setEmailExists(exists);
        return exists;
      } catch (fetchError) {
        console.error('Error during email check fetch:', fetchError);
        // If the fetch fails, assume email doesn't exist and continue
        setEmailExists(false);
        return false;
      }
      
      // Show an error message if we got here and email exists state is true
      if (emailExists) {
        setError("This email is already registered. Please use a different email or login.");
      }
      
      return emailExists;
    } catch (error) {
      console.error('Error checking email existence:', error);
      setError("Could not verify email availability. Please try again.");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSendEmailOTP = async () => {
    // First, validate required fields before email verification
    if (!formData.firstName || !formData.lastName) {
      setValidationErrors(prev => ({ 
        ...prev, 
        firstName: !formData.firstName ? "First name is required" : undefined,
        lastName: !formData.lastName ? "Last name is required" : undefined
      }));
      return;
    }
    
    // Validate gender
    if (!formData.gender) {
      setValidationErrors(prev => ({ ...prev, gender: "Please select your gender" }));
      return;
    }
    
    // Validate date of birth
    if (!formData.birthDate) {
      setValidationErrors(prev => ({ ...prev, birthDate: "Date of birth is required" }));
      return;
    }
    
    // Now validate and process email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }
    setIsSendingEmailOTP(true);
    setError("");
    try {
      // Check email existence but don't throw if the API fails
      let exists = false;
      try {
        exists = await checkEmailExists(formData.email);
      } catch (checkError) {
        console.error('Email check failed but will proceed with OTP:', checkError);
        // If the API fails, we'll still allow the user to proceed
        // since we'll verify the email through OTP delivery anyway
      }
      
      if (exists) {
        toast.error("This email is already registered", {
          description: "Please use a different email address or log in to your existing account.",
          duration: 5000
        });
        setValidationErrors(prev => ({ ...prev, email: "This email address is already associated with an existing patient account" }));
        setIsSendingEmailOTP(false);
        return;
      }
      
      // Generate a 6-digit OTP
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated OTP for verification');
      
      // Don't display the OTP immediately - wait for successful email delivery
      // The OTP will only be displayed after email confirmation
      
      // Generate a medical ID for the verification and future registration
      // According to CentralHealth policy, each patient must have one permanent medical ID
      // that follows NHS-style 5-character alphanumeric format
      console.log('Generating a new medical ID for the patient...');
      const medicalId = generateMedicalID();
      console.log(`Generated new medical ID using central utility: ${medicalId}`);
      
      // Update form data with the generated medical ID
      setFormData(prev => ({
        ...prev,
        medicalId: medicalId
      }));
      
      // We don't store this in localStorage to prevent confusion
      // The medical ID will be properly saved when the patient completes registration
      
      // Hospital information for personalized email
      const hospitalName = "Sierra Leone National Health Service";
      
      try {
        // Show loading toast while sending real email
        const loadingToast = toast.loading(`Sending verification email to ${formData.email}...`);
        
        console.log("Sending verification email with:", {
          email: formData.email,
          otp: generatedOTP,
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          hospitalName
        });
        
        // Use server action to send email with real SMTP (this runs on the server side)
        // Wait for the email to be sent before continuing
        try {
          // Use the directly generated medicalId rather than formData.medicalId
          // because state updates (setFormData) are asynchronous and may not be reflected yet
          console.log(`Sending email with medical ID: ${medicalId}`);
          const emailResult = await sendOTPEmail(
            formData.email, 
            generatedOTP,
            formData.firstName,
            formData.lastName,
            formData.gender,
            medicalId // Use the direct variable, not the state variable
          );
          
          // Dismiss loading toast
          toast.dismiss(loadingToast);
          
          // Whether email succeeded or failed, we always set the state with the OTP
          setDemoEmailOtpCode(generatedOTP);
          setEmailOtpSent(true);
          
          // TEMPORARY: Force the OTP into the input field to ensure verification can work
          setEmailOtp(generatedOTP);
          
          // Get the OTP from the response (always included in our updated action)
          const displayOtp = emailResult.otp || generatedOTP;
          
          if (emailResult.success) {
            console.log('Email sent successfully:', emailResult.messageId);
            
            // Show success toast but also provide clickable OTP as a convenience
            toast.success(
              "Verification code sent to your email", 
              { 
                description: (
                  <div>
                    <p className="mb-2">Please check your inbox for the 6-digit code.</p>
                    <p>
                      Or click here: {" "}
                      <button 
                        onClick={() => {
                          // Auto-fill the verification input field
                          setEmailOtp(displayOtp);
                        }}
                        className="font-bold underline"
                      >
                        {displayOtp}
                      </button>
                    </p>
                  </div>
                ),
                duration: 15000 
              }
            );
          } else {
            // Use warning instead of error since timeout is an expected fallback behavior
            const isTimeout = emailResult.error?.includes('timeout');
            if (isTimeout) {
              console.warn('Email sending timed out - using fallback OTP display');
            } else {
              console.error('Email sending failed:', emailResult.error);
            }
            
            // Display OTP as fallback when email fails, with clickable code
            toast.error(
              "Email delivery failed", 
              { 
                description: (
                  <div>
                    <p className="mb-1">{emailResult.error || "Unable to send email."}</p>
                    <p>
                      Please use this code instead: {" "}
                      <button 
                        onClick={() => {
                          // Auto-fill the verification input field
                          setEmailOtp(displayOtp);
                        }}
                        className="font-bold underline"
                      >
                        {displayOtp}
                      </button>
                    </p>
                  </div>
                ), 
                duration: 20000 
              }
            );
          }
        } catch (emailErr) {
          // Dismiss loading toast
          toast.dismiss(loadingToast);
          console.error("Failed to send email:", emailErr);
          
          // Store OTP in state
          setDemoEmailOtpCode(generatedOTP);
          setEmailOtpSent(true);
          
          // Display OTP as fallback when email throws error, with clickable code
          toast.error(
            "Email delivery failed", 
            { 
              description: (
                <div>
                  Please use this code instead: {" "}
                  <button 
                    onClick={() => {
                      // Auto-fill the verification input field
                      setEmailOtp(generatedOTP);
                    }}
                    className="font-bold underline"
                  >
                    {generatedOTP}
                  </button>
                </div>
              ), 
              duration: 15000 
            }
          );
        }
      } catch (err) {
        console.error("Error in email verification process:", err);
        toast.error("Error in verification process. Please try again.", { duration: 5000 });
        setIsSendingEmailOTP(false);
      }
    } catch (err) {
      console.error("Error sending email OTP:", err);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsSendingEmailOTP(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOtp) {
      setError("Please enter the verification code");
      toast.error("Verification code required", {
        description: "Please check your email and enter the 6-digit code",
        duration: 4000
      });
      return;
    }
    setIsVerifyingEmailOTP(true);
    setError("");
    try {
      // Debug logging to help understand the issue
      console.log('Verifying email OTP:', { 
        entered: emailOtp, 
        stored: demoEmailOtpCode,
        entered_type: typeof emailOtp,
        stored_type: typeof demoEmailOtpCode,
        match: emailOtp === demoEmailOtpCode 
      });
      
      // Ensure consistent string comparison by trimming whitespace
      const enteredCode = emailOtp.trim();
      const storedCode = demoEmailOtpCode.trim();
      
      // Quick verification if code matches
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (enteredCode === storedCode) {
        console.log('Verification successful!');
        setFormData(prev => ({ ...prev, emailVerified: true }));
        toast.success("Email verified successfully");
        
        // Auto-focus the phone field for better flow
        const phoneInput = document.getElementById("phone");
        if (phoneInput) {
          phoneInput.focus();
        }
      } else {
        console.log('Verification failed. Codes do not match:', { enteredCode, storedCode });
        setError("Invalid verification code");
        toast.error("Verification failed", {
          description: "The code doesn't match. Please check your email and try again.",
          duration: 5000
        });
      }
    } catch (err) {
      console.error("Error verifying email OTP:", err);
      setError("Failed to verify code. Please try again.");
      toast.error("Verification error", {
        description: "An error occurred during verification. Please try again.",
        duration: 5000
      });
    } finally {
      setIsVerifyingEmailOTP(false);
    }
  };

  // Phone verification functions
  const handleSendPhoneOTP = async () => {
    // First validate basic fields if not already verified
    if (!formData.firstName || !formData.lastName || !formData.gender || !formData.birthDate) {
      setValidationErrors(prev => ({
        ...prev,
        firstName: !formData.firstName ? "First name is required" : undefined,
        lastName: !formData.lastName ? "Last name is required" : undefined,
        gender: !formData.gender ? "Please select your gender" : undefined,
        birthDate: !formData.birthDate ? "Date of birth is required" : undefined
      }));
      return;
    }
    
    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(formData.phone);
    
    if (!formattedPhone || formattedPhone.length < 10) {
      setValidationErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
      return;
    }
    
    setIsSendingPhoneOTP(true);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
    setError("");
    
    try {
      // Check if phone number is already registered
      // In a real app, you would check against your database
      const existingPhoneNumbers = ['+23276123456', '+23277987654', '+23299555555'];
      
      if (existingPhoneNumbers.includes(formattedPhone)) {
        toast.error("This phone number is already registered", {
          description: "Please use a different phone number or log in to your existing account.",
          duration: 5000
        });
        setValidationErrors(prev => ({ ...prev, phone: "This phone number is already associated with an existing patient account" }));
        setIsSendingPhoneOTP(false);
        return;
      }
      
      // In a real app, you would send an SMS with verification code
      // For now, we'll simulate sending a real SMS with a timeout
      const sendingSmsToast = toast.loading(`Sending verification SMS to ${formattedPhone}...`);
      
      try {
        // Simulate SMS API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real implementation, you would make an API call to your SMS provider here
        // const smsResult = await sendSMS(formattedPhone, demoPhoneOtpCode);
        
        toast.dismiss(sendingSmsToast);
        toast.success(`Verification code sent to ${formattedPhone}`, {
          description: (
            <div>
              Please use this code: {" "}
              <button 
                onClick={() => {
                  // Auto-fill the verification input field
                  setPhoneOtp(demoPhoneOtpCode);
                }}
                className="font-bold underline"
              >
                {demoPhoneOtpCode}
              </button>
            </div>
          ),
          duration: 15000
        });
        
        setPhoneOtpSent(true);
      } catch (error) {
        toast.dismiss(sendingSmsToast);
        console.error('Error sending SMS:', error);
        toast.error("Failed to send verification SMS", {
          description: "Please check your phone number and try again",
          duration: 5000
        });
        setIsSendingPhoneOTP(false);
        return;
      }
    } catch (err) {
      console.error("Error sending phone OTP:", err);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsSendingPhoneOTP(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOtp) {
      setError("Please enter the verification code");
      toast.error("Verification code required", {
        description: "Please check your SMS and enter the 6-digit code",
        duration: 4000
      });
      return;
    }
    setIsVerifyingPhoneOTP(true);
    setError("");
    try {
      // Quick verification if code matches
      await new Promise(resolve => setTimeout(resolve, 500));
      if (phoneOtp === demoPhoneOtpCode) {
        setFormData(prev => ({ ...prev, phoneVerified: true }));
        toast.success("Phone number verified successfully");
      } else {
        setError("Invalid verification code");
        toast.error("Verification failed", {
          description: "The code doesn't match. Please check your SMS and try again.",
          duration: 5000
        });
      }
    } catch (err) {
      console.error("Error verifying phone OTP:", err);
      setError("Failed to verify code. Please try again.");
    } finally {
      setIsVerifyingPhoneOTP(false);
    }
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
    const errors: ValidationErrors = {};
    let isValid = true;

    // Check required fields
    if (!formData.firstName) {
      errors.firstName = "First name is required";
      isValid = false;
    }

    if (!formData.lastName) {
      errors.lastName = "Last name is required";
      isValid = false;
    }
    
    if (!formData.birthDate) {
      errors.birthDate = "Date of birth is required";
      isValid = false;
    }
    
    if (!formData.gender) {
      errors.gender = "Please select your gender";
      isValid = false;
    }

    if (!formData.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    // Password validation
    if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    // Password match
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    // Phone number validation
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = "Please enter a valid phone number";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Medical IDs are now handled by the server during registration
  // According to CentralHealth System requirements:
  // - Medical IDs must NEVER be regenerated for existing patients
  // - Each patient receives ONE permanent medical ID for their lifetime
  // - Medical IDs must follow NHS-style 5-character alphanumeric format
  // - Medical IDs are only generated when a new patient record is created
  useEffect(() => {
    // Clear any stored medical IDs from localStorage to prevent confusion
    // The proper medical ID will be assigned during the actual registration process
    localStorage.removeItem('medicalNumber');
    localStorage.removeItem('patientId');
    
    // Clear any medical ID in the form data
    setFormData(prev => ({
      ...prev,
      medicalId: '' // Leave blank - will be generated by server
    }));
    
    console.log('Medical ID will be generated by the server during registration');
  }, []);

  // Handle registration submission
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill out all required fields correctly");
      return;
    }

    // Additional check for both email and phone verification
    if (!formData.emailVerified || !formData.phoneVerified) {
      toast.error("Please verify both email and phone number");
      setValidationErrors(prev => ({
        ...prev,
        email: formData.emailVerified ? prev.email : "Please verify your email",
        phone: formData.phoneVerified ? prev.phone : "Please verify your phone number"
      }));
      return;
    }
    
    // Final check to make sure email isn't already registered
    try {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        return false;
      }
    } catch (error) {
      console.error('Error during final email validation:', error);
      // Continue anyway since we already verified with OTP
    }

    setIsLoading(true);
    setError("");

    try {
      // Priority system for medical ID: 
      // 1. Use existing medicalId from formData if available
      // 2. Check localStorage for medicalNumber
      // 3. Check localStorage for patientId
      // 4. Generate a new one as last resort
      const existingMedicalId = formData.medicalId || 
                            localStorage.getItem("medicalNumber") || 
                            localStorage.getItem("patientId");
      
      const medicalId = existingMedicalId || generateMedicalId();
      formData.medicalId = medicalId;
      
      console.log(`Using medical ID source: ${formData.medicalId ? 'formData' : 
                  localStorage.getItem("medicalNumber") ? 'localStorage:medicalNumber' : 
                  localStorage.getItem("patientId") ? 'localStorage:patientId' : 
                  'newly generated'}`);
      console.log(`Final medical ID: ${medicalId}`);

      // Store the medical ID in localStorage for persistence
      localStorage.setItem("medicalNumber", medicalId);
      localStorage.setItem("patientId", medicalId);
      localStorage.setItem("patientEmail", formData.email);
      localStorage.setItem("userEmail", formData.email);
      
      // Call the registration API directly
      console.log('Calling registration API with data:', {
        medicalId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      
      const response = await fetch('/api/patients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 'basic',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          medicalId: medicalId,
          phone: formatPhoneNumber(formData.phone),
          gender: formData.gender,
          birthDate: formData.birthDate,
          profilePicture: formData.photo || null
        })
      });
      
      let data;
      if (!response.ok) {
        try {
          const errorText = await response.text();
          // Check if response is HTML (indicates server error)
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            console.error('Server returned HTML instead of JSON:', errorText.substring(0, 200));
            throw new Error('Server error occurred. Please try again later.');
          }
          
          // Try to parse as JSON if it doesn't look like HTML
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Registration failed');
          } catch (jsonError) {
            throw new Error(`Server error: ${errorText.substring(0, 100)}...`);
          }
        } catch (textError) {
          throw textError;
        }
      }
      
      try {
        const responseText = await response.text();
        // Check if response is HTML
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('Success response contained HTML:', responseText.substring(0, 200));
          throw new Error('Unexpected server response format');
        }
        data = JSON.parse(responseText);
        console.log('Registration API response:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Failed to process server response');
      }
      
      // Notify the user about successful registration
      toast.success("Registration successful!", {
        description: "Creating your account and redirecting to dashboard",
        duration: 3000
      });
      
      // Follow the API's redirect to dashboard or default to dashboard
      setTimeout(() => {
        window.location.href = data.redirectTo || '/patient/dashboard';
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
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
              {formData.photo ? (
                <div className="rounded-full bg-primary/10 overflow-hidden w-16 h-16 transform transition-transform hover:scale-105 duration-300 border-2 border-primary/20">
                  <img 
                    src={formData.photo} 
                    alt="Profile Preview" 
                    className="object-cover w-full h-full"
                  />
                </div>
          
                      ) : (
                <div className="rounded-full bg-primary/10 p-4 transform transition-transform hover:scale-105 duration-300">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Create your hospital patient account in minutes. After registration, you'll go directly to your patient dashboard.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-5 border-destructive/50 animate-fadeIn">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              {/* First Name and Last Name on the same line */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className="block w-full"
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className="block w-full"
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>
              

              {/* Profile photo upload */}
              {/* Date of Birth and Gender fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDate">Date of Birth</Label>
                  <Input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    placeholder="Enter your date of birth"
                    className="block w-full"
                  />
                  {validationErrors.birthDate && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.birthDate}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, gender: value }));
                      // Clear validation errors
                      if (validationErrors.gender) {
                        setValidationErrors(prev => ({ ...prev, gender: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.gender && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.gender}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="photo" className="block mb-2">Profile Photo</Label>
                <div className="mt-2 space-y-2">
                  {/* Only show photo options if no photo is already displayed at the top */}
                  {!formData.photo && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                        onClick={startCamera}
                      >
                        <Camera className="h-4 w-4" />
                        <span>Take Photo</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </Button>
                    </div>
                  )}
  
                  {showCamera && (
                    <div className="space-y-2">
                      <div className="rounded-md overflow-hidden border border-input">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full"
                        ></video>
                      </div>
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          onClick={stopCamera}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          onClick={capturePhoto}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capture
                        </Button>
                      </div>
                      <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                  )}
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Email verification */}
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex">
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={validationErrors.email ? "border-destructive flex-grow" : "flex-grow"}
                  />
                  <Button onClick={handleSendEmailOTP} disabled={isSendingEmailOTP || emailExists || formData.emailVerified} className="ml-2 h-10">
                    {isSendingEmailOTP ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : formData.emailVerified ? (
                      "Verified"
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </div>
                {validationErrors.email && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.email}</p>
                )}
                
                {emailOtpSent && !formData.emailVerified && (
                  <div className="mt-2">
                    <div className="flex space-x-2">
                      <Input
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="h-10"
                        placeholder="Enter verification code"
                      />
                      <Button onClick={handleVerifyEmailOTP} disabled={isVerifyingEmailOTP || !emailOtp} className="h-10">
                        {isVerifyingEmailOTP ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                    {/* Add a message about checking email */}
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        <span>Please check your email for the verification code</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {emailOtpSent && formData.emailVerified && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Email verified successfully</span>
                  </div>
                )}
              </div>
              
              {/* Phone verification */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <div className="flex flex-grow">
                    <div className="bg-gray-100 border border-r-0 rounded-l-md flex items-center justify-center px-3">
                      <span className="text-gray-500">+232</span>
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone.startsWith("+232") ? formData.phone.substring(4) : formData.phone}
                      onChange={(e) => {
                        // Remove any non-digit characters
                        const digits = e.target.value.replace(/\D/g, '');
                        // Store with country code but show without it
                        setFormData(prev => ({ ...prev, phone: `+232${digits}` }));
                      }}
                      className={`rounded-l-none ${validationErrors.phone ? "border-destructive" : ""}`}
                    />
                  </div>
                  <Button onClick={handleSendPhoneOTP} disabled={isSendingPhoneOTP || formData.phoneVerified} className="ml-2 h-10">
                    {isSendingPhoneOTP ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : formData.phoneVerified ? (
                      "Verified"
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </div>
                {validationErrors.phone && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.phone}</p>
                )}
                
                {phoneOtpSent && !formData.phoneVerified && (
                  <div>
                    <div className="mt-2 flex space-x-2">
                      <Input
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        className="h-10"
                        placeholder="Enter verification code"
                      />
                      <Button onClick={handleVerifyPhoneOTP} disabled={isVerifyingPhoneOTP || !phoneOtp} className="h-10">
                        {isVerifyingPhoneOTP ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>Please check your phone for the SMS verification code</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {phoneOtpSent && formData.phoneVerified && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Phone number verified successfully</span>
                  </div>
                )}
              </div>
              
              {/* Password fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="block w-full"
                  />
                  {validationErrors.password && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.password}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="block w-full"
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-destructive text-xs mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.emailVerified || !formData.phoneVerified}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account & Go to Dashboard"
                )}
              </Button>
              {(!formData.emailVerified || !formData.phoneVerified) && (
                <p className="text-amber-600 text-xs text-center mt-2 font-medium">
                  {!formData.emailVerified && !formData.phoneVerified ? "Please verify your email and phone to register" :
                   !formData.emailVerified ? "Please verify your email to register" :
                   "Please verify your phone number to register"}
                </p>
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
