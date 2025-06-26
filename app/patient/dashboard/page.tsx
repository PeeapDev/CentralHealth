"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  Phone,
  Pill,
  Plus,
  PlusCircle,
  Stethoscope,
  Thermometer,
  User,
  Users,
  FileText,
  TrendingUp,
  LogOut,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { DEFAULT_HOSPITAL } from "@/lib/hospital-context"
import { useHospitalContext } from "@/hooks/use-hospital-context"
import { Spinner } from "@/components/ui/spinner"
import { getInitialsFromFhirName, formatFhirName } from "@/utils/fhir-helpers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PatientDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const notification = searchParams?.get('notification')
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isOverview, setIsOverview] = useState(true) // Always true on dashboard
  const [showSessionWarning, setShowSessionWarning] = useState(notification === 'session_warning')
  
  // Use our hospital context to avoid "hospital not found" errors
  const { hospital } = useHospitalContext()
  
  // Fetch patient profile data
  const { profile, isLoading, error } = usePatientProfile()
  
  // Load patient data from profile and localStorage
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [patientData, setPatientData] = useState({
    name: "Unknown",
    medicalNumber: "",
    gender: "unknown",
    age: "--",
    dateOfBirth: "",
    phone: "000-000-0000",
    email: "",
    address: "No address recorded",
    bloodType: "Unknown",
    onboardingCompleted: false,
    admittedDate: "",
    attendingDoctor: "",
    height: "Not recorded",
    weight: "Not recorded",
    room: "",
    insurance: {
      provider: "Unknown",
      policyNumber: "",
      group: "",
      expirationDate: ""
    },
    allergies: [] as Array<{ name: string; severity: string }>,
    conditions: [] as string[],
    medications: [] as Array<{ name: string; dosage: string; frequency: string }>
  })
  
  // Load patient data from profile and registration data
  useEffect(() => {
    console.log('DEBUG: Loading patient profile and registration data')
    
    // Centralized function to load all patient data
    const loadPatientData = () => {
      const data = {
        name: "Unknown",
        medicalNumber: "",
        gender: "unknown",
        age: "--",
        dateOfBirth: "", 
        phone: "000-000-0000",
        email: "",
        address: "No address recorded",
        bloodType: "Unknown",
        height: "Not recorded",
        weight: "Not recorded",
        onboardingCompleted: false,
        admittedDate: "",
        attendingDoctor: "",
        room: "",
        insurance: {
          provider: "Unknown",
          policyNumber: "",
          group: "",
          expirationDate: ""
        },
        allergies: [] as Array<{ name: string; severity: string }>,
        conditions: [] as string[],
        medications: [] as Array<{ name: string; dosage: string; frequency: string }>
      }
      
      // Priority 1: Get data from profile API response
      if (profile) {
        console.log('DEBUG: Patient profile data from API:', profile)
        
        // Extract name
        if (profile.name) data.name = profile.name
        
        // Extract medical number
        if (profile.displayMedicalNumber) {
          data.medicalNumber = profile.displayMedicalNumber
        } else if (profile.medicalID) {
          data.medicalNumber = profile.medicalID
        }
        
        // Extract other profile fields
        if (profile.gender) data.gender = profile.gender
        if (profile.dateOfBirth) data.dateOfBirth = profile.dateOfBirth
        if (profile.phone) data.phone = profile.phone
        if (profile.email) data.email = profile.email
        if (profile.address) data.address = profile.address
        if (profile.bloodType) data.bloodType = profile.bloodType
        if (profile.height) data.height = profile.height
        if (profile.weight) data.weight = profile.weight
        
        // Calculate age if date of birth is available
        if (profile.dateOfBirth) {
          const birthDate = new Date(profile.dateOfBirth)
          const today = new Date()
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
          data.age = age.toString()
        }
        
        // Get profile photo
        if (profile.profileImage) {
          setProfilePhoto(profile.profileImage)
          localStorage.setItem('patientProfilePhoto', profile.profileImage)
        }
      }
      
      // Priority 1: Get data from profile API response
      try {
        console.log('Priority 1: Loading data from profile API response')
        
        // Update fields with data from API response
        if (profile) {
          console.log('DEBUG: Found profile data from API', profile)
          
          // Basic patient info
          data.name = profile.name || data.name
          data.medicalNumber = profile.displayMedicalNumber || profile.medicalNumber || profile.medicalID || profile.id || data.medicalNumber
          data.gender = profile.gender || data.gender
          
          // Calculate age from date of birth if available
          if (profile.birthDate) {
            const dob = new Date(profile.birthDate)
            const today = new Date()
            const ageInYears = Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            data.age = isNaN(ageInYears) ? data.age : `${ageInYears}`
          } else if (profile.age) {
            data.age = `${profile.age}`
          }
          
          // Contact and personal info
          data.dateOfBirth = profile.dateOfBirth || profile.dob || data.dateOfBirth
          data.phone = profile.phone || data.phone
          data.email = profile.email || data.email
          data.address = profile.address || data.address
          
          // Medical info
          data.bloodType = profile.bloodType || data.bloodType
          data.height = profile.height || data.height
          data.weight = profile.weight || data.weight
          data.onboardingCompleted = profile.onboardingCompleted || data.onboardingCompleted
          data.admittedDate = profile.admittedDate || data.admittedDate
          data.attendingDoctor = profile.attendingDoctor || data.attendingDoctor
          data.room = profile.room || data.room
          
          // Complex objects - only replace if they exist in profile
          if (profile.insurance) {
            data.insurance = {
              provider: profile.insurance.provider || data.insurance.provider,
              policyNumber: profile.insurance.policyNumber || data.insurance.policyNumber,
              group: profile.insurance.group || data.insurance.group,
              expirationDate: profile.insurance.expirationDate || data.insurance.expirationDate
            }
          }
          
          // Arrays - only add if they exist in profile
          if (profile.allergies && profile.allergies.length > 0) {
            data.allergies = profile.allergies
          }
          
          if (profile.conditions && profile.conditions.length > 0) {
            data.conditions = profile.conditions
          }
          
          if (profile.medications && profile.medications.length > 0) {
            data.medications = profile.medications
          }
          
          // Profile photo handling
          if (profile.photo && !profilePhoto) {
            console.log('DEBUG: Found photo in profile data')
            setProfilePhoto(profile.photo)
            localStorage.setItem('patientProfilePhoto', profile.photo)
          } else if (profile.profileImage && !profilePhoto) {
            console.log('DEBUG: Found profileImage in profile data')
            setProfilePhoto(profile.profileImage)
            localStorage.setItem('patientProfilePhoto', profile.profileImage)
          }
        }
        
        // Priority 2: Get data from localStorage that wasn't in the profile
        console.log('Priority 2: Loading data from localStorage registration data')
        
        // Try to get registration data
        const registrationData = localStorage.getItem('patientRegistrationData')
        if (registrationData) {
          console.log('DEBUG: Found registration data in localStorage')
          const parsedData = JSON.parse(registrationData)
          
          // Only use localStorage data if API didn't provide it
          if (data.name === "Unknown" && parsedData.fullName) {
            data.name = parsedData.fullName
          }
          
          if (!data.medicalNumber && parsedData.medicalNumber) {
            data.medicalNumber = parsedData.medicalNumber
          }
          
          if (data.gender === "unknown" && parsedData.gender) {
            data.gender = parsedData.gender
          }
          
          if (!data.phone && parsedData.phone) {
            data.phone = parsedData.phone
          }
          
          if (!data.email && parsedData.email) {
            data.email = parsedData.email
          }
          
          if (data.address === "No address recorded" && parsedData.address) {
            data.address = parsedData.address
          }
          
          if (data.bloodType === "Unknown" && parsedData.bloodType) {
            data.bloodType = parsedData.bloodType
          }
          
          // Get photo from registration if not already set
          if (!profilePhoto && parsedData.photo) {
            console.log('DEBUG: Found photo in registration data')
            setProfilePhoto(parsedData.photo)
            localStorage.setItem('patientProfilePhoto', parsedData.photo)
          }
        }
        
        // Check individual localStorage keys as fallback
        if (data.name === "Unknown") {
          const storedName = localStorage.getItem('currentPatientName')
          if (storedName) data.name = storedName
        }
        
        if (!data.medicalNumber) {
          const storedMedicalNumber = localStorage.getItem('medicalNumber')
          if (storedMedicalNumber) data.medicalNumber = storedMedicalNumber
        }
        
        if (!data.email) {
          const storedEmail = localStorage.getItem('userEmail')
          if (storedEmail) data.email = storedEmail
        }
        
        // Try to get photo from localStorage if still not set
        if (!profilePhoto) {
          // Try multiple sources for the photo
          const attemptPhotoLoad = () => {
            // Check direct localStorage keys
            const storedPhoto = localStorage.getItem('patientProfilePhoto') || 
                              localStorage.getItem('photo') || 
                              localStorage.getItem('userPhoto')
            
            if (storedPhoto) {
              console.log('SUCCESS: Found patient photo in localStorage')
              setProfilePhoto(storedPhoto)
              return true
            }
            
            return false
          }
          
          if (!attemptPhotoLoad()) {
            // Set a default photo as fallback
            console.log('No patient photo found in any storage location, using default')
            // Set a data URL for a default avatar (base64 encoded small blue avatar)
            const defaultPhoto = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg=='
            setProfilePhoto(defaultPhoto)
          }
        }
      } catch (err) {
        console.error('Error loading patient data from localStorage:', err)
      }
      
      // Return the compiled data
      return data
    }
    
    // Load all patient data
    const patientInfo = loadPatientData()
    setPatientData(patientInfo)
    
    // For QR code generation, ensure we have a medical ID stored
    if (patientInfo.medicalNumber) {
      localStorage.setItem('medicalNumber', patientInfo.medicalNumber)
    }
    
  }, [profile, profilePhoto])

  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    // Set overview mode based on current page
    setIsOverview(page === "dashboard")
    setCurrentPage(page)
    
    if (page === "dashboard") {
      // Stay on dashboard
      return
    }
    
    // Fix URL duplication issue by ensuring we don't add duplicate /patient prefix
    // The page should already be cleaned up by the app-sidebar component
    if (page.startsWith('patient/')) {
      // Don't add another /patient prefix
      router.push(`/${page}`)
    } else {
      router.push(`/patient/${page}`)
    }
  }

  // Already declared at the top of the component

  if (isLoading) {
    return (
      <DashboardLayout 
        currentPage={currentPage}
        onNavigate={handleNavigation}
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Spinner className="w-10 h-10 mb-2" />
              <p className="text-gray-500">Loading patient dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout 
        currentPage={currentPage}
        onNavigate={handleNavigation}
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <div className="max-w-7xl mx-auto">
          <div className="p-6 rounded-lg border border-red-200 bg-red-50">
            <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button onClick={() => {
                // Clear all stored data and redirect to sign-in
                if (typeof window !== 'undefined') {
                  console.log('Clearing all browser storage...');
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/auth/login';
                }
              }}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return null
  }

  // Get the exact medical ID shown in the dashboard
  const dashboardMedicalID = profile?.patientId || profile?.medicalNumber || profile?.id || "";
  
  // Store this exact ID in localStorage for consistency across pages
  if (dashboardMedicalID) {
    localStorage.setItem('medicalNumber', dashboardMedicalID);
  }
  
  // Prepare profile data to pass to sidebar using ONLY the dashboard medical ID
  const profileDataForSidebar = {
    name: profile?.name || "", 
    medicalNumber: dashboardMedicalID, // Use exactly the same ID as shown on dashboard
    profileImage: profilePhoto || undefined,
  };
  
  // Store the current patient name in localStorage to ensure consistency across pages
  if (profile?.name) {
    localStorage.setItem('currentPatientName', profile.name);
  }
  
  // Make sure profile photo is always stored in localStorage
  if (profilePhoto) {
    localStorage.setItem('patientProfilePhoto', profilePhoto);
  }

  return (
    <DashboardLayout 
      currentPage={currentPage} 
      onNavigate={handleNavigation}
      hideProfileHeader={isOverview} // Hide profile in sidebar when on overview
      profileData={profileDataForSidebar}
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="max-w-7xl mx-auto">
        {/* Patient Info Header with improved layout */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-8 transition-all hover:shadow-lg duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Enhanced avatar with animation */}
              <Avatar className="h-16 w-16 ring-4 ring-blue-50 shadow-sm transition-transform hover:scale-105 duration-300">
                <AvatarImage 
                  src={profilePhoto || "/placeholder.svg?height=64&width=64"} 
                  alt={patientData.name || "Patient"} 
                />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {patientData.name !== "Unknown" 
                    ? patientData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : "P"}
                </AvatarFallback>
              </Avatar>
              <div className="pl-1">
                <h2 className="text-2xl font-bold text-gray-900">{patientData.name}</h2>
                <p className="text-gray-600 flex items-center">
                  <span className="flex items-center">
                    <Stethoscope className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> 
                    Medical ID: <span className="font-medium text-blue-700">{patientData.medicalNumber}</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {patientData.onboardingCompleted ? "Onboarded" : "In Progress"}
              </Badge>
              <p className="text-sm text-gray-500">Admitted: {patientData.admittedDate || "N/A"}</p>
              <p className="text-sm text-gray-500">Dr. {patientData.attendingDoctor || "N/A"}</p>
              <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-gray-500 justify-end">
                <span className="bg-gray-50 px-2 py-0.5 rounded-full">Age: {patientData.age}</span>
                <span className="bg-gray-50 px-2 py-0.5 rounded-full">Gender: {patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1)}</span>
                <span className="bg-gray-50 px-2 py-0.5 rounded-full">Blood: {patientData.bloodType || "Unknown"}</span>
              </div>
            </div>
          </div>
        </div>


        
        {/* Health Alerts */}
        <div className="mb-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-800">Health Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-700">Blood pressure slightly elevated</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Monitor
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-700">Medication due in 30 minutes</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Reminder
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Vitals & Metrics */}
          <div className="md:col-span-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Session Warning Alert */}
            {showSessionWarning && (
              <Card className="lg:col-span-3 border-amber-500 bg-amber-50">
                <CardContent className="pt-4">
                  <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="text-amber-800">Session already active</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      <p className="mb-3">
                        You attempted to register a new patient while already logged in as {patientData.name} (Medical ID: {patientData.medicalNumber}). 
                        For security and data protection, you must sign out before creating a new patient account.
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <Button 
                          variant="destructive" 
                          className="text-white" 
                          onClick={() => window.location.href = '/api/patients/signout'}
                        >
                          <LogOut className="mr-2 h-4 w-4" /> Sign Out Now
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowSessionWarning(false)}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Dismiss
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
            
            {/* Patient Vitals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Vital Signs</span>
                </CardTitle>
                <CardDescription>Latest readings from today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-700">72</div>
                    <div className="text-sm text-red-600">Heart Rate</div>
                    <div className="text-xs text-gray-500">bpm</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-700">120/80</div>
                    <div className="text-sm text-blue-600">Blood Pressure</div>
                    <div className="text-xs text-gray-500">mmHg</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Thermometer className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-700">98.6°F</div>
                    <div className="text-sm text-green-600">Temperature</div>
                    <div className="text-xs text-gray-500">Normal</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-700">98%</div>
                    <div className="text-sm text-purple-600">Oxygen Sat</div>
                    <div className="text-xs text-gray-500">SpO2</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Test Results */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                    <CardTitle>Recent Test Results</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <p className="font-medium">Complete Blood Count (CBC)</p>
                      <p className="text-sm text-gray-500">June 5, 2025</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Normal</Badge>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <p className="font-medium">Basic Metabolic Panel</p>
                      <p className="text-sm text-gray-500">June 5, 2025</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Review</Badge>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Urinalysis</p>
                      <p className="text-sm text-gray-500">June 5, 2025</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Normal</Badge>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Progress */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-indigo-500" />
                  <CardTitle>Treatment Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium">Cardiac Rehabilitation</p>
                      <span className="text-sm text-gray-500">80% Complete</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium">Physical Therapy</p>
                      <span className="text-sm text-gray-500">60% Complete</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium">Nutrition Plan</p>
                      <span className="text-sm text-gray-500">45% Complete</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-orange-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Appointments & Medications */}
          <div className="space-y-6">
            {/* Current Medications */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Pill className="mr-2 h-5 w-5 text-purple-500" />
                    <CardTitle>Current Medications</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Lisinopril 10mg</p>
                      <p className="text-xs text-gray-500">1 tablet daily</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Morning</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Metoprolol 25mg</p>
                      <p className="text-xs text-gray-500">1 tablet twice daily</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Morning/Night</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Aspirin 81mg</p>
                      <p className="text-xs text-gray-500">1 tablet daily</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Morning</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-teal-500" />
                    <CardTitle>Upcoming Appointments</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm">Schedule</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium">Cardiology Follow-up</p>
                      <p className="text-sm text-gray-500">June 10, 2025 10:00 AM</p>
                      <p className="text-xs mt-1">Dr. Sarah Johnson</p>
                    </div>
                    <Button variant="outline" size="sm">Reschedule</Button>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium">Physical Therapy</p>
                      <p className="text-sm text-gray-500">June 12, 2025 02:30 PM</p>
                      <p className="text-xs mt-1">Dr. Michael Chen</p>
                    </div>
                    <Button variant="outline" size="sm">Reschedule</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Care Team */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-cyan-500" />
                  <CardTitle>Care Team</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Dr. Sarah Johnson</p>
                      <p className="text-sm text-gray-500">Cardiology</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>MC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Dr. Michael Chen</p>
                      <p className="text-sm text-gray-500">Physical Therapy</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>LW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Linda Wilson</p>
                      <p className="text-sm text-gray-500">Nurse Practitioner</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5 text-green-500" />
                  <CardTitle>Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Visit
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Request Records
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Pill className="mr-2 h-4 w-4" />
                    Refill Rx
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Nurse Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
