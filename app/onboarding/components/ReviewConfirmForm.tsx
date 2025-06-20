"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, BadgeCheck, ClipboardCopy, Edit2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReviewConfirmFormProps {
  formData: any
  onSubmit: () => void
  onPrevious: () => void
  emailError?: string | null
  updateFormData?: (data: any) => void
}

export default function ReviewConfirmForm({ formData, onSubmit, onPrevious, emailError, updateFormData }: ReviewConfirmFormProps) {  
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [medicalId, setMedicalId] = useState(formData.medicalId || '')
  const [generatingIds, setGeneratingIds] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [email, setEmail] = useState(formData.email || '')

  // Generate medical ID and QR code when component mounts
  useEffect(() => {
    if (!medicalId) {
      generateIdentifiers()
    }
  }, [])

  const generateIdentifiers = () => {
    setGeneratingIds(true)
    
    // Generate a 5-character alphanumeric medical ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    
    setMedicalId(result)
    setTimeout(() => setGeneratingIds(false), 1000)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(medicalId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle email editing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const saveEmail = () => {
    if (email && updateFormData) {
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return; // Don't save invalid emails
      }
      
      updateFormData({ ...formData, email })
      setIsEditingEmail(false)
    }
  }

  // QR code content
  const qrCodeValue = `https://platform.com/patient/${medicalId}`

  // Function to format date (YYYY-MM-DD to readable format)
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Review & Confirm</h2>
        <p className="text-muted-foreground">
          Review your information and confirm to complete registration
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Patient details column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium">{formData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-medium">{formData.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-medium">{formData.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-medium">{formatDate(formData.dateOfBirth)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email:</span>
                {isEditingEmail ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1 items-center">
                      <Input 
                        value={email} 
                        onChange={handleEmailChange} 
                        className="w-48 h-8 text-sm" 
                        type="email"
                        placeholder="Enter your email"
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-0 w-8 h-8" 
                        onClick={saveEmail}
                        title="Save email"
                      >
                        <Save size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-0 w-8 h-8" 
                        onClick={() => {
                          setEmail(formData.email || '')
                          setIsEditingEmail(false)
                        }}
                        title="Cancel"
                      >
                        <span className="text-xs">✕</span>
                      </Button>
                    </div>
                    {emailError && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle size={12} />
                        <span>{emailError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{formData.email || 'Not provided'}</span>
                    {updateFormData && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-0 w-6 h-6 ml-1" 
                        onClick={() => setIsEditingEmail(true)}
                        title="Edit email"
                      >
                        <Edit2 size={12} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Health Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blood Group:</span>
                <span className="font-medium">{formData.bloodGroup}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Allergies:</span>
                <div className="mt-1">
                  {formData.allergies && formData.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.allergies.map((allergy: string, index: number) => (
                        <span key={index} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">None reported</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Chronic Conditions:</span>
                <div className="mt-1">
                  {formData.chronicConditions && formData.chronicConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.chronicConditions.map((condition: string, index: number) => (
                        <span key={index} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">None reported</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organ Donor:</span>
                <span className="font-medium">{formData.organDonor ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{formData.emergencyContactName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relationship:</span>
                <span className="font-medium">{formData.emergencyContactRelationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-medium">{formData.emergencyContactPhone}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ID card and QR code column */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-primary text-primary-foreground p-4">
              <h3 className="text-lg font-bold">Patient Medical ID Card</h3>
            </div>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center space-y-4 p-2">
                {formData.photo ? (
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={formData.photo} alt="Patient" />
                    <AvatarFallback>
                      {formData.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {formData.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="text-center">
                  <h4 className="font-bold text-lg">{formData.fullName}</h4>
                  <p className="text-sm text-muted-foreground">Blood Group: {formData.bloodGroup}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Medical ID</p>
                    <div className="flex items-center space-x-1">
                      {generatingIds ? (
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <>
                          <p className="font-mono font-bold text-lg">{medicalId}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={copyToClipboard}
                          >
                            {copied ? (
                              <BadgeCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <ClipboardCopy className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  {generatingIds ? (
                    <div className="h-32 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <QRCodeSVG 
                      value={qrCodeValue} 
                      size={128}
                      level="H"
                      includeMargin
                    />
                  )}
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Scan for patient information
                  </p>
                </div>
                
                <div className="border-t border-gray-200 w-full pt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    This card is the property of Central Health System
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex space-x-2">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-yellow-800">Important Information</p>
                <p className="text-xs text-yellow-700">
                  By completing this onboarding process, you'll be issued your unique Medical ID and 
                  QR code that can be used by healthcare providers to access your information in emergencies.
                </p>
                <p className="text-xs text-yellow-700 font-medium mt-2">
                  This profile will be linked to your hospital account and used for all medical services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPrevious}
          disabled={isSubmitting}
        >
          Previous
        </Button>

        <Button 
          type="button" 
          onClick={async () => {
            setIsSubmitting(true);
            setSubmitError(null);
            
            try {
              // CRITICAL: Get the medical ID with priority system
              // Priority 1: Use the medicalId from the form state
              // Priority 2: Use medicalNumber from localStorage (from registration)
              // Priority 3: Use patientId from localStorage
              // Priority 4: Use the local component state medicalId
              const medicalIdToSubmit = formData.medicalId || 
                (typeof window !== 'undefined' ? localStorage.getItem('medicalNumber') : null) || 
                (typeof window !== 'undefined' ? localStorage.getItem('patientId') : null) || 
                medicalId;
              
              // Get stored values for recovery
              const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
              const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('patientToken') : null;
              
              // Get name parts for API
              const nameParts = formData.fullName?.split(' ') || [];
              const firstName = nameParts[0] || '';
              const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
              
              // Prepare submission data in the format expected by the API
              const submissionData = {
                // Basic details
                basicDetails: {
                  firstName,
                  lastName,
                  fullName: formData.fullName,
                  phoneNumber: formData.phoneNumber,
                  gender: formData.gender,
                  dateOfBirth: formData.dateOfBirth,
                  email: formData.email || storedEmail,
                },
                // Health info
                healthInfo: {
                  bloodGroup: formData.bloodGroup,
                  allergies: formData.allergies || [],
                  chronicConditions: formData.chronicConditions || [],
                  organDonor: formData.organDonor || false,
                },
                // Emergency contact
                emergencyContact: {
                  name: formData.emergencyContactName,
                  relationship: formData.emergencyContactRelationship,
                  phone: formData.emergencyContactPhone,
                },
                // Photo
                photo: formData.photo || '',
                
                // AUTHENTICATION FIELDS - CRITICAL FOR API
                // Flag this as an explicit recovery attempt
                isRecoveryAttempt: true,
                // Include patient ID if available from localStorage
                patientId: typeof window !== 'undefined' ? localStorage.getItem('patientId') : null,
                // CRITICAL: Medical ID - use the same one throughout the patient journey
                medicalId: medicalIdToSubmit,
                medicalNumber: medicalIdToSubmit,  // Include as both for compatibility
                // Include email as a separate field for recovery - CRITICAL
                recoveryEmail: formData.email || storedEmail,
                // Include any extension data
                extensionData: {
                  onboardingCompleted: true,
                  registrationDate: new Date().toISOString(),
                  medicalId: medicalIdToSubmit
                }
              };
              
              console.log('Starting onboarding submission flow with data:', {
                medicalId: submissionData.medicalId,
                email: submissionData.basicDetails.email
              });
              
              // CRITICAL FIX: First create a server-side patient session before submitting onboarding data
              console.log('Creating server-side patient session first...');
              const sessionResponse = await fetch('/api/patients/create-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: submissionData.basicDetails.email || submissionData.recoveryEmail,
                  medicalId: submissionData.medicalId
                }),
                credentials: 'include' // Include cookies for authentication
              });
              
              const sessionResult = await sessionResponse.json();
              
              if (!sessionResponse.ok) {
                throw new Error(sessionResult.error || 'Failed to create patient session');
              }
              
              console.log('Session created successfully, proceeding with onboarding submission');
              
              // Now submit the onboarding data to the correct endpoint
              const response = await fetch('/api/patients/onboarding/complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  // Include auth token if available to help with authentication
                  ...(storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {})
                },
                body: JSON.stringify(submissionData),
                credentials: 'include' // Include cookies for authentication
              });
              
              // Get response data for better error handling
              const responseData = await response.json();
              
              if (!response.ok) {
                throw new Error(responseData.error || 'Failed to complete onboarding');
              }
              
              console.log('Onboarding completed successfully:', responseData);
              
              // Store critical data in localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('onboardingCompleted', 'true');
                localStorage.setItem('userEmail', submissionData.basicDetails.email);
                
                // CRITICAL: Store the medical ID in both localStorage keys for consistency
                if (medicalIdToSubmit) {
                  localStorage.setItem('patientId', medicalIdToSubmit);
                  localStorage.setItem('medicalNumber', medicalIdToSubmit);
                  console.log('Storing medical ID consistently in both localStorage keys:', medicalIdToSubmit);
                }
                
                // IMPORTANT: Save the profile photo to localStorage so it appears in the dashboard
                if (formData.photo) {
                  console.log('Saving profile photo to localStorage');
                  localStorage.setItem('patientProfilePhoto', formData.photo);
                  // Also save to legacy keys for backward compatibility
                  localStorage.setItem('photo', formData.photo);
                  localStorage.setItem('userPhoto', formData.photo);
                }
                
                // Clear onboarding localStorage data on success
                localStorage.removeItem('patientOnboardingData');
                localStorage.removeItem('patientOnboardingStep');
                localStorage.removeItem('patientOnboardingSubmitAttempted');
                localStorage.removeItem('onboardingData'); // Clear both old and new keys
                localStorage.removeItem('onboardingStep');
                
                // IMPORTANT: Extract patient ID for redirection
                const patientId = responseData.patient?.id || localStorage.getItem('patientId') || medicalIdToSubmit;
                
                // Redirect to patient dashboard with slight delay to ensure localStorage is updated
                console.log('Redirecting to patient dashboard');
                setTimeout(() => {
                  // Use the correct patient dashboard route
                  router.push('/patient/dashboard');
                }, 300);
              }
              
              // Call the parent's onSubmit handler
              onSubmit();
            } catch (error) {
              console.error('Onboarding submission error:', error);
              setSubmitError(typeof error === 'object' && error !== null && 'message' in error 
                ? (error as Error).message 
                : 'Failed to submit onboarding data');
            } finally {
              setIsSubmitting(false);
            }
          }} 
          className="px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Complete Registration'}
        </Button>
      </div>
      
      {submitError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
          <AlertTriangle size={16} />
          <span>{submitError}</span>
        </div>
      )}
    </div>
  )
}
