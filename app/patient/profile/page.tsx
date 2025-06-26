"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"

// Dynamically import components to prevent SSR issues
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false })

import {
  AlertCircle,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  FileText,
  Printer,
  Download,
  Share2,
  Calendar
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { DEFAULT_HOSPITAL } from "@/lib/hospital-context"

interface Allergy {
  name: string
  severity: "Mild" | "Moderate" | "Severe"
}

interface Medication {
  name: string
  dosage: string
  frequency: string
}

// Allow conditions to be either strings or objects with name/status
type ConditionType = string | { name: string; status?: string };

interface Condition {
  name: string
  status?: string
}

interface PatientProfile {
  id: string
  name: string
  fullName: string
  medicalNumber: string
  displayMedicalNumber: string
  dob: string
  age: number
  gender: string
  height: string
  weight: string
  bloodType: string
  email: string
  phone: string
  address: string
  photo?: string
  profileImage?: string
  qrCode?: string
  allergies: Allergy[]
  conditions: ConditionType[]
  medications: Medication[]
  insurance: {
    provider: string
    policyNumber: string
    group: string
    expirationDate: string
  }
  // Support for nested user data structures that might contain profile photos
  User?: {
    photo?: string
  }
  user?: {
    photo?: string
  }
}

export default function PatientProfile() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("profile")
  const [activeTab, setActiveTab] = useState("profile")
  const [profileImage, setProfileImage] = useState<string>("")
  const qrCodeRef = useRef<HTMLDivElement>(null)

  // Default fallback photo - higher quality SVG with better contrast
  const defaultPhoto = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23f0f0f0' stroke='%23666666' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='9' r='6' fill='%23e0e0e0' stroke='%23999999'%3E%3C/circle%3E%3Cpath d='M20 21v-2a8 8 0 0 0-16 0v2' fill='%23e0e0e0' stroke='%23999999'%3E%3C/path%3E%3C/svg%3E"

  // Immediately load any cached profile image to improve perceived performance
  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== 'undefined') {
      const cachedImage = localStorage.getItem('patientProfilePhoto') || localStorage.getItem('photo')
      if (cachedImage) {
        setProfileImage(cachedImage)
      } else {
        setProfileImage(defaultPhoto) // Set default immediately instead of waiting
      }
    } else {
      setProfileImage(defaultPhoto) // Default during SSR
    }
  }, [])

  // Fetch patient data
  const { profile, isLoading, error, qrCodeValue } = usePatientProfile()
  const hospitalCode = profile?.hospitalCode || DEFAULT_HOSPITAL.id
  // Safe localStorage access with SSR check
  const [medicalID, setMedicalID] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('medicalNumber') || "" : ""
  )

  // Load profile data with better performance
  useEffect(() => {
    const loadPatientData = () => {
      // Early return if we're not in a browser environment (SSR)
      if (typeof window === 'undefined') {
        setProfileImage(defaultPhoto);
        return;
      }

      try {
        // Set medical ID from profile or fallback - priority based approach
        const dashboardMedicalID = profile?.medicalNumber || profile?.displayMedicalNumber || ""
        if (dashboardMedicalID) {
          setMedicalID(dashboardMedicalID)
          // Safe localStorage operations
          try {
            localStorage.setItem('medicalNumber', dashboardMedicalID)
          } catch (e) {
            console.warn('Unable to save medical ID to localStorage:', e)
          }
        }

        // Enhanced profile image loading - multi-source with priority
        const safeSetProfilePhoto = (photo: string) => {
          setProfileImage(photo);
          try {
            localStorage.setItem('patientProfilePhoto', photo);
          } catch (e) {
            console.warn('Unable to save profile photo to localStorage:', e);
          }
        };
        
        // Priority 1: User object in profile (often contains the most recent photo)
        // Use typeof check and type assertion to handle possible undefined fields
        const profileObj = profile as any; // Type assertion for flexibility
        if (profileObj && profileObj.User && profileObj.User.photo) {
          safeSetProfilePhoto(profileObj.User.photo);
          return; // Exit early if we have the image
        }
        
        // Priority 2: Check if user property exists with photo
        if (profileObj && profileObj.user && profileObj.user.photo) {
          safeSetProfilePhoto(profileObj.user.photo);
          return; // Exit early if we have the image
        }
        
        // Priority 3: Direct profile photo from API
        if (profile?.photo) {
          safeSetProfilePhoto(profile.photo);
          return; // Exit early if we have the image
        }
        
        // Priority 4: Check if profile has a profileImage property
        if (profile?.profileImage) {
          safeSetProfilePhoto(profile.profileImage);
          return; // Exit early if we have the image
        }
        
        // Priority 5: Check registration data in localStorage
        try {
          const registrationData = localStorage.getItem('patientRegistrationData');
          if (registrationData) {
            try {
              const parsedData = JSON.parse(registrationData);
              if (parsedData.photo) {
                setProfileImage(parsedData.photo);
                return; // Exit early if we have the image
              }
            } catch {}
          }
        } catch (e) {
          console.warn('Error accessing localStorage for registration data:', e);
        }
        
        // Priority 6: Check various localStorage keys for backward compatibility
        try {
          const photoSources = ['patientProfilePhoto', 'photo', 'userPhoto', 'profileImage'];
          for (const source of photoSources) {
            const savedImage = localStorage.getItem(source);
            if (savedImage) {
              setProfileImage(savedImage);
              return; // Exit early if we have the image
            }
          }
        } catch (e) {
          console.warn('Error accessing localStorage for photo sources:', e);
        }
        
        // If we get here, we couldn't find a profile image
        setProfileImage(defaultPhoto);
      } catch (error) {
        console.error('Error loading patient data:', error);
        // Still set default photo on error
        setProfileImage(defaultPhoto);
      }
    }
    
    loadPatientData()
  }, [profile, hospitalCode, defaultPhoto])

  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    setCurrentPage(page)
    
    if (page === "profile") {
      // Already on the profile page
      return
    } else if (page === "dashboard") {
      router.push("/patient/dashboard")
    } else {
      // Fix URL duplication issue
      if (page.startsWith('patient/')) {
        router.push(`/${page}`)
      } else {
        router.push(`/patient/${page}`)
      }
    }
  };

  // Prepare profile data for sidebar
  const profileDataForSidebar = {
    name: profile?.name || "",
    medicalNumber: medicalID || "",
    profileImage: profileImage || undefined,
  }

  // Handle print functionality
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Use memoization  // Generate content for optimization with improved loading state
  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center space-y-6">
            <Spinner className="w-12 h-12 text-blue-500" />
            <p className="text-lg font-medium">Loading patient profile...</p>
            {/* Show partial UI even during loading for better user experience */}
            <div className="w-full max-w-sm p-4 mt-4 border rounded-lg shadow-sm bg-white/50 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-6 rounded-lg border border-red-200 bg-red-50">
          <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      );
    }

    if (!profile) {
      return null;
    }

    return (
      <div>
        {/* Medical ID Card */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-800">Medical ID Card</CardTitle>
                </div>
                <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="bg-white p-3 rounded-lg shadow-sm flex-shrink-0">
                  {profile.qrCode ? (
                    <div className="w-[130px] h-[130px] relative">
                      <Image 
                        src={profile.qrCode} 
                        alt="Patient QR Code" 
                        fill 
                        sizes="130px"
                        style={{ objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div ref={qrCodeRef}>
                      <QRCode 
                        value={qrCodeValue || `CentralHealth:${medicalID || profile.medicalNumber || 'NA'}`} 
                        size={130} 
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-grow space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 ring-4 ring-blue-50 shadow-md border border-blue-100">
                      <AvatarImage 
                        src={profileImage || profile.photo || defaultPhoto} 
                        alt={profile.fullName || "Patient"}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultPhoto
                        }}
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-lg">
                        {profile.fullName?.substring(0, 2).toUpperCase() || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profile.fullName}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Age: {profile.age}</span>
                        <span>•</span>
                        <span>{profile.gender}</span>
                        <span>•</span>
                        <span>Blood Type: {profile.bloodType || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-500">Medical Number</p>
                      <p className="font-medium">{medicalID || profile.medicalNumber}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{profile.dob}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-500">Insurance</p>
                      <p className="font-medium">{profile.insurance?.provider || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Summary Cards */}
          <div className="space-y-6">
            {/* Insurance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-500" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Provider</label>
                    <div className="text-gray-700">{profile.insurance?.provider || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Policy Number</label>
                    <div className="text-gray-700">{profile.insurance?.policyNumber || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Group Number</label>
                    <div className="text-gray-700">{profile.insurance?.group || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                    <div className="text-gray-700">{profile.insurance?.expirationDate || "Not specified"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-500">Spouse</p>
                      <div className="flex items-center mt-1 text-sm">
                        <Phone className="mr-1 h-4 w-4 text-gray-500" />
                        <span>(555) 123-4567</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Jane Smith</p>
                      <p className="text-sm text-gray-500">Sister</p>
                      <div className="flex items-center mt-1 text-sm">
                        <Phone className="mr-1 h-4 w-4 text-gray-500" />
                        <span>(555) 987-6543</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Patient Information */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5 text-gray-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="font-medium">{profile.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="font-medium">{profile.dob}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender</label>
                        <p className="font-medium">{profile.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Age</label>
                        <p className="font-medium">{profile.age}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Height</label>
                        <p className="font-medium">{profile.height || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Weight</label>
                        <p className="font-medium">{profile.weight || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-gray-500" />
                      Contact Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Address</label>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="font-medium">{profile.phone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Home Address</label>
                        <p className="font-medium">{profile.address || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="medical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                      Allergies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.allergies && profile.allergies.length > 0 ? (
                        profile.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="font-medium">{allergy.name}</div>
                            <Badge 
                              className={
                                allergy.severity === "Severe" 
                                  ? "bg-red-100 text-red-800" 
                                  : allergy.severity === "Moderate"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {allergy.severity}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No allergies recorded.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="mr-2 h-5 w-5 text-blue-500" />
                      Medical Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.conditions && profile.conditions.length > 0 ? (
                        profile.conditions.map((condition, index) => {
                          // Explicitly type check and cast to prevent TypeScript errors
                          const isStringCondition = typeof condition === 'string';
                          const conditionName = isStringCondition ? condition : (condition as Condition).name;
                          const conditionStatus = isStringCondition ? null : (condition as Condition).status;
                          
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                                <div className="font-medium">{conditionName}</div>
                              </div>
                              {conditionStatus && (
                                <Badge className="ml-2">{conditionStatus}</Badge>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500">No medical conditions recorded.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-purple-500" />
                      Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.medications && profile.medications.length > 0 ? (
                        profile.medications.map((med, index) => (
                          <div key={index} className="flex items-start justify-between pb-3 border-b last:border-b-0 last:pb-0">
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-gray-500">{med.dosage}</p>
                            </div>
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              {med.frequency}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No medications recorded.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-teal-500" />
                      Visit History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-b pb-3">
                        <p className="font-medium">Annual Physical Examination</p>
                        <p className="text-sm text-gray-500">October 10, 2024</p>
                        <p className="text-sm mt-1">Dr. Sarah Johnson - Cardiology</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Follow-up Consultation</p>
                        <p className="text-sm text-gray-500">August 22, 2024</p>
                        <p className="text-sm mt-1">Dr. Michael Chen - Internal Medicine</p>
                      </div>
                      <div className="pb-3">
                        <p className="font-medium">Emergency Room Visit</p>
                        <p className="text-sm text-gray-500">June 5, 2024</p>
                        <p className="text-sm mt-1">Dr. Alicia Rodriguez - Emergency Medicine</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-gray-500" />
                      Medical Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">Lab Results - CBC</p>
                            <p className="text-xs text-gray-500">10/10/2024 - Dr. Johnson</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">EKG Results</p>
                            <p className="text-xs text-gray-500">10/10/2024 - Dr. Johnson</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">Discharge Summary</p>
                            <p className="text-xs text-gray-500">06/06/2024 - Dr. Rodriguez</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }, [isLoading, error, profile, medicalID, profileImage, qrCodeValue, activeTab, defaultPhoto, handlePrint]);

  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Profile" }]}
      hideProfileHeader={false}
      profileData={profileDataForSidebar}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </DashboardLayout>
  );
}