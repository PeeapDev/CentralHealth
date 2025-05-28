"use client"

import { useState } from "react"
import { PatientFormData } from "../multi-step-form"
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  CalendarDays, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface ReviewStepProps {
  formData: PatientFormData
  updateFormData: (data: Partial<PatientFormData>) => void
  onSubmit: () => void
}

export function ReviewStep({ formData, updateFormData, onSubmit }: ReviewStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataShareConsent, setDataShareConsent] = useState(false)
  
  // Check if all required information is complete
  const isPersonalInfoComplete = formData.firstName && 
                               formData.lastName && 
                               formData.phone && 
                               formData.email && 
                               formData.gender && 
                               formData.dateOfBirth
  
  const isLocationComplete = formData.addressLine && 
                           formData.district && 
                           formData.city
  
  // Check if verification is complete
  const isVerificationComplete = formData.phoneVerified && formData.emailVerified
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!termsAccepted || !dataShareConsent) {
      toast.error("Please accept the terms and consent to proceed")
      return
    }
    
    if (!isPersonalInfoComplete) {
      toast.error("Please complete your personal information")
      return
    }
    
    if (!isLocationComplete) {
      toast.error("Please complete your location information")
      return
    }
    
    if (!isVerificationComplete) {
      toast.error("Please complete phone and email verification")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Call the parent's onSubmit function
      await onSubmit()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error("Failed to submit registration. Please try again.")
      setIsSubmitting(false)
    }
  }
  
  // Format date of birth
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-SL", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <AlertTitle>Almost done!</AlertTitle>
        <AlertDescription>
          Please review your information below before submitting. You can go back to any step to make changes.
        </AlertDescription>
      </Alert>
      
      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <User className="mr-2 h-4 w-4" />
            Personal Information
            {!isPersonalInfoComplete && (
              <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Full Name</p>
            <p className="font-medium">{formData.firstName} {formData.lastName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gender</p>
            <p className="font-medium capitalize">{formData.gender || "Not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date of Birth</p>
            <p className="font-medium flex items-center">
              <CalendarDays className="mr-1 h-3 w-3 text-muted-foreground" />
              {formatDate(formData.dateOfBirth) || "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone Number</p>
            <p className="font-medium flex items-center">
              <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
              {formData.phone || "Not provided"}
              {formData.phoneVerified && (
                <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />
              )}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground">Email Address</p>
            <p className="font-medium flex items-center">
              <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
              {formData.email || "Not provided"}
              {formData.emailVerified && (
                <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />
              )}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <MapPin className="mr-2 h-4 w-4" />
            Location Information
            {!isLocationComplete && (
              <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="md:col-span-2">
            <p className="text-muted-foreground">Street Address</p>
            <p className="font-medium">{formData.addressLine || "Not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">District</p>
            <p className="font-medium">{formData.district || "Not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">City/Town</p>
            <p className="font-medium">{formData.city || "Not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Postal Code</p>
            <p className="font-medium">{formData.postalCode || "Not provided"}</p>
          </div>
          {formData.latitude && formData.longitude && (
            <div>
              <p className="text-muted-foreground">GPS Coordinates</p>
              <p className="font-medium text-xs">
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Users className="mr-2 h-4 w-4" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {formData.emergencyContact?.name ? (
            <>
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{formData.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Relationship</p>
                <p className="font-medium capitalize">{formData.emergencyContact.relationship || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact Number</p>
                <p className="font-medium">{formData.emergencyContact.contact || "Not provided"}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground md:col-span-2">No emergency contact provided</p>
          )}
        </CardContent>
      </Card>
      
      {/* Payment Information */}
      {formData.paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{formData.paymentMethod}</p>
            </div>
            
            {formData.paymentMethod === "insurance" && (
              <>
                <div>
                  <p className="text-muted-foreground">Insurance Provider</p>
                  <p className="font-medium">{formData.insuranceProvider || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Insurance/Policy Number</p>
                  <p className="font-medium">{formData.insuranceNumber || "Not provided"}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Terms and Consent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terms and Consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accept Terms and Conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                I agree to the terms and conditions of the Sierra Leone National Health Service and this hospital.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="dataConsent" 
              checked={dataShareConsent}
              onCheckedChange={(checked) => setDataShareConsent(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="dataConsent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Data Sharing Consent
              </Label>
              <p className="text-xs text-muted-foreground">
                I consent to my medical information being shared with healthcare providers within the Sierra Leone National Health Service network for the purpose of providing care.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !termsAccepted || !dataShareConsent || !isPersonalInfoComplete || !isLocationComplete || !isVerificationComplete}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
