"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, UserPlus, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCard } from "@/components/ui/stats-card"
import Link from "next/link"
import { AntenatalPatientList } from "@/components/antenatal/antenatal-patient-list"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface AntenatalPatient {
  id: string
  name: string
  mrn: string // Consistently using mrn as the medical ID field per CentralHealth System rules
  age: number
  gestationalAge: number
  nextAppointment: string | null
  riskLevel: "low" | "medium" | "high"
  status: "active" | "completed" | "referred" | "transferred"
  trimester: 1 | 2 | 3
  imageUrl?: string
  expectedDueDate?: string | null
}

interface AntenatalClientProps {
  hospitalName: string
}

export default function AntenatalClient({ hospitalName }: AntenatalClientProps) {
  const router = useRouter()
  const [patients, setPatients] = useState<AntenatalPatient[]>([])
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    newRegistrations: 0,
    upcomingAppointments: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Calculate trimester based on gestational age
  const calculateTrimester = (gestationalAge: number): 1 | 2 | 3 => {
    if (gestationalAge < 13) return 1
    if (gestationalAge < 27) return 2
    return 3
  }

  // Calculate gestational age based on expected due date
  const calculateGestationalAge = (edd: string | null | undefined): number => {
    if (!edd) return 0
    
    try {
      const dueDate = new Date(edd)
      if (isNaN(dueDate.getTime())) return 0
      
      // Pregnancy is approximately 40 weeks
      const gestationPeriodInDays = 280
      const today = new Date()
      
      // Calculate days between now and due date
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate current gestational age in weeks
      const gestationalAgeInWeeks = Math.floor((gestationPeriodInDays - daysUntilDue) / 7)
      
      // Ensure value is within reasonable range
      return Math.max(0, Math.min(gestationalAgeInWeeks, 42))
    } catch (error) {
      console.error("Error calculating gestational age:", error)
      return 0
    }
  }

  // Function to load patients from localStorage when API fails
  const loadPatientsFromLocalStorage = () => {
    try {
      // Check multiple possible keys for antenatal patients data
      const possibleKeys = [
        `${hospitalName}-antenatal-patients`,
        `antenatal_registrations_${hospitalName}`,
        `antenatal_registration_${hospitalName}_`,  // Prefix for patient-specific registrations
        'antenatalPatients',
        'antenatalSelectedPatient',
        'selectedAntenatalPatient', // Single patient from registration
        `${hospitalName}-patients` // General patients list
      ]
      
      console.log('Checking localStorage keys:', possibleKeys)
      
      // Try to find antenatal data in any of the keys
      let storedData: any[] = []
      let foundData = false
      
      // First check for all keys that might contain patient arrays
      const arrayKeys = [`${hospitalName}-antenatal-patients`, `antenatal_registrations_${hospitalName}`]
      for (const key of arrayKeys) {
        const data = localStorage.getItem(key)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`Found antenatal patients array in key: ${key}`, parsed)
              storedData = [...storedData, ...parsed]
              foundData = true
            }
          } catch (e) {
            console.error(`Error parsing localStorage key ${key}:`, e)
          }
        }
      }
      
      // Then check for individual patient entries
      const allKeys = Object.keys(localStorage)
      for (const key of allKeys) {
        // Look for patient-specific registration keys
        if (key.startsWith(`antenatal_registration_${hospitalName}_`)) {
          try {
            const data = localStorage.getItem(key)
            if (data) {
              const parsed = JSON.parse(data)
              console.log(`Found individual antenatal patient in key: ${key}`, parsed)
              storedData.push(parsed)
              foundData = true
            }
          } catch (e) {
            console.error(`Error parsing patient-specific key ${key}:`, e)
          }
        }
      }
      
      // Check for single patient objects in other keys
      if (!foundData) {
        const singleKeys = ['antenatalSelectedPatient', 'selectedAntenatalPatient']
        for (const key of singleKeys) {
          const data = localStorage.getItem(key)
          if (data) {
            try {
              const parsed = JSON.parse(data)
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                console.log(`Found single antenatal patient in key: ${key}`, parsed)
                storedData.push(parsed)
                foundData = true
              }
            } catch (e) {
              console.error(`Error parsing localStorage key ${key}:`, e)
            }
          }
        }
      }
      
      if (storedData.length > 0) {
        console.log(`Successfully loaded data from localStorage, items:`, storedData.length)
        // Transform stored data to match expected format
        const transformedPatients = storedData.map((patient: any) => {
          // Extract user data if nested
          const userData = patient.User || {}
          // Get patient name - check multiple possible locations
          const patientName = patient.name || userData.name || 'Unknown Patient'
          
          // Get MRN - consistent with CentralHealth System rules to always use mrn field
          const medicalId = patient.mrn || patient.medicalNumber || 
                          userData.mrn || userData.medicalNumber || ''
          
          // Get patient ID
          const patientId = patient.id || userData.id || 'unknown'
          
          // Get photo URL from multiple possible fields
          const photoUrl = patient.photo || patient.imageUrl || 
                         (patient.profilePicture ? patient.profilePicture.imageUrl : '') || 
                         ''
          
          // Calculate gestational age and trimester
          const edd = patient.expectedDueDate || patient.edd || null
          const gestAge = calculateGestationalAge(edd)
          const trimesterValue = calculateTrimester(gestAge)
          
          return {
            id: patientId,
            name: patientName,
            mrn: medicalId, // Following CentralHealth System rules for consistent MRN field
            age: patient.age || userData.age || 0,
            gestationalAge: gestAge,
            nextAppointment: patient.nextVisitDate || patient.nextAppointment || null,
            riskLevel: (patient.riskLevel || "low") as "low" | "medium" | "high",
            status: "active" as "active" | "completed" | "referred" | "transferred",
            trimester: trimesterValue,
            imageUrl: photoUrl,
            expectedDueDate: edd
          }
        })
        
        setPatients(transformedPatients)
        
        // Update stats based on localStorage data
        setStats({
          totalPatients: transformedPatients.length,
          activePatients: transformedPatients.filter(p => p.status === 'active').length,
          newRegistrations: transformedPatients.length, // Treat all localStorage patients as new
          upcomingAppointments: transformedPatients.filter(p => {
            if (!p.nextAppointment) return false
            const appointmentDate = new Date(p.nextAppointment)
            const today = new Date()
            const oneWeekLater = new Date()
            oneWeekLater.setDate(oneWeekLater.getDate() + 7)
            return appointmentDate >= today && appointmentDate <= oneWeekLater
          }).length
        })
        
        // Show toast notification for successful registration
        toast({
          title: "Antenatal Patient Data Loaded",
          description: `Successfully loaded ${transformedPatients.length} patients from local storage`,
          className: "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4",
        })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error loading patients from localStorage:', error)
      return false
    }
  }

  // Debug localStorage keys to help troubleshoot
  const debugLocalStorage = () => {
    if (typeof window === 'undefined') return
    
    try {
      console.log('Debugging localStorage for antenatal data:')
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('antenatal') || key.includes(hospitalName))) {
          keys.push(key)
          try {
            const value = localStorage.getItem(key)
            if (value) {
              const parsed = JSON.parse(value)
              console.log(`Key: ${key}, Items: ${Array.isArray(parsed) ? parsed.length : 'Not an array'}`)
            }
          } catch (e) {
            console.log(`Key: ${key}, Error parsing`)
          }
        }
      }
      if (keys.length === 0) {
        console.log('No antenatal keys found in localStorage')
      }
    } catch (e) {
      console.error('Error debugging localStorage:', e)
    }
  }

  // Handle view button click
  const handleViewPatient = (patient: AntenatalPatient) => {
    if (!patient || !patient.id) return
    router.push(`/${hospitalName}/admin/antenatal/${patient.id}`)
  }
  
  // Handle appointment button click
  const handleAppointment = (patient: AntenatalPatient) => {
    if (!patient || !patient.id) return
    router.push(`/${hospitalName}/admin/antenatal/${patient.id}/appointments/new`)
  }

  // Load data immediately on component mount, trying both API and localStorage
  useEffect(() => {
    // Force load all localStorage data immediately on mount
    const autoLoadPatientData = () => {
      try {
        // Get all keys from localStorage
        const allData: any[] = []
        const keys = Object.keys(localStorage)
        
        // Find all relevant keys
        const relevantKeys = keys.filter(key => 
          key.includes('patient') || 
          key.includes('antenatal') || 
          key.includes(hospitalName) ||
          key.includes('registration')
        )
        
        console.log('Auto-loading: Found potentially relevant keys:', relevantKeys)
        
        // Process all keys
        relevantKeys.forEach(key => {
          try {
            const data = localStorage.getItem(key)
            if (!data) return
            
            const parsed = JSON.parse(data)
            if (Array.isArray(parsed)) {
              console.log(`Adding array data from ${key}, length:`, parsed.length)
              allData.push(...parsed)
            } else if (parsed && typeof parsed === 'object') {
              console.log(`Adding object data from ${key}`)
              allData.push(parsed)
            }
          } catch (e) {
            console.error(`Error parsing key ${key}:`, e)
          }
        })
        
        // Process data if found
        if (allData.length > 0) {
          console.log(`Found ${allData.length} potential patient records from localStorage`)
          
          // Transform data
          const transformedPatients = allData.map((patient: any) => {
            // Extract user data if nested
            const userData = patient.User || {}
            
            // Get patient name
            const patientName = patient.name || userData.name || 'Unknown Patient'
            
            // Get MRN - consistent with CentralHealth System rules
            const medicalId = patient.mrn || patient.medicalNumber || 
                            userData.mrn || userData.medicalNumber || ''
            
            // Properly extract age, ensuring it's at least 18 for antenatal patients
            const patientAge = patient.age || userData.age || 18
            
            // Get patient ID
            const patientId = patient.id || userData.id || 'unknown'
            
            // Calculate next appointment date if available
            let nextAppt = null
            if (patient.nextVisitDate) {
              nextAppt = patient.nextVisitDate
            } else if (patient.nextAppointment) {
              nextAppt = patient.nextAppointment
            } else if (patient.edd || patient.expectedDueDate) {
              // If no appointment but has EDD, create one 2 weeks from now
              const apptDate = new Date()
              apptDate.setDate(apptDate.getDate() + 14)
              nextAppt = apptDate.toISOString().split('T')[0]
            }
            
            return {
              id: patientId,
              name: patientName,
              mrn: medicalId,
              age: patientAge,
              gestationalAge: calculateGestationalAge(patient.expectedDueDate || patient.edd),
              nextAppointment: nextAppt,
              riskLevel: (patient.riskLevel || "low") as "low" | "medium" | "high",
              status: "active" as "active" | "completed" | "referred" | "transferred",
              trimester: calculateTrimester(calculateGestationalAge(patient.expectedDueDate || patient.edd)),
              imageUrl: patient.photo || patient.imageUrl || 
                       (patient.profilePicture ? patient.profilePicture.imageUrl : '') || '',
              expectedDueDate: patient.expectedDueDate || patient.edd || null
            }
          })
          
          // Deduplicate by ID
          const uniquePatients = transformedPatients.filter((patient, index, self) =>
            index === self.findIndex((p) => p.id === patient.id)
          )
          
          // Update state with the found data
          setPatients(uniquePatients)
          setStats({
            totalPatients: uniquePatients.length,
            activePatients: uniquePatients.filter(p => p.status === 'active').length,
            newRegistrations: uniquePatients.length,
            upcomingAppointments: uniquePatients.filter(p => p.nextAppointment).length
          })
          
          // Save to localStorage for future use
          localStorage.setItem(`${hospitalName}-antenatal-patients`, JSON.stringify(uniquePatients))
          
          console.log('Auto-loaded patient data:', uniquePatients)
          return true
        }
        return false
      } catch (e) {
        console.error('Error in auto-loading data:', e)
        return false
      }
    }
    
    // Helper function to generate a default appointment date (2 weeks out)
    const generateDefaultAppointment = () => {
      const date = new Date()
      date.setDate(date.getDate() + 14) // 2 weeks from now
      return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }
    
    async function fetchData() {
      try {
        setIsLoading(true)
        debugLocalStorage() // Debug localStorage
        
        // First try to auto-load data from localStorage
        const dataLoaded = autoLoadPatientData()
        if (dataLoaded) {
          console.log('Successfully auto-loaded data from localStorage, skipping API call')
          setIsLoading(false)
          return
        }

        // If no localStorage data, try API call
        const response = await fetch(`/api/hospitals/${hospitalName}/antenatal/patients`, {
          credentials: 'include'
        })

        if (!response.ok) {
          console.error('API response not OK:', response.status)
          // If API fails, try to load from localStorage as backup
          if (!loadPatientsFromLocalStorage()) {
            // If both API and localStorage fail, show error toast
            toast({
              title: "Error loading patient data",
              description: "Could not load antenatal patient data",
              variant: "destructive",
            })
          }
          return
        }
        
        // Process API response
        const data = await response.json()
        
        // Handle both array response and nested structure
        const patientData = Array.isArray(data) ? data : 
                           (data.patients && Array.isArray(data.patients) ? data.patients : [])
        
        // Format the patient data properly
        const formattedPatients = patientData.map((p: any) => ({
          ...p,
          // Ensure age is at least 18 for antenatal patients (not 0)
          age: Math.max(p.age || 18, 18),  
          // Use mrn consistently per CentralHealth rules
          mrn: p.mrn || p.medicalNumber || p.id || '',
          // Ensure appointment dates exist
          nextAppointment: p.nextAppointment || generateDefaultAppointment(),
          // Default status and risk level
          status: p.status || 'active',
          riskLevel: p.riskLevel || 'low',
          // Ensure trimester is calculated
          trimester: p.trimester || calculateTrimester(calculateGestationalAge(p.expectedDueDate || p.edd))
        }))
        
        console.log('Processed patient data:', formattedPatients)
        
        // Update state with formatted data
        setPatients(formattedPatients)
        
        // Update stats based on processed data
        setStats({
          totalPatients: formattedPatients.length,
          activePatients: formattedPatients.filter((p: any) => p.status === 'active').length,
          newRegistrations: formattedPatients.length,
          upcomingAppointments: formattedPatients.filter((p: any) => p.nextAppointment).length
        })
        
        // Cache formatted data for future use
        localStorage.setItem(`${hospitalName}-antenatal-patients`, JSON.stringify(formattedPatients))
      } catch (error) {
        console.error("Error fetching antenatal data:", error)
        // Try to load from localStorage as fallback on complete API failure
        if (!loadPatientsFromLocalStorage()) {
          setPatients([]) // Only set empty array if localStorage also fails
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [hospitalName])

  // Display centered toast message for newly registered patients
  useEffect(() => {
    const newPatientNotification = localStorage.getItem(`${hospitalName}-new-antenatal-registration`)
    if (newPatientNotification) {
      try {
        const patientInfo = JSON.parse(newPatientNotification)
        // Display centered toast with patient info
        toast({
          title: "Patient Registered Successfully",
          description: `${patientInfo.name || 'New patient'} has been successfully registered for antenatal care.`,
          variant: "default",
          className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md z-50",
        })
        // Clear the notification after displaying
        localStorage.removeItem(`${hospitalName}-new-antenatal-registration`)
      } catch (error) {
        console.error("Error displaying new patient notification:", error)
      }
    }
  }, [hospitalName])

  // Emergency function to force load ALL localStorage data into the dashboard
  const forceLoadAllPatientData = () => {
    // Get all keys from localStorage
    const allData: any[] = []
    
    try {
      console.log('EMERGENCY: Attempting to load ALL localStorage data')
      
      // 1. First look for any key that contains patient data
      const keys = Object.keys(localStorage)
      const relevantKeys = keys.filter(key => {
        return key.includes('patient') || 
               key.includes('antenatal') || 
               key.includes(hospitalName) ||
               key.includes('registration')
      })
      
      console.log('Found potentially relevant keys:', relevantKeys)
      
      // 2. Try to parse each key
      relevantKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (!data) return
          
          const parsed = JSON.parse(data)
          console.log(`Key ${key} contents:`, parsed)
          
          if (Array.isArray(parsed)) {
            console.log(`Adding array data from ${key}, length:`, parsed.length)
            allData.push(...parsed)
          } else if (parsed && typeof parsed === 'object') {
            console.log(`Adding object data from ${key}`)
            allData.push(parsed)
          }
        } catch (e) {
          console.error(`Error parsing key ${key}:`, e)
        }
      })
      
      // 3. Transform and deduplicate data
      if (allData.length > 0) {
        console.log(`Found ${allData.length} potential patient records from localStorage`)
        
        // Transform using our existing function logic
        const transformedPatients = allData.map((patient: any) => {
          // Extract user data if nested
          const userData = patient.User || {}
          
          // Get patient name - check multiple possible locations
          const patientName = patient.name || userData.name || 'Unknown Patient'
          
          // Get MRN - consistent with CentralHealth System rules
          const medicalId = patient.mrn || patient.medicalNumber || 
                          userData.mrn || userData.medicalNumber || ''
          
          // Get patient ID
          const patientId = patient.id || userData.id || 'unknown'
          
          return {
            id: patientId,
            name: patientName,
            mrn: medicalId, 
            age: patient.age || userData.age || 0,
            gestationalAge: calculateGestationalAge(patient.expectedDueDate || patient.edd),
            nextAppointment: patient.nextVisitDate || patient.nextAppointment || null,
            riskLevel: (patient.riskLevel || "low") as "low" | "medium" | "high",
            status: "active" as "active" | "completed" | "referred" | "transferred",
            trimester: calculateTrimester(calculateGestationalAge(patient.expectedDueDate || patient.edd)),
            imageUrl: patient.photo || patient.imageUrl || 
                     (patient.profilePicture ? patient.profilePicture.imageUrl : '') || '',
            expectedDueDate: patient.expectedDueDate || patient.edd || null
          }
        })
        
        // Deduplicate by ID
        const uniquePatients = transformedPatients.filter((patient, index, self) =>
          index === self.findIndex((p) => p.id === patient.id)
        )
        
        console.log('Transformed and deduplicated patients:', uniquePatients)
        
        // Update state
        setPatients(uniquePatients)
        setStats({
          totalPatients: uniquePatients.length,
          activePatients: uniquePatients.filter(p => p.status === 'active').length,
          newRegistrations: uniquePatients.length,
          upcomingAppointments: uniquePatients.filter(p => {
            if (!p.nextAppointment) return false
            const appointmentDate = new Date(p.nextAppointment)
            const today = new Date()
            const oneWeekLater = new Date()
            oneWeekLater.setDate(oneWeekLater.getDate() + 7)
            return appointmentDate >= today && appointmentDate <= oneWeekLater
          }).length
        })
        
        // Show toast notification
        toast({
          title: "Patient Data Loaded",
          description: `Successfully loaded ${uniquePatients.length} patients`,
          variant: "default",
          className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md z-50",
        })
      } else {
        toast({
          title: "No Patient Data Found",
          description: "Could not find any patient data in localStorage",
          variant: "destructive",
          className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md z-50",
        })
      }
    } catch (e) {
      console.error('Error in emergency data loading:', e)
      toast({
        title: "Error Loading Data",
        description: String(e),
        variant: "destructive",
        className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md z-50",
      })
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Antenatal Care Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage antenatal patients and their care records
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={forceLoadAllPatientData}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Clock className="mr-2 h-4 w-4" /> Load Existing Data
          </Button>
          <Button
            onClick={() => router.push(`/${hospitalName}/admin/antenatal/search`)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Register New Patient
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="h-6 w-6" />}
          description="Registered for antenatal care"
          loading={isLoading}
        />
        <StatsCard
          title="Active Patients"
          value={stats.activePatients}
          icon={<UserPlus className="h-6 w-6" />}
          description="Currently under observation"
          loading={isLoading}
        />
        <StatsCard
          title="New Registrations"
          value={stats.newRegistrations}
          icon={<Calendar className="h-6 w-6" />}
          description="Last 30 days"
          loading={isLoading}
        />
        <StatsCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          icon={<Clock className="h-6 w-6" />}
          description="Next 7 days"
          loading={isLoading}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk</TabsTrigger>
          <TabsTrigger value="third-trimester">Third Trimester</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <AntenatalPatientList 
            patients={patients} 
            hospitalName={hospitalName} 
            isLoading={isLoading} 
            handleViewPatient={handleViewPatient}
            handleAppointment={handleAppointment}
          />
        </TabsContent>
        <TabsContent value="active">
          <AntenatalPatientList 
            patients={patients.filter(p => p.status === 'active')} 
            hospitalName={hospitalName} 
            isLoading={isLoading} 
            handleViewPatient={handleViewPatient}
            handleAppointment={handleAppointment}
          />
        </TabsContent>
        <TabsContent value="high-risk">
          <AntenatalPatientList 
            patients={patients.filter(p => p.riskLevel === 'high')} 
            hospitalName={hospitalName} 
            isLoading={isLoading} 
          />
        </TabsContent>
        <TabsContent value="third-trimester">
          <AntenatalPatientList 
            patients={patients.filter(p => p.trimester === 3)} 
            hospitalName={hospitalName} 
            isLoading={isLoading} 
          />
        </TabsContent>
      </Tabs>
      
      {/* Toast Container for centered notifications */}
      <Toaster />
    </div>
  )
}