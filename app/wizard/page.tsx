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
      authenticated: patientResponse?.authenticated
    })
    
    // If data is loading, wait
    if (isLoading) return
    
    // Not authenticated, redirect to login
    if (!patientResponse || !patientResponse.authenticated) {
      console.log('Not authenticated, redirecting to login')
      router.push('/')
      return
    }
    
    // Simply redirect to dashboard
    console.log('Authenticated, redirecting to dashboard')
    router.push('/dashboard')
    
    // Update loading state
    setLoading(false)
  }, [patientResponse, isLoading, router])
  
  // No longer need separate handlers as this page will just redirect to dashboard
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }
  
  // Always return loading state since this page will redirect immediately
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  )
}
