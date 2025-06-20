"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  BasicDetailsForm,
  HealthInfoForm,
  EmergencyContactForm,
  PhotoUploadForm,
  ReviewConfirmForm
} from './components'
import { generateMedicalID } from '@/utils/medical-id'

interface OnboardingFormData {
  fullName: string
  phoneNumber: string
  gender: string
  dateOfBirth: string
  email: string
  bloodGroup: string
  allergies: string[]
  chronicConditions: string[]
  organDonor: boolean
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  photo: string
  medicalId: string
}

// We get a placeholder default value, but actual value will be determined based on priority system
const DEFAULT_FORM_DATA: OnboardingFormData = {
  fullName: '',
  phoneNumber: '',
  gender: '',
  dateOfBirth: '',
  email: '',
  bloodGroup: '',
  allergies: [],
  chronicConditions: [],
  organDonor: false,
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  photo: '',
  medicalId: ''
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>(DEFAULT_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 5
  const progressPercentage = (step / totalSteps) * 100

  // State for patient name and email validation errors
  const [patientName, setPatientName] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  // Function to check if email already exists in the system
  const checkEmailExists = async (email: string) => {
    if (!email) return false
    
    try {
      // Try the auth endpoint first
      const authResponse = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
      
      if (authResponse.ok) {
        const { exists } = await authResponse.json()
        return exists
      }
      
      // If auth endpoint fails, try the patient endpoint as fallback
      const patientResponse = await fetch(`/api/patients/check-email?email=${encodeURIComponent(email)}`)
      
      if (patientResponse.ok) {
        const { exists } = await patientResponse.json()
        return exists
      }
    } catch (error) {
      console.error('Error checking email existence:', error)
    }
    
    return false
  }

  // Load user data on component mount with medical ID persistence
  useEffect(() => {
    // CRITICAL: Check localStorage for existing medical IDs using priority system
    const storedMedicalNumber = localStorage.getItem('medicalNumber')
    const storedPatientId = localStorage.getItem('patientId')
    const storedEmail = localStorage.getItem('userEmail')

    // Priority 1: Use medical number from registration
    if (storedMedicalNumber) {
      console.log('PRIORITY 1: Using medical ID from registration:', storedMedicalNumber)
      setFormData(prev => ({ ...prev, medicalId: storedMedicalNumber }))
    } 
    // Priority 2: Use patient ID from localStorage if no medical number
    else if (storedPatientId) {
      console.log('PRIORITY 2: Using patient ID from localStorage:', storedPatientId)
      setFormData(prev => ({ ...prev, medicalId: storedPatientId }))
    }
    // Priority 3: Only generate as last resort
    else {
      console.log('PRIORITY 3: No existing ID found, generating new medical ID')
      const newMedicalId = generateMedicalID()
      setFormData(prev => ({ ...prev, medicalId: newMedicalId }))
    }

    // Get stored onboarding data if available
    const savedOnboardingData = localStorage.getItem('patientOnboardingData')
    if (savedOnboardingData) {
      try {
        const parsedData = JSON.parse(savedOnboardingData)
        console.log('Found saved onboarding data:', parsedData)

        // Update form data but preserve medical ID priority
        setFormData(prev => ({ 
          ...parsedData,
          // Keep the medical ID from our priority system
          medicalId: prev.medicalId 
        }))
        
        // Update patient name if available
        if (parsedData.fullName) {
          setPatientName(parsedData.fullName)
        }

        // Restore onboarding step if saved
        const savedStep = localStorage.getItem('patientOnboardingStep')
        if (savedStep) {
          const stepNumber = parseInt(savedStep, 10)
          if (!isNaN(stepNumber) && stepNumber >= 1 && stepNumber <= totalSteps) {
            setStep(stepNumber)
            console.log(`Restored to onboarding step ${stepNumber}`)
          }
        }
      } catch (error) {
        console.error('Failed to parse saved onboarding data:', error)
      }
    }

    // Import user email from registration if available
    if (storedEmail) {
      console.log('Using email from registration:', storedEmail)
      setFormData(prev => ({ ...prev, email: storedEmail }))
    }

    // Look for registration data specifically
    const registrationData = localStorage.getItem('registrationData')
    if (registrationData) {
      try {
        const data = JSON.parse(registrationData)
        console.log('Found registration data:', data)

        // Update form with registration data
        if (data.fullName) {
          setPatientName(data.fullName)
          setFormData(prev => ({ ...prev, fullName: data.fullName }))
        }

        if (data.email) {
          setFormData(prev => ({ ...prev, email: data.email }))
        }
      } catch (error) {
        console.error('Error loading registration data:', error)
      }
    }
  }, [totalSteps])

  // Save data whenever it changes
  useEffect(() => {
    // Use consistent naming for localStorage keys
    localStorage.setItem('patientOnboardingData', JSON.stringify(formData))
    localStorage.setItem('patientOnboardingStep', step.toString())
    
    // CRITICAL: Also make sure medical ID is always preserved in both storage keys
    if (formData.medicalId) {
      localStorage.setItem('patientId', formData.medicalId)
      localStorage.setItem('medicalNumber', formData.medicalId)
    }
    
    // Log current medical ID for debugging
    if (formData.medicalId) {
      console.log(`[Step ${step}] Medical ID preserved: ${formData.medicalId}`)
    }
  }, [formData, step])

  const updateFormData = (newData: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Clear any previous errors
    setEmailError(null)
    
    try {
      // Check if email already exists in the system
      if (formData.email) {
        const exists = await checkEmailExists(formData.email)
        if (exists) { 
          setEmailError('This email is already registered in our system. Please use a different email or login with your existing account.')
          setIsSubmitting(false)
          return
        }
      }
      
      // CRITICAL: Get the medical ID with priority system
      // Priority 1: Use medical ID from formData (set during page load)
      // Priority 2: Use medicalNumber from localStorage (from registration)
      // Priority 3: Use patientId from localStorage
      // Priority 4: Generate new as absolute last resort
      const medicalIdToSubmit = formData.medicalId || 
        localStorage.getItem('medicalNumber') || 
        localStorage.getItem('patientId') || 
        generateMedicalID()
      
      console.log('Using medical ID for submission:', medicalIdToSubmit)
      
      // Get name parts for the API
      const nameParts = formData.fullName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
      
      // Improved data structure that matches what the API expects
      const submissionData = {
        // Basic details in format API expects
        basicDetails: {
          firstName,
          lastName,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          email: formData.email,
        },
        healthInfo: {
          bloodGroup: formData.bloodGroup,
          allergies: formData.allergies,
          chronicConditions: formData.chronicConditions,
          organDonor: formData.organDonor,
        },
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
        },
        photo: formData.photo,
        // CRITICAL: Include the medical ID in the submission with higher visibility
        medicalId: medicalIdToSubmit,
        // Include email as a separate field for recovery
        recoveryEmail: formData.email,
      }
      
      console.log('Full submission data:', submissionData)
      
      // Submit the data to the API
      const response = await fetch('/api/patients/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
        credentials: 'include'
      })
      
      // Get full response details for debugging
      const responseData = await response.json()
      
      if (response.ok) {
        console.log('Onboarding submission successful', responseData)
        
        // Store patient email for future use
        localStorage.setItem('userEmail', formData.email)
        
        // Store the medical ID in both localStorage keys for consistency
        localStorage.setItem('patientId', medicalIdToSubmit)
        localStorage.setItem('medicalNumber', medicalIdToSubmit)
        console.log('Storing medical ID consistently in both localStorage keys:', medicalIdToSubmit)
        
        // Clear onboarding localStorage data only on success
        localStorage.removeItem('patientOnboardingData')
        localStorage.removeItem('patientOnboardingStep')
        localStorage.removeItem('patientOnboardingSubmitAttempted')
        localStorage.removeItem('onboardingData') // Clear both old and new keys
        localStorage.removeItem('onboardingStep')
        
        // Redirect to the dashboard
        router.push('/patient/dashboard')
      } else {
        // More detailed error from API if available
        const errorMsg = responseData.error || `Submission failed with status: ${response.status}`
        setEmailError(errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Submission error:', error)
      // Set a user-friendly error message
      setEmailError(error instanceof Error ? error.message : 'Failed to submit onboarding data. Please try again.')
      // The form state is preserved in localStorage so user can try again
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          <BasicDetailsForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <HealthInfoForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 3:
        return (
          <EmergencyContactForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 4:
        return (
          <PhotoUploadForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 5:
        // Only pass props that the component accepts
        return (
          <ReviewConfirmForm
            formData={{
              ...formData,
              // Include submission status in formData to avoid prop type errors
              // This can be extracted in the component as needed
              _submissionStatus: {
                isSubmitting,
                errorMessage: emailError
              }
            }}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {formData.fullName ? `Welcome, ${formData.fullName}!` : 'Patient Onboarding'}
          </CardTitle>
          <CardDescription>
            Complete your profile in {totalSteps} simple steps
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mt-2 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Medical ID: {formData.medicalId}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="p-6 border-b">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
        
        <div className="p-6">
          {renderCurrentStep()}
        </div>
      </Card>
    </div>
  )
}