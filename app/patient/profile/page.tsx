"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from "next/navigation"
import { MedicalIDGenerator, MedicalIDFormatter } from "@/utils/medical-id"
import { ChevronRight, Heart, User, FileText, Phone, Mail, MapPin, Calendar, AlertCircle, Activity, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { PatientQRDisplay } from "@/components/patients/patient-qr-display"
import { format } from "date-fns"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import QRCode from "react-qr-code"

export default function PatientProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const notification = searchParams?.get('notification')
  const currentPage = searchParams?.get('section') || 'profile';
  const isOverview = currentPage === 'overview';
  
  // Function to handle navigation between different profile sections
  const handleNavigation = useCallback((page: string) => {
    router.push(`/patient/profile?section=${page}`)
  }, [router])
  const [showSessionWarning, setShowSessionWarning] = useState(notification === 'session_warning')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Authentication verification ref
  const isAuthVerified = useRef(false)
  
  // Profile photo loading state
  const [isProfilePhotoLoading, setIsProfilePhotoLoading] = useState(true)
  
  const { toast } = useToast()
  
  // Define extended patient profile type that includes all properties we access
  type ExtendedPatientProfile = {
    firstName?: string;
    lastName?: string;
    mrn?: string;
    medicalNumber?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    address?: string;
    // Add medical data fields that may not be in the basic PatientProfile type
    conditions?: Array<{name?: string; status?: string} | string>;
    medications?: Array<{name?: string; dosage?: string; frequency?: string} | string>;
    medicalHistory?: Array<{
      title?: string;
      procedure?: string;
      date?: string;
      description?: string;
      provider?: string;
      notes?: string;
    }>;
  }

  // Fetch profile data with persistence
  const { 
    profile: baseProfile, 
    error: profileError, 
    refreshProfile,
    profilePhotoUrl,
    isProfilePhotoLoading: hookProfilePhotoLoading
  } = usePatientProfile({ 
    persistSession: true,
    loadProfilePhoto: true
  })
  
  // Type assertion to allow access to all extended properties
  const profile = baseProfile as ExtendedPatientProfile | null;
  
  // Effect to sync profile photo URL from the hook
  useEffect(() => {
    if (profilePhotoUrl) {
      console.log('Received profile photo from hook:', profilePhotoUrl.substring(0, 30) + '...');
      setProfilePhoto(profilePhotoUrl);
      setIsProfilePhotoLoading(false);
      // Persist in localStorage for faster loading on future visits
      localStorage.setItem('patientProfilePhoto', profilePhotoUrl);
    } else {
      // If no photo from hook, try localStorage
      const cachedPhoto = localStorage.getItem('patientProfilePhoto');
      if (cachedPhoto) {
        console.log('Using cached profile photo from localStorage');
        setProfilePhoto(cachedPhoto);
        setIsProfilePhotoLoading(false);
      } else {
        // Set default avatar if no profile photo is available
        setProfilePhoto('/images/default-avatar.png');
        setIsProfilePhotoLoading(false);
      }
    }
  }, [profilePhotoUrl]);
  
  // SECURITY: Client-side authentication guard
  useEffect(() => {
    // Check for any valid authentication token per CentralHealth standards
    const hasToken = !!localStorage.getItem('authToken');
    const hasSession = !!localStorage.getItem('patient_session');
    const hasPatientId = !!localStorage.getItem('patientId');
    
    // Security audit logging
    console.log(`🔒 Authentication check: Token=${hasToken}, Session=${hasSession}, ID=${hasPatientId}`);
    
    // Verify authentication according to CentralHealth security standards
    if (!hasToken && !hasSession && !hasPatientId) {
      console.log('⛔ SECURITY ALERT: Unauthorized profile access attempt');
      
      // Redirect to login page with return URL
      const currentPath = window.location.pathname;
      window.location.href = `/auth/patient-login?redirect=${encodeURIComponent(currentPath)}&error=auth_required`;
      return;
    }
    
    // Mark authentication as verified if any valid token exists
    isAuthVerified.current = true;
    console.log('✅ Profile authentication verified');
  }, []);
  
  // Extract the medical ID from the profile following CentralHealth policy
  // Medical IDs must follow NHS-style 5-character alphanumeric format and be stored as MRN
  // Must NEVER show placeholder/generated IDs as per CentralHealth policy - only show actual MRN
  const medicalNumber = (profile?.mrn && /^[A-Z0-9]{5}$/i.test(profile.mrn)) ? profile.mrn : "";
    // Prepare patient data for sidebar with guaranteed medical ID
    const profileDataForSidebar = {
      name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : "", 
      medicalNumber: medicalNumber, // Use exactly the same ID as shown on dashboard
      profileImage: profilePhoto || undefined,
    };
    
    // Store the current patient name in localStorage to ensure consistency across pages
    if (profile?.firstName || profile?.lastName) {
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      localStorage.setItem('currentPatientName', fullName);
    }
    
    // Make sure profile photo is always stored in localStorage
    if (profilePhoto) {
      localStorage.setItem('patientProfilePhoto', profilePhoto);
    }
  
    return (
      <DashboardLayout 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
        hideProfileHeader={isOverview}
        profileData={profileDataForSidebar}
        breadcrumbs={[{ label: "Profile" }]}
      >
        {showSessionWarning && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Warning</AlertTitle>
            <AlertDescription>
              Your session was restored from a previous visit. Patient data may be outdated.
              <Button variant="link" className="p-0 ml-2 h-auto" onClick={() => refreshProfile()}>
                Refresh Data
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Information */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Your personal and medical details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={profilePhoto || '/images/default-avatar.png'} alt="Profile" />
                  <AvatarFallback>
                    {isProfilePhotoLoading ? <Spinner /> : <User className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    {profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : "Loading..."}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Medical ID: {medicalNumber}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'PPP') : 'Not available'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.phone || 'Not available'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.email || 'Not available'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.address || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <PatientQRDisplay 
                  medicalNumber={medicalNumber} 
                  firstName={profile?.firstName || ''}
                  lastName={profile?.lastName || ''}
                  size={180} 
                  className="mx-auto" 
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Your unique NHS-style medical ID
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Medical Information */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="conditions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="conditions">
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Conditions</CardTitle>
                    <CardDescription>
                      Your active and resolved medical conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile && profile.conditions && profile.conditions.length > 0 ? (
                        profile.conditions.map((condition: any, index: number) => {
                          // Explicitly type check and cast to prevent TypeScript errors
                          const conditionName = typeof condition === 'string' ? condition : (condition?.name || 'Unknown Condition');
                          const conditionStatus = typeof condition === 'string' ? null : condition?.status;
                          
                          return (
                            <div key={`condition-${index}`} className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{conditionName}</p>
                                {conditionStatus && (
                                  <Badge variant={conditionStatus === 'active' ? "destructive" : "outline"}>
                                    {conditionStatus.charAt(0).toUpperCase() + conditionStatus.slice(1)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground">No conditions recorded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="medications">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Medications</CardTitle>
                    <CardDescription>
                      Your prescribed medications and supplements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile && profile.medications && profile.medications.length > 0 ? (
                        profile.medications.map((med: any, index: number) => {
                          // Handle both string and object formats
                          const medName = typeof med === 'string' 
                            ? med 
                            : (med?.name || 'Unknown Medication');
                          const medDosage = typeof med === 'string' 
                            ? '' 
                            : (med?.dosage || '');
                          const medFrequency = typeof med === 'string' 
                            ? '' 
                            : (med?.frequency || '');
                          
                          return (
                            <div key={`medication-${index}`} className="flex flex-col space-y-2 pb-4 border-b last:border-0 dark:border-gray-700">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{medName}</h4>
                                {medDosage && <Badge variant="outline">{medDosage}</Badge>}
                              </div>
                              {medFrequency && (
                                <p className="text-sm text-muted-foreground">
                                  Take {medFrequency}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground">No medications recorded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Medical History</CardTitle>
                    <CardDescription>
                      Records of your past medical procedures and visits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {profile && profile.medicalHistory && profile.medicalHistory.length > 0 ? (
                        profile.medicalHistory.map((record: any, index: number) => (
                          <AccordionItem key={`history-${index}`} value={`item-${index}`}>
                            <AccordionTrigger>
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="font-medium">
                                  {record.title || record.procedure || 'Medical Event'}
                                </div>
                                <Badge variant="outline" className="ml-auto mr-4">
                                  {record.date ? format(new Date(record.date), 'MMM d, yyyy') : 'No date'}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {record.description && (
                                  <p className="text-sm">{record.description}</p>
                                )}
                                {record.provider && (
                                  <p className="text-sm text-muted-foreground">
                                    Provider: {record.provider}
                                  </p>
                                )}
                                {record.notes && (
                                  <div className="text-sm">
                                    <p className="font-medium">Notes:</p>
                                    <p>{record.notes}</p>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <p className="text-muted-foreground py-2">No medical history recorded</p>
                      )}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DashboardLayout>
    )
  }