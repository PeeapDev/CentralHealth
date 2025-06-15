"use client"

import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { useRouter } from "next/navigation"
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
  Calendar,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Spinner } from "@/components/ui/spinner"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { generateHospitalMedicalID } from "@/utils/medical-id"
import { DEFAULT_HOSPITAL } from "@/lib/hospital-context"

export default function PatientProfile() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("profile")
  const [activeTab, setActiveTab] = useState("profile")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isOverview, setIsOverview] = useState(false) // Default to false since we're on profile page
  
  // Use hook to fetch patient profile data and generate medical ID
  const { profile, isLoading, error } = usePatientProfile()
  // Use default hospital code if none is provided in the profile
  const hospitalCode = profile?.hospitalCode || DEFAULT_HOSPITAL.id
  
  // Always use the exact same medical ID that's shown on the dashboard
  const [medicalID, setMedicalID] = useState("")
  const [qrCodeValue, setQrCodeValue] = useState("")
  
  // Load profile image and medical ID from localStorage when component mounts
  useEffect(() => {
    // Try to get patient data from localStorage
    const loadPatientData = () => {
      try {
        // First try to get the medical ID that matches the dashboard exactly
        // Dashboard uses profile.patientId || profile.medicalNumber || profile.id
        const dashboardMedicalID = profile?.patientId || profile?.medicalNumber || profile?.id || "";
        
        // If we have a medical ID from the dashboard, use that as the source of truth
        if (dashboardMedicalID) {
          setMedicalID(dashboardMedicalID);
          // Store this ID in localStorage for consistency across the app
          localStorage.setItem('medicalNumber', dashboardMedicalID);
          
          // Generate QR code value from the dashboard medical ID
          const qrData = JSON.stringify({
            medicalId: dashboardMedicalID,
            hospitalCode: hospitalCode,
            timestamp: new Date().toISOString()
          });
          setQrCodeValue(qrData);
        } 
        // Fall back to localStorage if needed
        else {
          const storedMedicalNumber = localStorage.getItem('medicalNumber');
          if (storedMedicalNumber) {
            setMedicalID(storedMedicalNumber);
            // Generate QR code value
            const qrData = JSON.stringify({
              medicalId: storedMedicalNumber,
              hospitalCode: hospitalCode,
              timestamp: new Date().toISOString()
            });
            setQrCodeValue(qrData);
          }
        }
        
        // Next try to get profile image
        // First check if we have one from onboarding
        const registrationData = localStorage.getItem('patientRegistrationData');
        if (registrationData) {
          const parsedData = JSON.parse(registrationData);
          if (parsedData.photo) {
            setProfileImage(parsedData.photo);
            // Store the photo in localStorage for consistency
            localStorage.setItem('patientProfilePhoto', parsedData.photo);
          }
        } else {
          // Fallback to direct photo storage
          const storedPhoto = localStorage.getItem('patientProfilePhoto');
          if (storedPhoto) {
            setProfileImage(storedPhoto);
          }
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    };
    
    loadPatientData();
  }, [profile, hospitalCode]);

  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    // Set overview mode to true ONLY when navigating to dashboard
    setIsOverview(page === "dashboard");
    
    if (page === "profile") {
      setCurrentPage("profile")
    } else {
      router.push(`/patient/${page}`)
    }
  }


  // Get patient name from profile data
  const patientName = profile?.name || "";
  
  // Prepare profile data to pass to sidebar
  const profileDataForSidebar = {
    name: patientName,
    medicalNumber: medicalID || "",
    profileImage: profileImage || undefined, // Convert null to undefined for TypeScript
  };
  
  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Profile" }]}
      hideProfileHeader={isOverview} // Show in sidebar when NOT on overview
      profileData={profileDataForSidebar}
    >
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Spinner className="w-10 h-10 mb-2" />
              <p className="text-gray-500">Loading patient profile...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-lg border border-red-200 bg-red-50">
            <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : profile ? (
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
                      <QRCode 
                        value={qrCodeValue || `patient-id:${medicalID || profile?.medicalNumber || 'NA'}`} 
                        size={130} 
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                    <div className="flex-grow space-y-4">
                      <div className="flex items-center gap-4">
                        {/* Add the Avatar component to display the patient's photo */}
                        <Avatar className="h-20 w-20 ring-4 ring-blue-50 shadow-md border border-blue-100">
                          <AvatarImage 
                            src={profileImage || "/placeholder.svg?height=80&width=80"} 
                            alt={profile?.name || "Patient"} 
                          />
                          <AvatarFallback className="bg-blue-600 text-white text-lg">
                            {profile?.name?.substring(0, 2).toUpperCase() || "P"}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{profile?.name}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Age: {profile?.age}</span>
                            <span>•</span>
                            <span>{profile?.gender}</span>
                            <span>•</span>
                            <span>Blood Type: {profile?.bloodType}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-gray-500">Medical Number:</span>{" "}
                            <span className="font-medium">{medicalID || profile?.patientId || profile?.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="gap-1">
                      <Printer className="h-4 w-4" />
                      <span>Print ID Card</span>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Emergency Contacts & Insurance */}
              <div className="lg:col-span-1 space-y-6">
                {/* Emergency Contacts */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-indigo-500" />
                      <CardTitle>Insurance Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Provider</label>
                        <div className="text-gray-700">{profile?.insurance?.provider}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Policy Number</label>
                        <div className="text-gray-700">{profile?.insurance?.policyNumber}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Group Number</label>
                        <div className="text-xs text-gray-500">Medical Number: {medicalID || profile?.medicalNumber || "N/A"}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                        <div className="text-gray-700">{profile?.insurance?.expirationDate}</div>
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
                        <p className="font-medium">{profile?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="font-medium">{profile?.dob}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender</label>
                        <p className="font-medium">{profile?.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Age</label>
                        <p className="font-medium">{profile?.age}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Height</label>
                        <p className="font-medium">{profile?.height}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Weight</label>
                        <p className="font-medium">{profile?.weight}</p>
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
                        <p className="font-medium">{profile?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="font-medium">{profile?.phone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Home Address</label>
                        <p className="font-medium">{profile?.address}</p>
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
                      {profile?.allergies && profile.allergies.length > 0 ? profile.allergies.map((allergy, index) => (
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
                      )) : <p>No allergies found.</p>}
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
                      {profile?.conditions && profile.conditions.length > 0 ? profile.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center">
                          <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                          <div className="font-medium">{condition}</div>
                        </div>
                      )) : <p>No medical conditions found.</p>}
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
                      {profile?.medications && profile.medications.length > 0 ? profile.medications.map((med, index) => (
                        <div key={index} className="flex items-start justify-between pb-3 border-b last:border-b-0 last:pb-0">
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-sm text-gray-500">{med.dosage}</p>
                          </div>
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            {med.frequency}
                          </Badge>
                        </div>
                      )) : <p>No medications found.</p>}
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
        ) : null}
      </div>
    </DashboardLayout>
  )
}