"use client"

import { useEffect, useState } from 'react'
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
import { useCachedFetch } from '@/lib/use-cached-fetch'
import { generateMedicalID } from '@/utils/medical-id'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [patientName, setPatientName] = useState('')
  // Keep medical ID in the background for later use (health card & welcome email)
  const [medicalId, setMedicalId] = useState('')
  const [formData, setFormData] = useState({
    // Basic Details
    fullName: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    email: '',
    
    // Health Info
    bloodGroup: '',
    allergies: [] as string[],
    chronicConditions: [] as string[],
    organDonor: false,
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    
    // Photo
    photo: '',
    
    // Generated Data
    medicalId: '',
  })
  
  const totalSteps = 5
  const progressPercentage = (step / totalSteps) * 100
  
  // Check if user is authenticated and hasn't completed onboarding
  const { data: patientData, isLoading, error } = useCachedFetch('/api/patients/session/me')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Try to get registration data from localStorage
    const storedData = localStorage.getItem('patientRegistrationData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData.fullName) {
          setPatientName(parsedData.fullName);
        }
        // Store medical ID in the background for later use
        if (parsedData.medicalId) {
          setMedicalId(parsedData.medicalId);
        }
        
        // Pre-fill form data
        setFormData(prev => ({
          ...prev,
          fullName: parsedData.fullName || '',
          phoneNumber: parsedData.phoneNumber || '',
          gender: parsedData.gender || '',
          dateOfBirth: parsedData.dateOfBirth || '',
          email: parsedData.email || '',
          medicalId: parsedData.medicalId || ''
        }));
      } catch (e) {
        console.error('Error parsing stored patient data:', e);
      }
    }
    
    // Set a short timeout to prevent long loading state
    const authCheckTimeout = setTimeout(() => {
      setAuthChecked(true)
    }, 500) // 500ms should be enough to check auth state
    
    // NEW APPROACH: For onboarding, we allow session-less completion
    // Only redirect if not authenticated and no stored onboarding data
    const hasOnboardingData = localStorage.getItem('patientOnboardingData');
    
    if (!isLoading && (!patientData || !patientData.authenticated) && !hasOnboardingData) {
      console.log('Onboarding: Not authenticated and no stored data, redirecting to login')
      router.push('/')
      return
    }
    
    // Only redirect to dashboard if properly authenticated AND onboarding is completed
    if (!isLoading && patientData && patientData.authenticated && patientData.onboardingCompleted) {
      console.log('Onboarding: Authenticated and onboarding already completed, redirecting to dashboard')
      router.push('/patient/dashboard')
      return
    }
    
    // Pre-fill data if available from the API
    if (!isLoading && patientData) {
      console.log('Onboarding: Pre-filling data from patient profile')
      setFormData(prev => ({
        ...prev,
        fullName: typeof patientData.name === 'string' 
          ? patientData.name 
          : patientData.name?.[0]?.text || prev.fullName || '',
        phoneNumber: patientData.phoneNumber || prev.phoneNumber || '',
        gender: patientData.gender || prev.gender || '',
        dateOfBirth: patientData.birthDate || prev.dateOfBirth || '',
        email: patientData.email || prev.email || '',
        medicalId: patientData.medicalId || prev.medicalId || medicalId
      }))
      
      if (!patientName && typeof patientData.name === 'string') {
        setPatientName(patientData.name);
      }
      
      // Store medical ID in the background for later use
      if (!medicalId && patientData.medicalId) {
        setMedicalId(patientData.medicalId);
      }
      
      setAuthChecked(true)
    }
    
    return () => clearTimeout(authCheckTimeout)
  }, [isLoading, patientData, router, patientName, medicalId])
  
  const updateFormData = (stepData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
    // Save to localStorage for persistence
    localStorage.setItem('patientOnboardingData', JSON.stringify({
      ...formData,
      ...stepData
    }))
  }
  
  const handleChange = (fieldName: string, value: any) => {
    const updatedFormData = { ...formData, [fieldName]: value }
    setFormData(updatedFormData)
    
    // Save updated form data to localStorage for persistence
    try {
      localStorage.setItem('patientOnboardingData', JSON.stringify(updatedFormData))
    } catch (error) {
      console.error('Failed to save onboarding progress to localStorage:', error)
    }
  }
  
  // Load from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('patientOnboardingData')
    const savedStep = localStorage.getItem('patientOnboardingStep')
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData)
        
        // Restore medical ID if it exists in the saved data
        if (parsedData.medicalId) {
          setMedicalId(parsedData.medicalId)
        } else {
          // Generate a new one if not found
          const id = generateMedicalID()
          setMedicalId(id)
          setFormData(prev => ({ ...prev, medicalId: id }))
        }
        
        // Set patient name if it exists
        if (parsedData.fullName) {
          setPatientName(parsedData.fullName)
        }
        
        // Restore previous step if saved
        if (savedStep) {
          const stepNumber = parseInt(savedStep, 10)
          if (!isNaN(stepNumber) && stepNumber >= 1 && stepNumber <= totalSteps) {
            setStep(stepNumber)
            console.log(`Restored to onboarding step ${stepNumber}`)
          }
        }
        
        console.log('Restored onboarding progress from localStorage')
      } catch (error) {
        console.error('Failed to parse saved onboarding data:', error)
        // Generate a new medical ID as fallback
        const id = generateMedicalID()
        setMedicalId(id)
        setFormData(prev => ({ ...prev, medicalId: id }))
      }
    } else {
      // No saved data, generate new medical ID
      const id = generateMedicalID()
      setMedicalId(id)
      setFormData(prev => ({ ...prev, medicalId: id }))
    }
  }, [totalSteps])
  
  const handleNext = () => {
    if (step < totalSteps) {
      // Save current progress before moving to next step
      try {
        localStorage.setItem('patientOnboardingData', JSON.stringify(formData))
        localStorage.setItem('patientOnboardingStep', step.toString())
        console.log('Saved onboarding progress at step', step)
      } catch (error) {
        console.error('Failed to save onboarding progress:', error)
      }
      
      setStep(prev => prev + 1)
    }
  }
  
  const handlePrevious = () => {
    if (step > 1) {
      // Save current progress before going back
      try {
        localStorage.setItem('patientOnboardingData', JSON.stringify(formData))
        localStorage.setItem('patientOnboardingStep', (step - 1).toString())
      } catch (error) {
        console.error('Failed to save onboarding progress:', error)
      }
      
      setStep(prev => prev - 1)
    }
  }
  
  const handleSubmit = async () => {
    // Generate a 5-character alphanumeric medical ID if not already generated
    if (!formData.medicalId) {
      const generatedId = generateMedicalID()
      setFormData(prev => ({ ...prev, medicalId: generatedId }))
      setMedicalId(generatedId)
    }

    try {
      // First save the complete state to localStorage before submission
      // This ensures we have the latest data if the submission fails
      localStorage.setItem('patientOnboardingData', JSON.stringify(formData))
      localStorage.setItem('patientOnboardingSubmitAttempted', 'true')
      
      // Structure the data as expected by the API endpoint
      const structuredData = {
        basicDetails: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          email: formData.email,
        },
        healthInfo: {
          bloodGroup: formData.bloodGroup || 'Unknown',
          allergies: formData.allergies || [],
          chronicConditions: formData.chronicConditions || [],
          organDonor: formData.organDonor || false
        },
        emergencyContact: {
          name: formData.emergencyContactName || '',
          relationship: formData.emergencyContactRelationship || '',
          phone: formData.emergencyContactPhone || ''
        },
        photo: formData.photo || '',
        medicalId: formData.medicalId,
        // Add recovery email to help with session expiration
        recoveryEmail: formData.email
      }
      
      // Add debug info
      console.log('Submitting onboarding data:', {
        medicalId: formData.medicalId,
        email: formData.email,
      })
      
      // Save all data to the server
      const response = await fetch('/api/patients/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(structuredData),
        credentials: 'include', // Include cookies for authentication
      })
      
      // Always try to get the response JSON for better error handling
      const responseData = await response.json().catch(e => ({
        error: 'Failed to parse response JSON'
      }))
      
      if (!response.ok) {
        console.error('Server error response:', responseData)
        
        // Special handling for session expiration
        if (response.status === 401) {
          // Don't redirect to login - instead try to complete with recovery data
          console.log('Session expired but continuing with onboarding completion using recovery data')
          
          // Make sure we have the recovery email and medical ID
          if (!structuredData.recoveryEmail || !structuredData.medicalId) {
            console.error('Missing recovery data for session-less submission')
            // Silently redirect to login instead of showing alert
            router.push('/login?returnTo=/onboarding&preserveData=true')
            return
          }
          
          // Silently attempt recovery without interrupting user experience
          console.log('Silent recovery attempt with email:', structuredData.recoveryEmail, 'and medicalId:', structuredData.medicalId);
          
          try {
            // Add a special flag to indicate this is a recovery attempt
            // Use type assertion to add the property
            (structuredData as any).isRecoveryAttempt = true
            
            // Try submitting again with the recovery flag
            const recoveryResponse = await fetch('/api/patients/onboarding/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(structuredData),
              credentials: 'include', // Include cookies for authentication
            })
            
            const recoveryData = await recoveryResponse.json().catch(e => ({
              error: 'Failed to parse recovery response JSON'
            }))
            
            if (!recoveryResponse.ok) {
              console.error('Recovery attempt failed:', recoveryData)
              // Silently handle recovery failure
              router.push('/login?returnTo=/onboarding&preserveData=true&recovery=failed')
              return
            }
            
            console.log('Onboarding completed successfully via recovery:', recoveryData)
            
            // Clear localStorage data on success
            localStorage.removeItem('patientOnboardingData')
            localStorage.removeItem('patientOnboardingStep')
            localStorage.removeItem('patientOnboardingSubmitAttempted')
            
            // Redirect to the dashboard
            router.push('/patient/dashboard')
            return
          } catch (recoveryError: any) {
            console.error('Recovery submission failed:', recoveryError)
            alert(`Error during recovery: ${recoveryError.message || 'Failed to complete onboarding with recovery. Please try again.'}`)
            return
          }
        }
        
        throw new Error(responseData.error || `Server error: ${response.status}`)
      }
      
      console.log('Onboarding completed successfully:', responseData)
      
      // Clear localStorage data only on success
      localStorage.removeItem('patientOnboardingData')
      localStorage.removeItem('patientOnboardingStep')
      localStorage.removeItem('patientOnboardingSubmitAttempted')
      
      // Redirect to the dashboard
      router.push('/patient/dashboard')
    } catch (error: any) {
      // Log error but don't show alert
      console.error('Error completing onboarding:', error)
      // Save data and redirect to login with error parameter
      router.push('/login?returnTo=/onboarding&preserveData=true&error=submission')
    }
  }
  
  // Prevent closing or refreshing the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
  
  // Show a loading spinner for a very short time if necessary
  if (isLoading && !authChecked) {
    return (
      <div className="container max-w-4xl py-12">
        <h2 className="text-xl font-bold">Welcome!</h2>
        <p className="text-muted-foreground text-center mb-8">
          Getting everything ready for you...
        </p>
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container max-w-screen-lg mx-auto py-6 md:py-10">
      <Card className="mb-6 shadow-md bg-gradient-to-r from-blue-50 to-green-50 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-blue-800">Hello, {patientName || 'Patient'}!</CardTitle>
          <CardDescription className="text-blue-700">Complete your onboarding process to get started with Central Health</CardDescription>
        </CardHeader>
        {medicalId && (
          <CardContent className="pt-0">
            <div className="mt-2 p-3 bg-white rounded-md border border-green-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-500">Your assigned Medical ID:</p>
                <p className="text-lg font-mono font-bold tracking-wider text-blue-700">{medicalId}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>Please keep this ID secure. You'll need it for all your hospital visits.</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      <Card className="shadow-lg">
        {/* Progress bar */}
        <div className="p-6 border-b">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
        
        {/* Form content */}
        <div className="p-6">
          {step === 1 && (
            <BasicDetailsForm 
              formData={formData} 
              updateFormData={updateFormData} 
              onNext={handleNext} 
            />
          )}
          
          {step === 2 && (
            <HealthInfoForm 
              formData={formData} 
              updateFormData={updateFormData} 
              onNext={handleNext} 
              onPrevious={handlePrevious} 
            />
          )}
          
          {step === 3 && (
            <EmergencyContactForm 
              formData={formData} 
              updateFormData={updateFormData} 
              onNext={handleNext} 
              onPrevious={handlePrevious} 
            />
          )}
          
          {step === 4 && (
            <PhotoUploadForm 
              formData={formData} 
              updateFormData={updateFormData} 
              onNext={handleNext} 
              onPrevious={handlePrevious} 
            />
          )}
          
          {step === 5 && (
            <ReviewConfirmForm 
              formData={formData} 
              onSubmit={handleSubmit} 
              onPrevious={handlePrevious} 
            />
          )}
        </div>
      </Card>
      
      {/* Info text */}
      <div className="text-center text-sm text-muted-foreground mt-6">
        <p>All information is securely stored and protected by hospital privacy policies.</p>
        <p>You cannot skip this onboarding process. It ensures your profile is complete and ready for medical services.</p>
      </div>
    </div>
  )
}
