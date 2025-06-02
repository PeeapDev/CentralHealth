"use client"

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PatientFormData } from "../multi-step-form"
import { CalendarIcon, AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PersonalInfoStepProps {
  formData: PatientFormData
  updateFormData: (data: Partial<PatientFormData>) => void
}

export function PersonalInfoStep({ formData, updateFormData }: PersonalInfoStepProps) {
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  
  // Handle email uniqueness check
  const checkEmailUniqueness = async (email: string) => {
    if (!email || !email.includes('@')) return
    
    setIsCheckingEmail(true)
    try {
      const response = await fetch(`/api/patients/check-email?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      
      if (!response.ok || data.exists) {
        toast.error("Email is already in use")
        updateFormData({ email: '' })
      }
    } catch (error) {
      console.error("Error checking email uniqueness:", error)
    } finally {
      setIsCheckingEmail(false)
    }
  }
  
  // Handle phone uniqueness check
  const checkPhoneUniqueness = async (phone: string) => {
    if (!phone || phone.length < 8) return
    
    setIsCheckingPhone(true)
    try {
      const response = await fetch(`/api/patients/check-phone?phone=${encodeURIComponent(phone)}`)
      const data = await response.json()
      
      if (!response.ok || data.exists) {
        toast.error("Phone number is already in use")
        updateFormData({ phone: '' })
      }
    } catch (error) {
      console.error("Error checking phone uniqueness:", error)
    } finally {
      setIsCheckingPhone(false)
    }
  }

  // Send email verification OTP
  const sendVerificationOTP = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSendingOTP(true)
    try {
      const response = await fetch('/api/patients/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'email',
          value: formData.email 
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success("Verification code sent to your email")
        setEmailVerificationSent(true)
      } else {
        toast.error(data.message || "Failed to send verification code")
      }
    } catch (error) {
      console.error("Error sending verification code:", error)
      toast.error("Failed to send verification code")
    } finally {
      setIsSendingOTP(false)
    }
  }

  // Verify email OTP
  const verifyEmailOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      toast.error("Please enter the verification code")
      return
    }

    setIsVerifyingOTP(true)
    try {
      const response = await fetch('/api/patients/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          otp: otpCode 
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success("Email verified successfully!")
        setIsEmailVerified(true)
        updateFormData({ emailVerified: true })
      } else {
        toast.error(data.message || "Invalid verification code")
      }
    } catch (error) {
      console.error("Error verifying code:", error)
      toast.error("Failed to verify code")
    } finally {
      setIsVerifyingOTP(false)
    }
  }
  
  // Function to handle OTP code input changes
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const numericValue = e.target.value.replace(/[^0-9]/g, '')
    setOtpCode(numericValue)
  }

  // Function to handle clicking the resend OTP button
  const handleResendOTP = () => {
    sendVerificationOTP()
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Please provide accurate personal information. Your unique medical number will be generated after registration.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Enter your first name"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Enter your last name"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => updateFormData({ gender: value })}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value;
              if (date) {
                // Convert to ISO string but preserve local date
                const dateObj = new Date(date + 'T00:00:00');
                updateFormData({ dateOfBirth: dateObj.toISOString() });
              } else {
                updateFormData({ dateOfBirth: '' });
              }
            }}
            min="1900-01-01"
            max={new Date().toISOString().split('T')[0]}
            className="w-full"
            required
          />
          <p className="text-xs text-muted-foreground">Please select your date of birth</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex">
            <span className="inline-flex items-center px-4 py-2 border border-r-0 border-input rounded-l-md bg-green-100 text-green-800 font-medium mr-0.5">
              +232
            </span>
            <Input
              id="phone"
              className="rounded-l-none pl-3"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => {
                // Remove leading zero if present
                const value = e.target.value.startsWith('0') ? e.target.value.substring(1) : e.target.value;
                // Only allow numbers
                const numericValue = value.replace(/[^0-9]/g, '');
                // Limit to 9 digits
                const limitedValue = numericValue.slice(0, 9);
                updateFormData({ phone: limitedValue });
              }}
              onBlur={(e) => checkPhoneUniqueness(e.target.value)}
              required
              maxLength={9}
            />
          </div>
          <p className="text-xs text-muted-foreground">Sierra Leone country code (+232) is automatically added. Enter 8-9 digits without leading zero.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex space-x-2">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => {
                updateFormData({ email: e.target.value });
                // Reset verification status when email changes
                if (isEmailVerified) {
                  setIsEmailVerified(false);
                  setEmailVerificationSent(false);
                  updateFormData({ emailVerified: false });
                }
              }}
              onBlur={(e) => checkEmailUniqueness(e.target.value)}
              disabled={isEmailVerified}
              required
              className={isEmailVerified ? "border-green-500 bg-green-50" : ""}
            />
            <Button 
              type="button"
              variant={isEmailVerified ? "outline" : "default"}
              onClick={sendVerificationOTP}
              disabled={!formData.email || isCheckingEmail || isSendingOTP || isEmailVerified}
              className="whitespace-nowrap"
            >
              {isSendingOTP ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : isEmailVerified ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verified
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </div>
          {emailVerificationSent && !isEmailVerified && (
            <div className="mt-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="otp"
                  placeholder="Enter code from email"
                  value={otpCode}
                  onChange={handleOtpChange}
                  maxLength={6}
                />
                <Button
                  type="button"
                  onClick={verifyEmailOTP}
                  disabled={!otpCode || isVerifyingOTP}
                  size="sm"
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
              <p className="text-xs text-muted-foreground mt-1">
                Check your email for the verification code. 
                <button
                  type="button"
                  className="text-primary underline ml-1" 
                  onClick={handleResendOTP}
                  disabled={isSendingOTP}
                >
                  Resend code
                </button>
              </p>
            </div>
          )}
          {isEmailVerified && (
            <p className="text-xs text-green-600 mt-1">
              Your email has been verified successfully!
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password for your account"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
      </div>
    </div>
  )
}
