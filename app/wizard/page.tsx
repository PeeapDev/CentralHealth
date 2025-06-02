"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCachedFetch } from "@/lib/use-cached-fetch"
import { Loader2 } from "lucide-react"

export default function WizardPage() {
  const router = useRouter()
  const [showWizard, setShowWizard] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  
  // Check authentication and onboarding status
  const { 
    data: patientResponse, 
    isLoading, 
    error 
  } = useCachedFetch('/api/patients/session/me', {
    cacheTime: 0, // Don't cache this request
    revalidateOnFocus: true,
    timeout: 5000
  })
  
  // Add a safety timeout to prevent endless loading
  useEffect(() => {
    // Set a timeout to stop loading after 5 seconds regardless of API response
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('Safety timeout triggered - forcing wizard to show')
        setLoading(false)
      }
    }, 5000)
    
    return () => clearTimeout(safetyTimeout)
  }, [])
  
  useEffect(() => {
    // Add detailed debug logging
    console.log('Wizard page - auth check state:', { 
      isLoading, 
      patientResponse, 
      error,
      authenticated: patientResponse?.authenticated,
      onboardingCompleted: patientResponse?.onboardingCompleted
    })
    
    // If data is loading, wait
    if (isLoading) return
    
    // Not authenticated, redirect to login
    if (!patientResponse || !patientResponse.authenticated) {
      console.log('Not authenticated, redirecting to login')
      router.push('/')
      return
    }
    
    // Onboarding already completed, redirect to dashboard
    if (patientResponse?.onboardingCompleted === true) {
      console.log('Onboarding already completed, redirecting to dashboard')
      router.push('/patient/dashboard')
      return
    }
    
    // Otherwise, show the wizard
    console.log('Showing onboarding wizard', patientResponse)
    setLoading(false)
  }, [patientResponse, isLoading, router])
  
  const handleStartOnboarding = () => {
    setShowWizard(false)
    router.push('/onboarding')
  }
  
  const handleSkipOnboarding = () => {
    // Simply redirect to dashboard without completing onboarding
    router.push('/patient/dashboard')
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Central Health!</DialogTitle>
            <DialogDescription>
              Complete your patient profile to access all features of the patient portal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-2">
              <h3 className="font-medium">Complete your onboarding process to:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Update your personal and health information</li>
                <li>Add emergency contacts</li>
                <li>Record important medical details</li>
                <li>Get your digital medical ID</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button 
              type="button" 
              variant="default"
              onClick={handleStartOnboarding}
            >
              Start Onboarding
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSkipOnboarding}
            >
              Skip for Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
