"use client"

import { useState, useEffect } from "react"
import { PatientFormData } from "../clean-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EmailVerificationStepProps {
  formData: PatientFormData
  updateFormData: (data: Partial<PatientFormData>) => void
}

export function EmailVerificationStep({ formData, updateFormData }: EmailVerificationStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  
  // Timer for resend countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])
  
  // Send verification code
  const sendVerificationCode = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address first")
      return
    }
    
    setIsSending(true)
    try {
      const response = await fetch('/api/patients/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Verification code sent to your email")
        setOtpSent(true)
        setTimeLeft(60) // 60 seconds countdown for resend
        updateFormData({ emailVerified: false })
      } else {
        toast.error(data.error || "Failed to send verification code")
      }
    } catch (error) {
      console.error("Error sending verification code:", error)
      toast.error("Failed to send verification code. Please try again.")
    } finally {
      setIsSending(false)
    }
  }
  
  // Verify OTP
  const verifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the verification code")
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/patients/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          otp: otp
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Email verified successfully!")
        updateFormData({ emailVerified: true })
      } else {
        toast.error(data.error || "Invalid verification code")
        updateFormData({ emailVerified: false })
      }
    } catch (error) {
      console.error("Error verifying code:", error)
      toast.error("Failed to verify code. Please try again.")
      updateFormData({ emailVerified: false })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Email Verification Required</AlertTitle>
        <AlertDescription>
          We need to verify your email address. Please check your inbox for a verification code.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="flex-1"
            />
            <Button 
              type="button"
              onClick={sendVerificationCode}
              disabled={isSending || timeLeft > 0}
              variant="outline"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {timeLeft > 0 ? `Resend (${timeLeft}s)` : otpSent ? "Resend Code" : "Send Code"}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <div className="flex gap-2">
            <Input
              id="otp"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="flex-1"
            />
            <Button 
              type="button"
              onClick={verifyOtp}
              disabled={isLoading || !otpSent || otp.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Verify
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code sent to your email address
          </p>
        </div>
      </div>
      
      {formData.emailVerified && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md">
          Your email has been successfully verified!
        </div>
      )}
    </div>
  )
}
