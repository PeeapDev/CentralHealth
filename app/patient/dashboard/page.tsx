"use client"

import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
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

export default function PatientDashboardPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isOverview, setIsOverview] = useState(true) // Always true on dashboard
  
  // Use our hospital context to avoid "hospital not found" errors
  const { hospital } = useHospitalContext()
  
  // Fetch patient profile data
  const { profile, isLoading, error } = usePatientProfile()
  
  // Load patient photo from localStorage with appropriate fallbacks
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  
  useEffect(() => {
    console.log('DEBUG: Attempting to load patient photo from all possible sources...')
    
    // Try multiple sources for the patient photo
    const attemptPhotoLoad = () => {
      // Check 1: Direct localStorage key
      const storedPhoto = localStorage.getItem('patientProfilePhoto')
      if (storedPhoto) {
        console.log('SUCCESS: Found patient photo in localStorage')
        setProfilePhoto(storedPhoto)
        return true
      }
      
      // Check 2: Registration data
      try {
        const registrationData = localStorage.getItem('patientRegistrationData')
        if (registrationData) {
          const parsedData = JSON.parse(registrationData)
          if (parsedData.photo) {
            console.log('SUCCESS: Found patient photo in registration data')
            localStorage.setItem('patientProfilePhoto', parsedData.photo)
            setProfilePhoto(parsedData.photo)
            return true
          }
        }
      } catch (err) {
        console.error('Error parsing registration data:', err)
      }
      
      // Check 3: Try legacy keys
      const legacyPhoto = localStorage.getItem('photo') || localStorage.getItem('userPhoto')
      if (legacyPhoto) {
        console.log('SUCCESS: Found patient photo in legacy storage')
        localStorage.setItem('patientProfilePhoto', legacyPhoto) 
        setProfilePhoto(legacyPhoto)
        return true
      }
      
      // Fallback: Set a default photo for demo purposes
      console.log('No patient photo found in any storage location, using demo photo')
      // Set a data URL for a default avatar (base64 encoded small blue avatar)
      const defaultPhoto = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg=='
      setProfilePhoto(defaultPhoto)
      localStorage.setItem('patientProfilePhoto', defaultPhoto)
      return false
    }
    
    // Try to load the photo
    attemptPhotoLoad()
    
    // Cleanup function
    return () => {
      console.log('Cleaning up photo loading effect')
    }
  }, [])

  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    // Set overview mode based on current page
    setIsOverview(page === "dashboard")
    
    if (page === "dashboard") {
      setCurrentPage("dashboard")
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
                  alt={profile.name || "Patient"} 
                />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {getInitialsFromFhirName({ given: profile.name.split(' '), family: profile.name.split(' ').slice(-1)[0] })}
                </AvatarFallback>
              </Avatar>
              <div className="pl-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name || "Unknown Patient"}</h2>
                <p className="text-gray-600 flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Medical Number: {profile.patientId || profile.medicalNumber || profile.id}
                </p>
                <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-gray-500">
                  <span className="bg-gray-50 px-2 py-0.5 rounded-full">Age: {profile.age}</span>
                  <span className="bg-gray-50 px-2 py-0.5 rounded-full">Gender: {profile.gender}</span>
                  <span className="bg-gray-50 px-2 py-0.5 rounded-full">Blood: {profile.bloodType || "Unknown"}</span>
                </div>  
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                Admitted
              </Badge>
              <p className="text-sm text-gray-500">Admitted: {profile.admittedDate || "N/A"}</p>
              <p className="text-sm text-gray-500">Dr. {profile.attendingDoctor || "N/A"}</p>
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
          <div className="lg:col-span-2 space-y-6">
            {/* Vital Signs */}
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
