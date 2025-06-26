"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { generateMedicalID, isValidMedicalID } from "@/utils/medical-id"
import { generateUniqueMedicalID } from "@/utils/check-id-uniqueness"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Use dynamic imports to prevent SSR issues with React hooks
import dynamic from "next/dynamic"

const PersonalInfoStep = dynamic(() => import('./steps/personal-info-step').then(mod => mod.PersonalInfoStep), { ssr: false })
const LocationStep = dynamic(() => import('./steps/location-step').then(mod => mod.LocationStep), { ssr: false })
const SiblingsStep = dynamic(() => import('./steps/siblings-step').then(mod => mod.SiblingsStep), { ssr: false })
const PaymentMethodStep = dynamic(() => import('./steps/payment-method-step').then(mod => mod.PaymentMethodStep), { ssr: false })
const EmailVerificationStep = dynamic(() => import('./steps/email-verification-step').then(mod => mod.EmailVerificationStep), { ssr: false })
const VerificationStep = dynamic(() => import('./steps/verification-step').then(mod => mod.VerificationStep), { ssr: false })
const ReviewStep = dynamic(() => import('./steps/review-step').then(mod => mod.ReviewStep), { ssr: false })

// Define sibling interface
interface Sibling {
  name: string
  relationship: string
  contact?: string
}

// Define emergency contact interface
interface EmergencyContact {
  name: string
  relationship: string
  contact: string
}

// Define patient form data interface
export interface PatientFormData {
  // Personal Info
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  phone: string
  email: string
  password: string
  profilePicture?: string // Base64 or URL for profile picture
  
  // Location Info
  addressLine: string
  district: string
  city: string
  postalCode: string
  latitude?: number
  longitude?: number
  
  // Family Info
  hasSiblings: boolean
  siblings: Sibling[]
  emergencyContact?: EmergencyContact
  
  // Payment Info
  paymentMethod?: string
  insuranceProvider?: string
  insuranceNumber?: string
  
  // Verification
  phoneVerified: boolean
  emailVerified: boolean
}

// Form steps type
type FormStep = 1 | 2 | 3 | 4 | 5 | 6

export function MultiStepForm() {
  const router = useRouter()
  const [step, setStep] = useState<FormStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Initialize form data
  const [formData, setFormData] = useState<PatientFormData>({
    // Personal Info
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    password: "",
    
    // Location Info
    addressLine: "",
    district: "",
    city: "",
    postalCode: "",
    
    // Family Info
    hasSiblings: false,
    siblings: [],
    
    // Payment Info
    paymentMethod: "",
    
    // Verification
    phoneVerified: false,
    emailVerified: false,
  })

  // Steps configuration
  const steps = [
    { id: 1, title: "Personal Info" },
    { id: 2, title: "Email Verification" },
    { id: 3, title: "Location" },
    { id: 4, title: "Family" },
    { id: 5, title: "Payment" },
    { id: 6, title: "Review" }
  ]
  
  // Function to update form data
  const updateFormData = (data: Partial<PatientFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  // Navigate to specific step
  const goToStep = (stepNumber: FormStep) => {
    setStep(stepNumber)
    window.scrollTo(0, 0)
  }

  // Handle next step with validation
  const nextStep = () => {
    // Validate current step
    if (step === 1) {
      // Validate personal info
      if (!formData.firstName || !formData.lastName || !formData.gender || 
          !formData.dateOfBirth || !formData.phone || !formData.email || !formData.password) {
        toast.error("Please fill in all required personal information fields")
        return
      }
    } else if (step === 2) {
      // Validate email verification
      if (!formData.emailVerified) {
        toast.error("Please verify your email address before continuing")
        return
      }
    } else if (step === 3) {
      // Validate location info
      if (!formData.addressLine || !formData.district || !formData.city) {
        toast.error("Please fill in all required location fields")
        return
      }
    }
    // Steps 4 and 5 are optional
    
    // Move to next step if validation passes
    if (step < 6) {
      setStep((prev) => (prev + 1) as FormStep)
      window.scrollTo(0, 0)
    }
  }

  // Handle previous step
  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as FormStep)
      window.scrollTo(0, 0)
    }
  }
  
  // Generate a unique medical ID when the form is first loaded
  // This ensures we have a valid ID ready before submission
  const [medicalId, setMedicalId] = useState<string>("");
  
  useEffect(() => {
    const generateId = async () => {
      try {
        // Use our enhanced generator that guarantees uniqueness
        const uniqueId = await generateUniqueMedicalID();
        console.log('Generated unique medical ID for registration:', uniqueId);
        setMedicalId(uniqueId);
      } catch (error) {
        console.error('Failed to generate unique medical ID:', error);
        // Fallback to basic generation as last resort
        const basicId = generateMedicalID();
        console.warn('Using fallback medical ID generation:', basicId);
        setMedicalId(basicId);
      }
    };
    
    generateId();
  }, []);
  
  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      if (!medicalId || !isValidMedicalID(medicalId)) {
        throw new Error('Invalid medical ID for registration');
      }
      
      // Store the medical ID in localStorage for persistence
      localStorage.setItem('medicalNumber', medicalId);
      console.log('Using medical ID for registration:', medicalId);
      
      // Format data for API submission
      const patientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: {
          street: formData.addressLine,
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode,
          coordinates: formData.latitude && formData.longitude ? {
            latitude: formData.latitude,
            longitude: formData.longitude
          } : undefined
        },
        emergencyContact: formData.emergencyContact,
        siblings: formData.hasSiblings ? formData.siblings : [],
        paymentMethod: formData.paymentMethod,
        insuranceDetails: formData.paymentMethod === "insurance" ? {
          provider: formData.insuranceProvider,
          policyNumber: formData.insuranceNumber
        } : undefined,
        password: formData.password,
        // Include profile picture if available
        profilePicture: formData.profilePicture,
        // Include the generated medical ID for registration API requirement
        medicalId: medicalId
      }
      
      // Submit to API
      const response = await fetch("/api/patients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(patientData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to register patient")
      }
      
      // Show success message
      toast.success("Registration successful! Redirecting to your dashboard...")
      
      // Auto-login and redirect directly to dashboard
      setTimeout(async () => {
        // Auto-login the user with the credentials they just used
        try {
          // Use email for login since we've migrated to email-based authentication
          const loginResponse = await fetch('/api/patients/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: formData.email, // Updated to use email instead of phone
              password: formData.password
            })
          });
          
          if (loginResponse.ok) {
            // Successful login, redirect directly to dashboard
            window.location.href = '/dashboard';
          } else {
            // Fall back to auth login page if auto-login fails
            window.location.href = '/auth/login';
          }
        } catch (err) {
          console.error('Auto-login error:', err);
          // Fall back to login page
          window.location.href = '/auth/login';
        }
      }, 2000)
      
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error(error.message || "Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((s) => (
          <div 
            key={s.id} 
            className={`flex flex-col items-center ${
              step === s.id 
                ? "text-primary" 
                : step > s.id 
                  ? "text-green-500" 
                  : "text-muted-foreground"
            }`}
          >
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                step === s.id 
                  ? "bg-primary text-primary-foreground" 
                  : step > s.id 
                    ? "bg-green-100 text-green-500 border border-green-500" 
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s.id}
            </div>
            <span className="text-xs hidden md:block">{s.title}</span>
          </div>
        ))}
      </div>
    )
  }

  // Calculate progress percentage
  const getProgressPercentage = () => {
    return Math.round(((step - 1) / 5) * 100)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Patient Registration</CardTitle>
        <CardDescription>
          Sierra Leone National Health Service - Patient Registration System
        </CardDescription>
        <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300 ease-in-out" 
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {renderStepIndicators()}
        
        {/* Step content */}
        <div className="py-4">
          {step === 1 && (
            <PersonalInfoStep 
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {step === 2 && (
            <EmailVerificationStep 
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {step === 3 && (
            <LocationStep 
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {step === 4 && (
            <SiblingsStep 
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {step === 5 && (
            <PaymentMethodStep 
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {step === 6 && (
            <ReviewStep 
              formData={formData}
              updateFormData={updateFormData}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        {step > 1 && (
          <Button 
            variant="outline"
            onClick={prevStep}
            disabled={isSubmitting}
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        )}
        
        {step < 6 ? (
          <Button 
            onClick={nextStep}
            className={`${step === 1 ? 'w-full' : 'ml-auto'}`}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
