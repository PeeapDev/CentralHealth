"use client"

import { useState, useEffect, useRef } from 'react'
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
  Video,
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
import QRCode from "react-qr-code"
import { DoctorCarousel } from "@/components/patients/doctor-carousel"
import { mockDoctors, getSpecialistDoctors, getDoctorsByHospital, Doctor } from "@/lib/doctor-data"
import { useToast } from "@/components/ui/use-toast"

// Define our patient data interface for consistency
interface PatientData {
  name: string;
  medicalNumber: string; // NHS-style 5-character alphanumeric format per hospital policy
  gender: string;
  age: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  onboardingCompleted: boolean;
  admittedDate: string;
  attendingDoctor: string;
  room: string;
  vitalSigns: {
    temperature: string;
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    height: string;
    weight: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    group: string;
    expirationDate: string;
  };
  allergies: Array<{ name: string; severity: string }>;
  conditions: string[];
  medications: Array<{ name: string; dosage: string; frequency: string }>;
  appointments?: any[]; // Make optional since it might be loaded later
}

export default function PatientDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const notification = searchParams?.get('notification')
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isOverview, setIsOverview] = useState(true) // Always true on dashboard
  const [showSessionWarning, setShowSessionWarning] = useState(notification === 'session_warning')
  
  // Use our hospital context to avoid "hospital not found" errors
  const { hospital } = useHospitalContext()
  const { toast } = useToast()
  
  // Define more granular loading states for better UX
  const [isLoading, setIsLoading] = useState(true)
  const [isCriticalDataLoaded, setIsCriticalDataLoaded] = useState(false)
  const [isProfilePhotoLoading, setIsProfilePhotoLoading] = useState(true)
  const [isSecondaryDataLoading, setIsSecondaryDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Authentication verification ref
  const isAuthVerified = useRef(false)
  
  // Create an AbortController ref for API fetch requests
  const abortController = useRef(new AbortController())
  
  // SECURITY: Client-side authentication guard
  useEffect(() => {
    // Check for any valid authentication token per CentralHealth standards
    const hasToken = !!localStorage.getItem('authToken');
    const hasSession = !!localStorage.getItem('patient_session');
    const hasMedicalNumber = !!localStorage.getItem('medicalNumber');
    const hasPatientId = !!localStorage.getItem('patientId');
    
    // Security audit logging
    console.log(`🔒 Authentication check: Token=${hasToken}, Session=${hasSession}, MRN=${hasMedicalNumber}, ID=${hasPatientId}`);
    
    // Verify authentication according to CentralHealth security standards
    if (!hasToken && !hasSession && !hasMedicalNumber && !hasPatientId) {
      console.log('⛔ SECURITY ALERT: Unauthorized dashboard access attempt');
      
      // Redirect to login page with return URL
      const currentPath = window.location.pathname;
      window.location.href = `/auth/patient-login?redirect=${encodeURIComponent(currentPath)}&error=auth_required`;
      return;
    }
    
    // Mark authentication as verified if any valid token exists
    isAuthVerified.current = true;
    console.log('✅ Dashboard authentication verified');
  }, [])
  
  // Doctor-related states
  const [hospitalDoctors, setHospitalDoctors] = useState<Doctor[]>([])
  const [specialistDoctors, setSpecialistDoctors] = useState<{[key: string]: Doctor[]}>({})
  const [isAppointmentPending, setIsAppointmentPending] = useState(false)
  
  // Fetch patient profile data with immediate error handling
  // Set session persistence to true to maintain authentication across page loads
  // Explicitly request profile photo loading
  const { 
    profile, 
    error: profileError, 
    isLoaded,
    profilePhotoUrl, // Get the profile photo URL directly from the hook
    isProfilePhotoLoading: hookProfilePhotoLoading
  } = usePatientProfile({ 
    persistSession: true,
    loadProfilePhoto: true // Ensure profile photo is loaded
  })
  
  // Load patient data from profile and localStorage
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  
  // Effect to sync profile photo URL from the hook to the dashboard state
  useEffect(() => {
    if (profilePhotoUrl) {
      console.log('Received profile photo from hook:', profilePhotoUrl.substring(0, 30) + '...');
      setProfilePhoto(profilePhotoUrl);
      setIsProfilePhotoLoading(false);
      // Also persist in localStorage for faster loading on future visits
      localStorage.setItem('patientProfilePhoto', profilePhotoUrl);
    } else if (!profilePhoto) {
      // If no photo from hook and we don't have one set yet, try localStorage
      const cachedPhoto = localStorage.getItem('patientProfilePhoto');
      if (cachedPhoto) {
        console.log('Using cached profile photo from localStorage');
        setProfilePhoto(cachedPhoto);
        setIsProfilePhotoLoading(false);
      }
    }
  }, [profilePhotoUrl, profilePhoto])
  const [patientData, setPatientData] = useState<PatientData>({
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
    room: "",
    // All vital signs moved under the vitalSigns object
    vitalSigns: {
      temperature: "Not recorded",
      bloodPressure: "Not recorded",
      heartRate: "Not recorded", 
      respiratoryRate: "Not recorded",
      height: "Not recorded",
      weight: "Not recorded"
    },
    insurance: {
      provider: "Unknown",
      policyNumber: "",
      group: "",
      expirationDate: ""
    },
    allergies: [] as Array<{ name: string; severity: string }>,
    conditions: [] as string[],
    medications: [] as Array<{ name: string; dosage: string; frequency: string }>,
    appointments: [] // Add appointments array to match interface
  })
  
  // Check if the user is logged in by checking localStorage
  useEffect(() => {
    const checkLoginStatus = () => {
      // Check for login token in localStorage
      const hasToken = localStorage.getItem('authToken') || 
                      localStorage.getItem('medicalNumber') || 
                      localStorage.getItem('patientId');
      
      // If we have a token or identifier, we can show the UI immediately
      if (hasToken) {
        setIsCriticalDataLoaded(true);
        // Short timeout to allow for layout calculations
        setTimeout(() => setIsLoading(false), 300);
      }
    };
    
    // Run login check immediately
    checkLoginStatus();
  }, []);
  
  // Performance tracking and progressive rendering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Mark the start time when component mounts
      const startTime = performance.now();
      
      // Always set critical data loaded after profile is loaded
      if (profile) {
        setIsCriticalDataLoaded(true);
        setIsLoading(false);
        
        // Track rendering performance for monitoring
        if (window.performance && window.performance.mark) {
          window.performance.mark('dashboard-first-render');
        }
      }
      
      // Phase 3: Guaranteed loading exit - ensure dashboard NEVER stays in loading state too long
      const maxLoadingTime = 3000; // Reduced from 5s to 3s
      const loadingTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn('Dashboard loading timeout reached, forcing exit from loading state');
          setIsLoading(false);
          
          // If we don't have critical data yet, at least set it to true to show something
          if (!isCriticalDataLoaded) {
            setIsCriticalDataLoaded(true);
            
            // Log this as an error for monitoring
            console.error('Critical data failed to load before timeout');
          }
        }
        
        // Measure and log total render time for performance monitoring
        const renderTime = performance.now() - startTime;
        console.log(`Dashboard render time: ${Math.round(renderTime)}ms`);
      }, maxLoadingTime);
      
      // Add a cleanup function that logs the total render time
      return () => {
        clearTimeout(loadingTimeout);
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
        
        // Optional: track this metric for analytics
        if (loadTime > 2000) {
          // Could send to analytics service if it's slow
          console.warn('Dashboard load time exceeded 2 seconds');
        }
      };
    }
  }, [isLoading, isCriticalDataLoaded]);
  
  // Extract the medical ID from the profile following CentralHealth policy
  // Medical IDs must follow NHS-style 5-character alphanumeric format and be stored as MRN
  const medicalNumber = profile?.mrn || profile?.medicalNumber || profile?.id || "unknown";

  // Clean up all requests on unmount
  useEffect(() => {
    return () => {
      abortController.current.abort();
    };
  }, []);
  
  // Load available doctors
  useEffect(() => {
    if (hospital) {
      // Get doctors from current hospital
      const hospitalDocs = getDoctorsByHospital(hospital.toString());
      setHospitalDoctors(hospitalDocs);
      
      // Get doctors by specialty
      const specialists = getSpecialistDoctors();
      setSpecialistDoctors(specialists);
    }
  }, [hospital]);
  
  // Handle booking appointment or consultation
  const handleAppointmentRequest = async (doctorId: string, appointmentType: 'in-person' | 'consultation') => {
    try {
      setIsAppointmentPending(true);
      
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a successful booking with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show a success message
      toast({
        title: appointmentType === 'in-person' ? "Appointment Booked" : "Consultation Scheduled",
        description: `Your ${appointmentType} has been scheduled successfully. You'll receive a confirmation email shortly.`,
        variant: "default",
      });
      
      // In a real implementation, we would refresh the appointments list here
    } catch (err) {
      console.error('Error booking appointment:', err);
      toast({
        title: "Booking Failed",
        description: "There was an error scheduling your appointment. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAppointmentPending(false);
    }
  };

  // Debug function to help diagnose issues and provide fallback behavior
  const debugProfileInfo = (profile: any) => {
    if (!profile) {
      console.warn('No profile data available');
      // Set a dummy profile data to avoid crashes if profile is completely missing
      setIsCriticalDataLoaded(true);
      setIsLoading(false);
      setPatientData(prev => ({
        ...prev,
        name: "Patient data unavailable",
        medicalNumber: "---" // Never use mock medical IDs per CentralHealth rules
      }));
      return;
    }
    console.log('Profile debug - Available IDs:', {
      id: profile.id,
      patientId: profile.patientId, 
      medicalNumber: profile.medicalNumber,
      mrn: (profile as any).mrn // Access the standard MRN field as defined in CentralHealth rules
    });
  };
  
  // Always include all hooks in the same order - this is CRITICAL for React
  // Early safeguard to handle missing profile data
  useEffect(() => {
    // Check profile data early and ensure we always exit loading state
    debugProfileInfo(profile);
    
    // Guaranteed exit from loading state after 3 seconds regardless of what happens
    const guaranteedTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Guaranteed exit from loading state due to timeout');
        setIsLoading(false);
        setIsCriticalDataLoaded(true);
      }
    }, 3000);
    
    return () => clearTimeout(guaranteedTimeout);
  }, [profile]);
  
  // Helper function to process data from localStorage
  const processLocalStorage = () => {
    try {
      const registrationData = localStorage.getItem('patientRegistrationData');
      if (registrationData) {
        try {
          const parsedData = JSON.parse(registrationData);
          const updates: Partial<PatientData> = {};
          const currentPatientData = patientData;

          if (currentPatientData.name === "Loading..." && parsedData.fullName) updates.name = parsedData.fullName;
          if (!currentPatientData.medicalNumber && parsedData.medicalNumber) updates.medicalNumber = parsedData.medicalNumber;
          if (currentPatientData.gender === "unknown" && parsedData.gender) updates.gender = parsedData.gender;
          if (!currentPatientData.phone && parsedData.phone) updates.phone = parsedData.phone;
          if (!currentPatientData.email && parsedData.email) updates.email = parsedData.email;
          if (currentPatientData.address === "Loading..." && parsedData.address) updates.address = parsedData.address;
          if (currentPatientData.bloodType === "--" && parsedData.bloodType) updates.bloodType = parsedData.bloodType;

          if (!profilePhoto && parsedData.photo) {
            setProfilePhoto(parsedData.photo);
            localStorage.setItem('patientProfilePhoto', parsedData.photo);
          }

          if (Object.keys(updates).length > 0) {
            setPatientData(prev => ({ ...prev, ...updates }));
          }
        } catch (parseError) {
          console.error('Failed to parse registration data:', parseError);
        }
      }

      const fallbackUpdates: Partial<PatientData> = {};
      const currentData = patientData;

      if (currentData.name === "Loading...") {
        const storedName = localStorage.getItem('currentPatientName');
        if (storedName) fallbackUpdates.name = storedName;
      }
      if (!currentData.medicalNumber || currentData.medicalNumber === "--") {
        const storedMedicalNumber = localStorage.getItem('medicalNumber');
        if (storedMedicalNumber) fallbackUpdates.medicalNumber = storedMedicalNumber;
      }
      if (!currentData.email) {
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) fallbackUpdates.email = storedEmail;
      }

      if (Object.keys(fallbackUpdates).length > 0) {
        setPatientData(prev => ({ ...prev, ...fallbackUpdates }));
      }
    } catch (err) {
      console.error('Error processing localStorage data:', err);
    }
  };

  // Helper function to process the core patient data from the profile
  const processCorePatientData = (startTime: number) => {
    const initialData: PatientData = {
        name: "Loading...",
        medicalNumber: "",
        gender: "unknown",
        age: "",
        dateOfBirth: "",
        phone: "",
        email: "",
        address: "",
        bloodType: "",
        onboardingCompleted: false,
        admittedDate: "",
        attendingDoctor: "",
        room: "",
        vitalSigns: {
          temperature: "Not recorded",
          bloodPressure: "Not recorded",
          heartRate: "Not recorded",
          respiratoryRate: "Not recorded",
          height: "Not recorded",
          weight: "Not recorded"
        },
        insurance: {
          provider: "Unknown",
          policyNumber: "",
          group: "",
          expirationDate: ""
        },
        allergies: [],
        conditions: [],
        medications: [],
        appointments: []
      };

    try {
      setPatientData(initialData);
      setIsCriticalDataLoaded(true);

      if (profile) {
        const coreData = { ...initialData };
        coreData.name = profile.name || initialData.name;
        coreData.medicalNumber = profile.displayMedicalNumber || profile.medicalNumber || (profile as any).mrn || profile.id || initialData.medicalNumber;
        coreData.gender = profile.gender || initialData.gender;

        if (profile.birthDate || profile.dateOfBirth) {
          const dob = new Date(profile.birthDate || profile.dateOfBirth || '');
          if (dob && !isNaN(dob.getTime())) {
            const now = new Date();
            coreData.age = String(now.getFullYear() - dob.getFullYear());
            coreData.dateOfBirth = dob.toLocaleDateString();
          }
        }

        coreData.phone = profile.phone || initialData.phone;
        coreData.email = profile.email || initialData.email;
        coreData.address = profile.address || initialData.address;
        coreData.bloodType = profile.bloodType || initialData.bloodType;
        coreData.onboardingCompleted = profile.onboardingCompleted || initialData.onboardingCompleted;
        coreData.admittedDate = profile.admittedDate || initialData.admittedDate;
        coreData.attendingDoctor = profile.attendingDoctor || initialData.attendingDoctor;
        coreData.room = profile.room || initialData.room;

        coreData.vitalSigns = {
          ...initialData.vitalSigns,
          temperature: (profile as any).temperature || initialData.vitalSigns.temperature,
          bloodPressure: (profile as any).bloodPressure || initialData.vitalSigns.bloodPressure,
          heartRate: (profile as any).heartRate || initialData.vitalSigns.heartRate,
          respiratoryRate: (profile as any).respiratoryRate || initialData.vitalSigns.respiratoryRate,
          height: (profile as any).height || initialData.vitalSigns.height,
          weight: (profile as any).weight || initialData.vitalSigns.weight
        };

        setPatientData(coreData);

        if (profile.insurance) {
          setPatientData(prev => ({
            ...prev,
            insurance: {
              provider: profile.insurance.provider || prev.insurance.provider,
              policyNumber: profile.insurance.policyNumber || prev.insurance.policyNumber,
              group: profile.insurance.group || prev.insurance.group,
              expirationDate: profile.insurance.expirationDate || prev.insurance.expirationDate
            }
          }));
        }

        setTimeout(() => {
          setIsSecondaryDataLoading(true);
          const secondaryUpdates: Partial<PatientData> = {};
          if (profile.allergies?.length) secondaryUpdates.allergies = profile.allergies.map((name: string) => ({ name, severity: 'Unknown' }));
          if (profile.conditions?.length) secondaryUpdates.conditions = profile.conditions;
          if (profile.medications?.length) secondaryUpdates.medications = profile.medications.map((name: string) => ({ name, dosage: 'N/A', frequency: 'N/A' }));
          if (Object.keys(secondaryUpdates).length > 0) {
            setPatientData(prev => ({ ...prev, ...secondaryUpdates }));
          }
          setIsSecondaryDataLoading(false);
        }, 100);
      }

      setTimeout(processLocalStorage, 200);
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError('Failed to load patient data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
      setIsCriticalDataLoaded(true);
      console.log('Performance: Patient dashboard loaded in', performance.now() - startTime, 'ms');
    }
  };

  useEffect(() => {
    // Set default photo immediately for better UX
    const defaultPhoto = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg==';
    if (!profilePhoto) {
      setProfilePhoto(defaultPhoto);
    }
    setIsProfilePhotoLoading(false);

    // Start the data loading process
    const startTime = performance.now();
    console.log('Starting patient dashboard data loading...');
    processCorePatientData(startTime);
  }, [profile]); // Rerun when profile data changes

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
              <Spinner className="w-10 h-10" />
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

  // To ensure proper rendering, display the full dashboard content if ANY of these conditions are met:
  // 1. We have a valid profile object
  // 2. We have valid medical ID in localStorage indicating prior authentication
  // 3. We're still loading (show skeleton UI but still render full dashboard structure)
  const medicalId = typeof window !== 'undefined' ? 
    localStorage.getItem('medicalNumber') || localStorage.getItem('mrn') || localStorage.getItem('patientId') : null;

  const hasValidAuthentication = !!profile || !!medicalId || isLoading;
    
  // Only show login screen as a last resort when we're sure the user is not authenticated
  // This prevents the flash of login UI during normal loading
  if (!hasValidAuthentication && error === 'Authentication required') {
    return (
      <DashboardLayout 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <div className="max-w-7xl mx-auto py-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to view your patient dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>You need to authenticate to access your medical information.</p>
                <Button 
                  onClick={() => router.push('/login')}
                  className="w-full sm:w-auto"
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Show skeleton UI for doctor carousel */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Available Doctors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 animate-pulse">
                  <CardContent className="p-4 flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get the exact medical ID shown in the dashboard
  const dashboardMedicalID = profile?.patientId || profile?.medicalNumber || profile?.id || "";
  
  // Store this exact ID in localStorage for consistency across pages
  if (typeof window !== 'undefined' && dashboardMedicalID) {
    localStorage.setItem('medicalNumber', dashboardMedicalID);
  }
  
  // Prepare profile data to pass to sidebar using ONLY the dashboard medical ID
  const profileDataForSidebar = {
    name: profile ? profile.name || "" : "", 
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
                {/* Always render AvatarImage with proper error handling */}
                <AvatarImage 
                  src={profilePhoto || "/placeholder.svg?height=64&width=64"} 
                  alt={patientData.name || "Patient"}
                  className="object-cover"
                  onLoad={() => {
                    console.log('Profile photo successfully loaded in avatar');
                  }}
                  onError={(e) => {
                    console.error("Failed to load avatar image", e);
                    // Force set fallback on error
                    e.currentTarget.style.display = 'none';
                    
                    // Try to reload with default avatar if we have a bad URL
                    if (profilePhoto && !profilePhoto.startsWith('data:')) {
                      console.log('Switching to default avatar due to image load error');
                      const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg==';
                      setProfilePhoto(defaultAvatar);
                    }
                  }}
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
            {/* Medical ID QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                {patientData.medicalNumber ? (
                  <QRCode 
                    value={patientData.medicalNumber}
                    size={80}
                    style={{ maxHeight: "80px", maxWidth: "80px" }}
                    level="H"
                  />
                ) : (
                  <div className="h-[80px] w-[80px] flex items-center justify-center text-xs text-gray-400">No Medical ID</div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{patientData.medicalNumber || "Medical ID Pending"}</p>
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


        
        {/* Available Doctors Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-5">Available Doctors</h2>
          
          {/* Combined doctors in a single horizontal landscape line */}
          <DoctorCarousel 
            title=""
            doctors={[
              // Create a unique list of doctors with guaranteed unique IDs
              // Start with a fresh, unique set of the original doctors
              ...(specialistDoctors.cardiologists || []).map((doctor, index) => ({
                ...doctor,
                id: `cardio-${doctor.id}-${index}` // Ensure uniqueness with index and category prefix
              })),
              
              ...(specialistDoctors.pediatricians || []).map((doctor, index) => ({
                ...doctor,
                id: `pedia-${doctor.id}-${index}` // Ensure uniqueness with index and category prefix
              })),
              
              ...mockDoctors.map((doctor, index) => ({
                ...doctor,
                id: `all-${doctor.id}-${index}` // Ensure uniqueness with index and category prefix
              })),
              
              ...hospitalDoctors.map((doctor, index) => ({
                ...doctor,
                id: `hosp-${doctor.id}-${index}` // Ensure uniqueness with index and category prefix
              })),
              
              // Add more duplicated doctors for a truly long carousel
              ...mockDoctors.map((doctor, index) => ({
                ...doctor,
                id: `extra-${doctor.id}-${index}` // Ensure uniqueness for duplicates
              })),
              
              // One more set of duplicates for very long scrolling
              ...mockDoctors.map((doctor, index) => ({
                ...doctor,
                id: `more-${doctor.id}-${index}` // Different prefix for second set of duplicates
              }))
            ]}
            onAppointmentRequest={handleAppointmentRequest}
            singleLine={true}
          />
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
                        You attempted to register a new patient while already logged in. 
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

            {/* Doctor Carousel Section - replaces Health Alerts */}
            <Card className="overflow-hidden mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Stethoscope className="mr-2 h-5 w-5 text-blue-500" />
                    <CardTitle>Available Doctors</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/patient/doctors')}>View All</Button>
                </div>
                <CardDescription>Doctors available for appointments and consultations</CardDescription>
              </CardHeader>
              <CardContent className="pb-2 px-2 md:px-6">
                {/* Doctor Carousel with single line layout */}
                {hospitalDoctors.length > 0 ? (
                  <DoctorCarousel
                    title=""
                    doctors={hospitalDoctors}
                    onAppointmentRequest={handleAppointmentRequest}
                    singleLine={true}
                  />
                ) : (
                  <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Spinner className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-gray-500">Loading available doctors...</p>
                    </div>
                  </div>
                )}
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
            
            {/* End of right column content */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
