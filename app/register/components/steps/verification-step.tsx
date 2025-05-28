"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientFormData } from "../multi-step-form"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Mail, Phone, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VerificationStepProps {
  formData: PatientFormData
  updateFormData: (data: Partial<PatientFormData>) => void
}

export function VerificationStep({ formData, updateFormData }: VerificationStepProps) {
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false)
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false)
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState("")
  const [emailOtp, setEmailOtp] = useState("")
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  
  // Send phone verification OTP
  const sendPhoneOtp = async () => {
    if (!formData.phone) {
      toast.error("Please provide a valid phone number")
      return
    }
    
    setIsSendingPhoneOtp(true)
    
    try {
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo, we'll simulate success
      setPhoneVerificationSent(true)
      toast.success("Verification code sent to your phone")
      
      // In production, we would call the actual API
      // const response = await fetch('/api/patients/send-phone-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone: formData.phone }),
      // })
      // 
      // if (response.ok) {
      //   setPhoneVerificationSent(true)
      //   toast.success("Verification code sent to your phone")
      // } else {
      //   const data = await response.json()
      //   toast.error(data.error || "Failed to send verification code")
      // }
      
    } catch (error) {
      console.error('Error sending phone OTP:', error)
      toast.error("Failed to send verification code")
    } finally {
      setIsSendingPhoneOtp(false)
    }
  }
  
  // Send email verification OTP
  const sendEmailOtp = async () => {
    if (!formData.email) {
      toast.error("Please provide a valid email address")
      return
    }
    
    setIsSendingEmailOtp(true)
    
    try {
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo, we'll simulate success
      setEmailVerificationSent(true)
      toast.success("Verification code sent to your email")
      
      // In production, we would call the actual API
      // const response = await fetch('/api/patients/send-email-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: formData.email }),
      // })
      // 
      // if (response.ok) {
      //   setEmailVerificationSent(true)
      //   toast.success("Verification code sent to your email")
      // } else {
      //   const data = await response.json()
      //   toast.error(data.error || "Failed to send verification code")
      // }
      
    } catch (error) {
      console.error('Error sending email OTP:', error)
      toast.error("Failed to send verification code")
    } finally {
      setIsSendingEmailOtp(false)
    }
  }
  
  // Verify phone OTP
  const verifyPhoneOtp = async () => {
    if (!phoneOtp) {
      toast.error("Please enter the verification code")
      return
    }
    
    setIsVerifyingPhone(true)
    
    try {
      // Simulate API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo, we'll just check if OTP is "123456"
      if (phoneOtp === "123456") {
        updateFormData({ phoneVerified: true })
        toast.success("Phone number verified successfully")
      } else {
        toast.error("Invalid verification code")
      }
      
      // In production, we would call the actual API
      // const response = await fetch('/api/patients/verify-phone-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone: formData.phone, otp: phoneOtp }),
      // })
      // 
      // if (response.ok) {
      //   updateFormData({ phoneVerified: true })
      //   toast.success("Phone number verified successfully")
      // } else {
      //   const data = await response.json()
      //   toast.error(data.error || "Failed to verify code")
      // }
      
    } catch (error) {
      console.error('Error verifying phone OTP:', error)
      toast.error("Failed to verify code")
    } finally {
      setIsVerifyingPhone(false)
    }
  }
  
  // Verify email OTP
  const verifyEmailOtp = async () => {
    if (!emailOtp) {
      toast.error("Please enter the verification code")
      return
    }
    
    setIsVerifyingEmail(true)
    
    try {
      // Simulate API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo, we'll just check if OTP is "123456"
      if (emailOtp === "123456") {
        updateFormData({ emailVerified: true })
        toast.success("Email address verified successfully")
      } else {
        toast.error("Invalid verification code")
      }
      
      // In production, we would call the actual API
      // const response = await fetch('/api/patients/verify-email-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: formData.email, otp: emailOtp }),
      // })
      // 
      // if (response.ok) {
      //   updateFormData({ emailVerified: true })
      //   toast.success("Email address verified successfully")
      // } else {
      //   const data = await response.json()
      //   toast.error(data.error || "Failed to verify code")
      // }
      
    } catch (error) {
      console.error('Error verifying email OTP:', error)
      toast.error("Failed to verify code")
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertTitle>Contact Verification Required</AlertTitle>
        <AlertDescription>
          For security and communication purposes, we need to verify your phone number and email address.
          For this demo, use the verification code <strong>123456</strong> for both.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Verification */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Phone Verification</CardTitle>
                <CardDescription>Verify your phone number</CardDescription>
              </div>
              <Phone className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {formData.phoneVerified ? (
              <div className="flex items-center justify-center py-6 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">Phone Verified</p>
                  <p className="text-xs text-muted-foreground">{formData.phone}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneOtp">Verification Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="phoneOtp"
                      placeholder="Enter 6-digit code"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      maxLength={6}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={sendPhoneOtp}
                      disabled={isSendingPhoneOtp || !formData.phone}
                    >
                      {isSendingPhoneOtp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={verifyPhoneOtp}
                  disabled={!phoneOtp || isVerifyingPhone || !phoneVerificationSent}
                  className="w-full"
                >
                  {isVerifyingPhone ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Phone"
                  )}
                </Button>
                
                {!phoneVerificationSent && (
                  <Button 
                    variant="outline" 
                    onClick={sendPhoneOtp}
                    disabled={isSendingPhoneOtp || !formData.phone}
                    className="w-full"
                  >
                    {isSendingPhoneOtp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Email Verification */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Email Verification</CardTitle>
                <CardDescription>Verify your email address</CardDescription>
              </div>
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {formData.emailVerified ? (
              <div className="flex items-center justify-center py-6 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">Email Verified</p>
                  <p className="text-xs text-muted-foreground">{formData.email}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailOtp">Verification Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="emailOtp"
                      placeholder="Enter 6-digit code"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      maxLength={6}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={sendEmailOtp}
                      disabled={isSendingEmailOtp || !formData.email}
                    >
                      {isSendingEmailOtp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={verifyEmailOtp}
                  disabled={!emailOtp || isVerifyingEmail || !emailVerificationSent}
                  className="w-full"
                >
                  {isVerifyingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
                
                {!emailVerificationSent && (
                  <Button 
                    variant="outline" 
                    onClick={sendEmailOtp}
                    disabled={isSendingEmailOtp || !formData.email}
                    className="w-full"
                  >
                    {isSendingEmailOtp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Why we need verification:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>To ensure we can contact you about appointments and test results</li>
          <li>To prevent unauthorized access to your medical information</li>
          <li>To send important health notifications and reminders</li>
          <li>To confirm your identity for the Sierra Leone National Health Service</li>
        </ul>
      </div>
    </div>
  )
}
