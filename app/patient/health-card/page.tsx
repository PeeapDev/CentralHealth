"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCachedFetch } from '@/lib/use-cached-fetch'
import Image from 'next/image'

// Add type definition for QRCode which will be loaded from CDN
declare global {
  interface Window {
    QRCode: any;
  }
}

export default function HealthCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patientData, setPatientData] = useState<any>(null)
  const [expiryDate, setExpiryDate] = useState<string>('')
  const qrCodeContainerRef = useRef<HTMLDivElement>(null)
  
  // Fetch patient data
  useEffect(() => {
    async function fetchPatientData() {
      try {
        setLoading(true)
        const response = await fetch('/api/patients/session/me', {
          credentials: 'include',
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch patient data')
        }
        
        const data = await response.json()
        setPatientData(data)
        
        // Calculate expiry date (5 years from now)
        const today = new Date()
        const expiryDateObj = new Date(today.setFullYear(today.getFullYear() + 5))
        setExpiryDate(expiryDateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }))
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching patient data:', err)
        setError('Failed to load your health card. Please try again.')
        setLoading(false)
      }
    }
    
    fetchPatientData()
  }, [router])
  
  // Generate QR code once patient data is loaded
  useEffect(() => {
    if (patientData?.medicalId && qrCodeContainerRef.current) {
      // Dynamically load QR code script
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js'
      script.async = true
      
      script.onload = () => {
        if (window.QRCode && qrCodeContainerRef.current) {
          // Clear previous QR code if any
          qrCodeContainerRef.current.innerHTML = ''
          
          // Generate QR code
          window.QRCode.toCanvas(
            qrCodeContainerRef.current,
            `CentralHealth:${patientData.medicalId}`,
            {
              width: 130,
              margin: 0,
              color: {
                dark: '#000',
                light: '#fff'
              }
            },
            (error: Error | null) => {
              if (error) console.error('Error generating QR code:', error)
            }
          )
        }
      }
      
      document.body.appendChild(script)
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [patientData])
  
  // Calculate age
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return null
    
    const birthDate = new Date(birthDateString)
    const today = new Date()
    
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-12">
        <h2 className="text-xl font-bold text-center">Loading your health card...</h2>
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-xl">{error}</div>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const patientName = patientData?.name || 'Patient'
  const patientAge = calculateAge(patientData?.birthDate) || 'N/A'
  const medicalId = patientData?.medicalId || 'Not assigned'
  const patientPhoto = patientData?.photo || '/placeholder-avatar.png'
  
  return (
    <div className="container max-w-screen-sm mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Your Central Health Card</h1>
      
      <Card className="overflow-hidden shadow-lg border-2 border-blue-500">
        {/* Header with hospital brand */}
        <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Central Health</h2>
              <p className="text-sm opacity-90">Sierra Leone Medical Services</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">VALID UNTIL</p>
              <p className="font-semibold">{expiryDate}</p>
            </div>
          </div>
        </div>
        
        {/* Card content */}
        <div className="p-6 bg-white">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side: Photo and QR code */}
            <div className="md:w-1/3 flex flex-col items-center gap-4">
              <div className="rounded-full overflow-hidden h-32 w-32 border-2 border-gray-200 flex items-center justify-center bg-gray-100">
                {patientPhoto ? (
                  <Image 
                    src={patientPhoto} 
                    alt="Patient" 
                    height={128} 
                    width={128} 
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="text-gray-400 text-lg">No Photo</div>
                )}
              </div>
              
              <div 
                ref={qrCodeContainerRef}
                className="bg-white p-2 border border-gray-200 rounded-md h-[140px] w-[140px] flex items-center justify-center"
              >
                <div className="animate-pulse h-32 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Right side: Patient details */}
            <div className="md:w-2/3 space-y-4">
              <div>
                <p className="text-sm text-gray-500">PATIENT NAME</p>
                <p className="text-lg font-semibold">{patientName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">MEDICAL ID</p>
                  <p className="text-md font-mono font-bold tracking-wider text-blue-700">{medicalId}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">AGE</p>
                  <p className="text-md">{patientAge} years</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">GENDER</p>
                  <p className="text-md">{patientData?.gender || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">BLOOD TYPE</p>
                  <p className="text-md">{patientData?.bloodGroup || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <CardFooter className="bg-gray-50 border-t px-6 py-3">
          <div className="w-full text-sm text-gray-600 flex justify-between items-center">
            <p>Scan QR code for digital verification</p>
            <p className="text-blue-600 font-semibold">CentralHealth.sl</p>
          </div>
        </CardFooter>
      </Card>
      
      {/* Action buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" onClick={() => router.push('/patient/dashboard')}>
          Back to Dashboard
        </Button>
        <Button onClick={() => window.print()}>
          Print Card
        </Button>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Keep this card with you for all hospital visits. Your medical ID is needed for accessing your health records.</p>
        <p className="mt-1">A welcome email with your medical ID has also been sent to your registered email address.</p>
      </div>
    </div>
  )
}
