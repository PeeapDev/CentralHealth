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
import { generateMedicalID, generateHospitalMedicalID } from '@/utils/medical-id'

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [medicalId, setMedicalId] = useState('');
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
  });
  
  const totalSteps = 5;
  const progressPercentage = (step / totalSteps) * 100;
  
  // Define a type for patient data
  type PatientSessionData = {
    authenticated: boolean;
    onboardingCompleted: boolean;
    patient: {
      name?: string;
      phone?: string;
      gender?: string;
      dob?: string;
      email?: string;
      patientId?: string;
    };
  };
  
  const [patientData, setPatientData] = useState<PatientSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Function to check if email already exists in the system
  const checkEmailExists = async (email: string) => {
    if (!email) return false;
    
    try {
      // Try the auth endpoint first
      const authResponse = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      
      if (authResponse.ok) {
        const { exists } = await authResponse.json();
        return exists;
      }
      
      // If auth endpoint fails, try the patient endpoint as fallback
      const patientResponse = await fetch(`/api/patients/check-email?email=${encodeURIComponent(email)}`);
      
      if (patientResponse.ok) {
        const { exists } = await patientResponse.json();
        return exists;
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
    }
    
    // Default to false if both checks fail
    return false;
  };

  // Load user data from localStorage and API
  const loadUserData = async () => {
    setIsLoading(true);
    
    try {
      // Use consistent localStorage keys that match what the dashboard uses
      const storedEmail = localStorage.getItem('userEmail');
      const storedPatientId = localStorage.getItem('patientId');
      
      // If there's no patient reference in localStorage, no need to load
      if (!storedEmail && !storedPatientId) {
        console.error('No patient email or ID found in storage');
        setError('Please register or sign in first before continuing with onboarding.');
        return;
      }
      
      console.log('Found stored patient data:', { email: storedEmail, patientId: storedPatientId });
      
      // Fetch patient data from API using email or patientId
      const url = new URL('/api/patients/profile', window.location.origin);
      let response;
      
      if (storedEmail) {
        url.searchParams.append('email', storedEmail);
        response = await fetch(url.toString(), {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else if (storedPatientId) {
        url.searchParams.append('patientId', storedPatientId);
        response = await fetch(url.toString(), {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (response?.ok) {
        const data = await response.json();
        setPatientData({
          authenticated: true,
          onboardingCompleted: data.onboardingCompleted || false,
          patient: data
        });
        
        // Pre-populate form with existing data
        setFormData(prev => ({
          ...prev,
          fullName: data.name || '',
          email: data.email || storedEmail || '',
          phoneNumber: data.phone || '',
          gender: data.gender || '',
          dateOfBirth: data.dob || '',
          medicalId: data.patientId || ''
        }));
        
        if (data.name) {
          setPatientName(data.name);
        }
        
        if (data.patientId) {
          setMedicalId(data.patientId);
          
          // Ensure we're storing the patientId in localStorage with the correct key for dashboard
          localStorage.setItem('patientId', data.patientId);
        }
        
        // If we have an email, store it with the key that dashboard expects
        if (data.email) {
          localStorage.setItem('userEmail', data.email);
        } else if (storedEmail) {
          localStorage.setItem('userEmail', storedEmail);
        }
      } else {
        console.log('Patient profile not found, continuing with registration data only');
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
    }
  };
  
  // Load registration data from localStorage
  const loadRegistrationData = () => {
    const storedData = localStorage.getItem('patientRegistrationData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData.fullName) {
          setPatientName(parsedData.fullName);
        }
        
        if (parsedData.medicalId) {
          setMedicalId(parsedData.medicalId);
        }
        
        // Pre-fill form data
        setFormData(prev => ({
          ...prev,
          fullName: parsedData.fullName || prev.fullName,
          phoneNumber: parsedData.phoneNumber || prev.phoneNumber,
          gender: parsedData.gender || prev.gender,
          dateOfBirth: parsedData.dateOfBirth || prev.dateOfBirth,
          email: parsedData.email || prev.email,
          medicalId: parsedData.medicalId || prev.medicalId
        }));
      } catch (e) {
        console.error('Error parsing stored patient data:', e);
      }
    }
  };

  // Initial data loading
  useEffect(() => {
    // Check if user is already onboarded
    const onboarded = localStorage.getItem('patientOnboardingComplete') === 'true';
    if (onboarded) {
      router.push('/patient/dashboard');
      return;
    }
    
    // Load from localStorage on initial render
    const savedData = localStorage.getItem('patientOnboardingData')
    const savedStep = localStorage.getItem('patientOnboardingStep')
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData)
        
        // Restore medical ID if it exists in the saved data
        if (parsedData.medicalId) {
          setMedicalId(parsedData.medicalId)
          // Make sure we store it consistently for dashboard
          localStorage.setItem('patientId', parsedData.medicalId)
        } else {
          // Generate a new one if not found
          const id = generateHospitalMedicalID()
          setMedicalId(id)
          setFormData(prev => ({ ...prev, medicalId: id }))
          localStorage.setItem('patientId', id)
        }
        
        // Set patient name if it exists
        if (parsedData.fullName) {
          setPatientName(parsedData.fullName)
        }
        
        // Store email in userEmail for dashboard consistency
        if (parsedData.email) {
          localStorage.setItem('userEmail', parsedData.email)
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
        const id = generateHospitalMedicalID()
        setMedicalId(id)
        setFormData(prev => ({ ...prev, medicalId: id }))
        localStorage.setItem('patientId', id)
      }
    } else {
      // No saved data, generate new medical ID
      const id = generateHospitalMedicalID()
      setMedicalId(id)
      setFormData(prev => ({ ...prev, medicalId: id }))
      localStorage.setItem('patientId', id)
    
      if (savedStep) {
        const stepNumber = parseInt(savedStep, 10)
        if (!isNaN(stepNumber) && stepNumber >= 1 && stepNumber <= totalSteps) {
          setStep(stepNumber)
          console.log(`Restored to onboarding step ${stepNumber}`)
        }
      }
    }
    
    // Load user and registration data
    const loadData = async () => {
      try {
        await loadUserData();
        loadRegistrationData();
      } catch (error) {
        console.error('Error in initial data loading:', error);
        setIsLoading(false);
        setAuthChecked(true);
      }
    };
    
    loadData();
  }, []);

  // Check onboarding status and redirect if needed
  useEffect(() => {
    if (!isLoading && authChecked) {
      // If patient data exists and onboarding is already completed, redirect to dashboard
      if (patientData?.onboardingCompleted) {
        router.push('/patient/profile');
      } else if (!patientData && !formData.email && !formData.fullName) {
        // No patient data and no form data, redirect to registration
        router.push('/register');
      }
    }
  }, [isLoading, authChecked, patientData, formData.email, formData.fullName, router]);

  // Email validation effect
  useEffect(() => {
    if (!formData.email) {
      setEmailError(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setEmailError('Please enter a valid email address');
          return;
        }
        
        const exists = await checkEmailExists(formData.email);
        
        if (exists) {
          setEmailError('Email already registered');
        } else {
          setEmailError(null);
        }
      } catch (err) {
        console.error('Email validation error:', err);
        setEmailError(null);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [formData.email]);

  // Handle authentication and redirection
  useEffect(() => {
    if (!isLoading && authChecked) {
      // Check for onboarding data in localStorage
      const hasOnboardingData = localStorage.getItem('patientOnboardingData');
      const hasRegistrationData = localStorage.getItem('patientRegistrationData');
      
      // Only redirect to login if:
      // 1. There's no authenticated session AND
      // 2. There's no onboarding data AND
      // 3. There's no registration data
      if ((!patientData || !patientData?.authenticated) && 
          !hasOnboardingData && 
          !hasRegistrationData) {
        console.log('Onboarding: No authentication, no onboarding data, no registration data. Redirecting to login');
        router.push('/');
        return;
      }
      
      // Only redirect to dashboard if properly authenticated AND onboarding is completed
      if (patientData && patientData.authenticated && patientData.onboardingCompleted) {
        console.log('Onboarding: Authenticated and onboarding already completed, redirecting to dashboard');
        router.push('/patient/dashboard');
        return;
      }
      
      // In all other cases, allow the onboarding process to continue
      console.log('Continuing with onboarding process...');
    }
  }, [isLoading, authChecked]);

  // Save data on every step change for persistence
  useEffect(() => {
    if (formData) {
      try {
        localStorage.setItem('patientOnboardingData', JSON.stringify(formData))
        localStorage.setItem('patientOnboardingStep', step.toString())
      } catch (error) {
        console.error('Error saving onboarding data to localStorage:', error)
      }
    }
  }, [step, formData])

  const updateFormData = (stepData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
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

  // Handle submission of the complete onboarding form
  const handleSubmit = async () => {
    // Clear any previous errors
    setEmailError(null);
    
    // Check if email already exists in the system
    if (formData.email) {
      const exists = await checkEmailExists(formData.email);
      if (exists) { 
        setEmailError('This email is already registered in our system. Please use a different email or login with your existing account.');
        return; 
      }
    }
    
    // Generate a 5-character alphanumeric medical ID if not already generated
    if (!formData.medicalId) {
      const generatedId = generateHospitalMedicalID()
      setFormData(prev => ({ ...prev, medicalId: generatedId }))
      setMedicalId(generatedId)
    }

    try {
      // First save the complete state to localStorage before submission
      // This ensures we have the latest data if the submission fails
      localStorage.setItem('patientOnboardingData', JSON.stringify(formData))
      localStorage.setItem('patientOnboardingSubmitAttempted', 'true')
      
      // Structure the data for the backend
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
        credentials: 'include' // Include cookies for authentication
      })
      
      // Attempt to parse the response as JSON (might fail for non-JSON responses)
      let responseData: any = {};
      let responseText = '';
      try {
        // First try to get response text
        responseText = await response.text();
        
        // Then try to parse as JSON if it looks like JSON
        if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
          responseData = JSON.parse(responseText);
        }
      } catch (parseError) {
        // If parsing fails, log error and continue with what we have
        console.error('Error parsing response:', parseError);
      }
      
      // If successful response
      if (response.ok) {
        console.log('Onboarding completed successfully:', responseData)
        
        // Store patient email and ID in localStorage with the correct keys for dashboard
        localStorage.setItem('userEmail', formData.email);
        if (formData.medicalId) {
          localStorage.setItem('patientId', formData.medicalId);
        }
        
        // Clear onboarding localStorage data only on success
        localStorage.removeItem('patientOnboardingData')
        localStorage.removeItem('patientOnboardingStep')
        localStorage.removeItem('patientOnboardingSubmitAttempted')
        localStorage.removeItem('patientOnboardingStepStructure')
        
        // Redirect to the dashboard
        router.push('/patient/dashboard')
        return
      }
      
      // Handle error response
      const errorMessage = responseData?.error || responseText || `HTTP ${response.status}`;
      console.error(`Server error response (${response.status}):`, errorMessage);
      
      // Special handling for session expiration
      if (response.status === 401) {
        console.warn('Session expired, attempting recovery submission')

        try {
          // Make sure we have the recovery email and medical ID
          if (!structuredData.recoveryEmail || !structuredData.medicalId) {
            console.error('Missing recovery data for session-less submission');
            // Redirect to login instead of showing alert
            router.push('/login?returnTo=/onboarding&preserveData=true');
            return;
          }
          
          // Silently attempt recovery without interrupting user experience
          console.log('Silent recovery attempt with email:', structuredData.recoveryEmail, 'and medicalId:', structuredData.medicalId);
          
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
          
          let recoveryData;
          try {
            recoveryData = await recoveryResponse.json();
          } catch (e) {
            recoveryData = { error: 'Failed to parse recovery response JSON' };
          }
          
          if (!recoveryResponse.ok) {
            console.error('Recovery attempt failed:', recoveryData || {})
            // Silently handle recovery failure
            router.push('/login?returnTo=/onboarding&preserveData=true&recovery=failed')
            return
          }
          
          console.log('Onboarding completed successfully via recovery:', recoveryData)
          
          // Store patient email and ID in localStorage with the correct keys for dashboard
          localStorage.setItem('userEmail', structuredData.recoveryEmail);
          if (structuredData.medicalId) {
            localStorage.setItem('patientId', structuredData.medicalId);
          }
          
          // Clear localStorage data on success
          localStorage.removeItem('patientOnboardingData')
          localStorage.removeItem('patientOnboardingStep')
          localStorage.removeItem('patientOnboardingSubmitAttempted')
          localStorage.removeItem('patientOnboardingStepStructure')
          
          // Redirect to the dashboard
          router.push('/patient/dashboard')
          return
        } catch (recoveryError: any) {
          console.error('Recovery submission failed:', recoveryError)
          // Don't show an alert, just redirect with error
          router.push('/login?returnTo=/onboarding&preserveData=true&error=recovery')
          return
        }
      }
      
      // Other error handling for non-401 errors
      // Save data and redirect to login with error parameter
      router.push(`/login?returnTo=/onboarding&preserveData=true&error=${response.status}`)
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

  // Show a loading spinner while authentication and data is being checked
  return isLoading ? (
    <div className="container max-w-4xl py-12">
      <h2 className="text-xl font-bold">Welcome!</h2>
      <p className="text-muted-foreground text-center mb-8">
        Getting everything ready for you...
      </p>
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  ) : (
  <div className="container max-w-4xl py-12">
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-800">Hello, {patientName || 'Patient'}!</CardTitle>
        <CardDescription className="text-blue-700">Complete your onboarding process to get started with Central Health</CardDescription>
        
        {/* Email validation error message */}
        {emailError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{emailError}</p>
          </div>
        )}
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
            emailError={emailError}
            updateFormData={updateFormData}
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
  );
}
