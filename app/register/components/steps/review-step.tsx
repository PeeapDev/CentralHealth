"use client"

import { useState } from "react"
import { PatientFormData } from "../multi-step-form"
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  CreditCard, 
  Home, 
  Loader2, 
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Users,
  CalendarClock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HealthCard } from "../health-card"
import { GoToDashboard } from "../go-to-dashboard"
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
      {/* Patient Card Preview */}
      <HealthCard formData={formData} />
      
      <Alert className="bg-blue-50 border-blue-200">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
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
              <AlertCircle className="ml-2 h-4 w-4 text-amber-500" />
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
              <CalendarClock className="mr-1 h-3 w-3 text-muted-foreground" />
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
              <AlertCircle className="ml-2 h-4 w-4 text-amber-500" />
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
        <CardFooter className="flex flex-col space-y-3">
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

          {formData.isRegistered && formData.medicalNumber && (
            <div className="flex flex-col md:flex-row gap-3 w-full mt-3">
              <GoToDashboard formData={formData} />
              
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  try {
                    // Dynamically import jsPDF to create PDF document
                    import('jspdf').then(({ default: JsPDF }) => {
                      // Create a new PDF document
                      const doc = new JsPDF();
                      const pageWidth = doc.internal.pageSize.getWidth();
                      
                      // Add hospital logo/header
                      doc.setFontSize(18);
                      doc.setFont('helvetica', 'bold');
                      doc.text('Sierra Leone National Health Service', pageWidth / 2, 20, { align: 'center' });
                      
                      doc.setFontSize(14);
                      doc.text('Patient Registration Confirmation', pageWidth / 2, 30, { align: 'center' });
                      
                      // Add horizontal line
                      doc.setDrawColor(0, 0, 0);
                      doc.line(20, 35, pageWidth - 20, 35);
                      
                      // Add medical number and registration date
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`Medical Number: ${formData.medicalNumber}`, 20, 45);
                      doc.text(`Registration Date: ${new Date().toLocaleDateString()}`, 20, 55);
                      
                      // Create a patient health card
                      const cardY = 190;
                      const cardWidth = 150;
                      const cardHeight = 85;
                      const cardX = (pageWidth - cardWidth) / 2;
                      
                      // Draw card outline
                      doc.setFillColor(240, 240, 240);
                      doc.setDrawColor(0, 128, 0); // Green border
                      doc.setLineWidth(0.5);
                      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, 'FD');
                      
                      // Add Sierra Leone crest or logo position
                      doc.setFillColor(0, 128, 0); // Green background for logo area
                      doc.rect(cardX + 5, cardY + 5, 25, 25, 'F');
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text("SL", cardX + 17.5, cardY + 20, { align: 'center' });
                      
                      // Reset text color
                      doc.setTextColor(0, 0, 0);
                      
                      // Add card title
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text("SIERRA LEONE HEALTH CARD", cardX + cardWidth/2, cardY + 15, { align: 'center' });
                      
                      // Add patient details
                      doc.setFontSize(10);
                      doc.setFont('helvetica', 'normal');
                      doc.text(`Name: ${formData.firstName} ${formData.lastName}`, cardX + 35, cardY + 30);
                      doc.text(`Med #: ${formData.medicalNumber}`, cardX + 35, cardY + 40);
                      doc.text(`DOB: ${new Date(formData.dateOfBirth).toLocaleDateString()}`, cardX + 35, cardY + 50);
                      doc.text(`Gender: ${formData.gender}`, cardX + 35, cardY + 60);
                      
                      // Add website
                      doc.setFontSize(8);
                      doc.setFont('helvetica', 'italic');
                      doc.text("https://mohs.gov.sl/", cardX + cardWidth/2, cardY + cardHeight - 5, { align: 'center' });
                      
                      // Personal Information section
                      doc.setFontSize(14);
                      doc.setFont('helvetica', 'bold');
                      doc.text('Personal Information', 20, 70);
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'normal');
                      doc.text(`Full Name: ${formData.firstName} ${formData.lastName}`, 25, 80);
                      doc.text(`Gender: ${formData.gender}`, 25, 90);
                      doc.text(`Date of Birth: ${new Date(formData.dateOfBirth).toLocaleDateString()}`, 25, 100);
                      doc.text(`Email: ${formData.email}`, 25, 110);
                      doc.text(`Phone: ${formData.phone}`, 25, 120);
                      
                      // Address section
                      doc.setFontSize(14);
                      doc.setFont('helvetica', 'bold');
                      doc.text('Address Information', 20, 135);
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'normal');
                      doc.text(`Address: ${formData.addressLine}`, 25, 145);
                      doc.text(`City: ${formData.city}`, 25, 155);
                      doc.text(`District: ${formData.district}`, 25, 165);
                      if (formData.postalCode) {
                        doc.text(`Postal Code: ${formData.postalCode}`, 25, 175);
                      }
                      
                      // Footer with disclaimer
                      doc.setFontSize(10);
                      doc.setFont('helvetica', 'italic');
                      doc.text('This document serves as proof of registration with the Sierra Leone National Health Service.', 20, 260);
                      doc.text('Please keep this document for your records and bring it to your first appointment.', 20, 270);
                      doc.text('For more information, visit: https://mohs.gov.sl/', 20, 280);
                      
                      // Save the PDF
                      doc.save(`patient-registration-${formData.medicalNumber}.pdf`);
                      toast.success("Application PDF downloaded successfully");
                    }).catch(error => {
                      console.error('Error generating PDF:', error);
                      toast.error("Failed to generate PDF. Please try again.");
                    });
                  } catch (error) {
                    console.error('Error in PDF generation:', error);
                    toast.error("Could not generate PDF. Please try again later.");
                  }
                }}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Download My Application
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
