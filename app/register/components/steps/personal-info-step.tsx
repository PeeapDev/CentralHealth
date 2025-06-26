"use client"

import { useState, useRef, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PatientFormData } from "../clean-form"
import { CalendarIcon, AlertCircle, Loader2, CheckCircle, Camera, Upload, X, RefreshCcw } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  
  // Profile picture state
  const [photoPreview, setPhotoPreview] = useState<string>(formData.profilePicture || "")
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
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
  
  // Start camera for photo capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };
  
  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };
  
  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Set canvas dimensions to match the video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const photoData = canvas.toDataURL('image/jpeg');
      setPhotoPreview(photoData);
      updateFormData({ profilePicture: photoData });
      
      // Stop camera stream
      stopCamera();
      
      toast.success('Photo captured successfully');
    }
  };
  
  // Handle file upload for profile picture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        updateFormData({ profilePicture: result });
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Please provide accurate personal information. Your unique medical number will be generated after registration.
        </AlertDescription>
      </Alert>

      {/* Profile Picture */}
      <div className="flex flex-col items-center space-y-2 mb-4">
        <Label htmlFor="photo" className="text-center mb-2">Profile Picture</Label>
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-primary/50 bg-muted">
          {photoPreview ? (
            <img 
              src={photoPreview} 
              alt="Profile preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground">
              <p className="text-xs text-center">No photo</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={photoPreview ? () => {
              setPhotoPreview("");
              updateFormData({ profilePicture: "" });
            } : () => document.getElementById('photo-upload')?.click()}
          >
            {photoPreview ? (
              <>
                <X className="h-4 w-4 mr-1" />
                <span>Remove</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                <span>Upload</span>
              </>
            )}
          </Button>
          
          {!photoPreview && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-1" />
                  <span>Take Photo</span>
                </>
              )}
            </Button>
          )}
          
          {cameraActive && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={capturePhoto}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Capture</span>
            </Button>
          )}
        </div>

        <input
          type="file"
          id="photo-upload"
          className="hidden"
          accept="image/*"
          onChange={handlePhotoUpload}
        />
      </div>
      
      {/* Camera Dialog */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Take Profile Photo</h3>
              <Button variant="ghost" size="icon" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative aspect-square w-full bg-black rounded overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={stopCamera}>Cancel</Button>
              <Button onClick={capturePhoto}>Take Photo</Button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
      
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
          <Label htmlFor="gender">Gender/Sex <span className="text-red-500">*</span></Label>
          <Select 
            value={formData.gender && formData.gender !== "" ? formData.gender : undefined} 
            onValueChange={(value) => updateFormData({ gender: value })}
          >
            <SelectTrigger id="gender" className={formData.gender ? "" : "text-muted-foreground"}>
              <SelectValue placeholder="-- Select gender --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {(!formData.gender || formData.gender === "") && 
            <p className="text-xs text-red-500 mt-1">Please select your gender</p>
          }
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
