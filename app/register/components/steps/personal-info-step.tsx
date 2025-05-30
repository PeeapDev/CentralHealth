"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { PatientFormData } from "../multi-step-form"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
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
    if (!phone || phone.length < 9) return
    
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
            <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-muted-foreground">
              +232
            </span>
            <Input
              id="phone"
              className="rounded-l-none"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              onBlur={(e) => checkPhoneUniqueness(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">Sierra Leone country code (+232) is automatically added</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            onBlur={(e) => checkEmailUniqueness(e.target.value)}
            required
          />
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
