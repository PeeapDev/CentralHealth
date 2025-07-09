"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from "@/components/ui/use-toast"
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { DEFAULT_HOSPITAL } from "@/lib/hospital-context"
import { useHospitalContext } from "@/hooks/use-hospital-context"
import { format } from 'date-fns'

// Dynamically import the dashboard layout
const DashboardLayout = dynamic(() => import('@/components/patients/dashboard/dashboard-layout'), {
  loading: () => <FallbackLayout currentPage="dashboard" onNavigate={() => {}} breadcrumbs={[]} hideProfileHeader={false} />,
  ssr: false,
})

// Fallback to a basic layout if the import fails
interface FallbackLayoutProps {
  children?: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  breadcrumbs?: Array<{label: string; href?: string}>;
  hideProfileHeader?: boolean;
}

function FallbackLayout({ children, currentPage, onNavigate, breadcrumbs = [], hideProfileHeader = false }: FallbackLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            {/* Sidebar placeholder */}
            <div className="bg-white p-4 rounded-lg shadow-sm"></div>
          </div>
          <div className="flex-grow">{children}</div>
        </div>
      </div>
    </div>
  )
}

// Define Doctor type to avoid duplication
type Doctor = {
  id: string;
  name: string;
  specialty: string;
  availability?: string[];
  hospital?: string;
  rating?: number;
  photoUrl?: string;
  available?: boolean;
}

// Utility function to get doctors by hospital
function getDoctorsByHospital(hospitalName: string): Doctor[] {
  // In a real app, this would fetch from an API
  const allDoctors: Doctor[] = [
    {
      id: "doc1",
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      hospital: "Central Hospital",
      rating: 4.8,
      available: true,
      photoUrl: "/images/doctors/doctor-1.jpg"
    },
    {
      id: "doc2",
      name: "Dr. Michael Chen",
      specialty: "Neurology",
      hospital: "Central Hospital",
      rating: 4.9,
      available: false,
      photoUrl: "/images/doctors/doctor-2.jpg"
    },
    {
      id: "doc3",
      name: "Dr. Emily Rodriguez",
      specialty: "Pediatrics",
      hospital: "St. Mary's Medical Center",
      rating: 4.7,
      available: true,
      photoUrl: "/images/doctors/doctor-3.jpg"
    },
    {
      id: "doc4",
      name: "Dr. David Kim",
      specialty: "Oncology",
      hospital: "Memorial Hospital",
      rating: 4.9,
      available: true,
      photoUrl: "/images/doctors/doctor-4.jpg"
    },
  ];
  
  return allDoctors.filter(doctor => doctor.hospital?.toLowerCase() === hospitalName.toLowerCase());
}

// Get diverse doctors for carousel
function getDiverseDoctors() {
  return [
    {
      id: "cardio1",
      name: "Dr. Robert Miller",
      specialty: "Cardiology",
      rating: 4.8,
      available: true,
      photoUrl: "/images/doctors/cardiologist-1.jpg"
    },
    {
      id: "cardio2",
      name: "Dr. Patricia Clark",
      specialty: "Cardiology",
      rating: 4.7,
      available: true,
      photoUrl: "/images/doctors/cardiologist-2.jpg"
    },
    {
      id: "ped1",
      name: "Dr. James Wilson",
      specialty: "Pediatrics",
      rating: 4.9,
      available: true,
      photoUrl: "/images/doctors/pediatrician-1.jpg"
    },
    {
      id: "ped2",
      name: "Dr. Linda Garcia",
      specialty: "Pediatrics",
      rating: 4.8,
      available: false,
      photoUrl: "/images/doctors/pediatrician-2.jpg"
    },
    {
      id: "neuro1",
      name: "Dr. Michael Chen",
      specialty: "Neurology",
      rating: 4.9,
      available: true,
      photoUrl: "/images/doctors/doctor-2.jpg"
    },
    {
      id: "derm1",
      name: "Dr. Sarah Johnson",
      specialty: "Dermatology",
      rating: 4.6,
      available: true,
      photoUrl: "/images/doctors/doctor-1.jpg"
    },
    {
      id: "ortho1",
      name: "Dr. David Kim",
      specialty: "Orthopedics",
      rating: 4.7,
      available: true,
      photoUrl: "/images/doctors/doctor-4.jpg"
    },
    {
      id: "onco1",
      name: "Dr. Emily Rodriguez",
      specialty: "Oncology",
      rating: 4.8,
      available: true,
      photoUrl: "/images/doctors/doctor-3.jpg"
    },
    {
      id: "psych1",
      name: "Dr. Thomas Wright",
      specialty: "Psychiatry",
      rating: 4.9,
      available: true,
      photoUrl: "/images/doctors/doctor-5.jpg"
    },
    {
      id: "gyn1",
      name: "Dr. Jessica Martinez",
      specialty: "Gynecology",
      rating: 4.7,
      available: false,
      photoUrl: "/images/doctors/doctor-6.jpg"
    }
  ];
}

// Doctor carousel component for displaying available doctors with auto-slide functionality
function DoctorCarousel({ 
  title, 
  doctors, 
  onAppointmentRequest, 
  singleLine = false,
  autoSlide = true
}: { 
  title: string;
  doctors: Doctor[];
  onAppointmentRequest: (doctorId: string, appointmentType: 'in-person' | 'consultation') => void;
  singleLine?: boolean;
  autoSlide?: boolean;
}) {
  const [visibleDoctors, setVisibleDoctors] = useState<Doctor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsToShow = 6; // Show 6 doctors at a time in the carousel
  
  // Initialize visible doctors
  useEffect(() => {
    if (doctors && doctors.length > 0) {
      // If we have fewer doctors than slots, just show them all
      if (doctors.length <= itemsToShow) {
        setVisibleDoctors(doctors);
      } else {
        // Otherwise, show the first batch
        setVisibleDoctors(doctors.slice(0, itemsToShow));
      }
    }
  }, [doctors]);
  
  // Set up auto-sliding if enabled (sliding left)
  useEffect(() => {
    if (!autoSlide || doctors.length <= itemsToShow) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % (doctors.length - itemsToShow + 1);
        setVisibleDoctors(doctors.slice(nextIndex, nextIndex + itemsToShow));
        return nextIndex;
      });
    }, 3000); // Slide every 3 seconds
    
    return () => clearInterval(interval);
  }, [autoSlide, doctors, itemsToShow]);

  if (!doctors || doctors.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 border border-purple-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
      {title && <h3 className="text-lg font-semibold mb-4 text-purple-700">{title}</h3>}
      <div className={`grid grid-flow-col auto-cols-max overflow-x-auto gap-4 pb-4 scroll-smooth`}>
        {visibleDoctors.map((doctor) => {
          // Assign different colors based on specialty
          const getCardColor = () => {
            switch(doctor.specialty.toLowerCase()) {
              case 'cardiology': return 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50';
              case 'pediatrics': return 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50';
              case 'neurology': return 'border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50';
              case 'dermatology': return 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50';
              case 'orthopedics': return 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50';
              case 'oncology': return 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50';
              case 'psychiatry': return 'border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50';
              case 'gynecology': return 'border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50';
              default: return 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50';
            }
          };
          
          return (
            <Card key={doctor.id} className={`w-48 flex-shrink-0 ${getCardColor()} shadow-sm transition-all hover:shadow-md`}>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center">
                  <Avatar className="h-16 w-16 mb-2 ring-2 ring-white ring-offset-2 ring-offset-blue-100">
                    <AvatarImage src={doctor.photoUrl || ""} alt={doctor.name} />
                    <AvatarFallback className="bg-blue-500 text-white">{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-gray-800">{doctor.name}</h4>
                  <p className="text-sm font-medium text-purple-700">{doctor.specialty}</p>
                  {doctor.rating && <div className="text-sm text-amber-500 font-medium">★ {doctor.rating}</div>}
                  <div className="mt-3 w-full flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => onAppointmentRequest(doctor.id, 'consultation')}
                    >
                      Consult
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => onAppointmentRequest(doctor.id, 'in-person')}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {doctors.length > itemsToShow && (
        <div className="flex justify-center mt-2 gap-1">
          {Array.from({ length: Math.ceil(doctors.length / itemsToShow) }).map((_, i) => (
            <button 
              key={i} 
              className={`w-2 h-2 rounded-full ${currentIndex === i ? 'bg-purple-600' : 'bg-gray-300'}`}
              onClick={() => {
                setCurrentIndex(i);
                setVisibleDoctors(doctors.slice(i * itemsToShow, i * itemsToShow + itemsToShow));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Define patient data interface
interface PatientData {
  name: string;
  medicalNumber: string;
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
  appointments?: any[];
}

// Cache constants
const PROFILE_CACHE_KEY = 'cachedPatientProfile';
const PROFILE_CACHE_TIMESTAMP_KEY = 'cachedPatientProfileTimestamp';
const PROFILE_MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes
const PATIENT_PROFILE_CACHE_KEY = 'patientProfileData';
const PATIENT_NAME_CACHE_KEY = 'patientName';
const PATIENT_PHOTO_CACHE_KEY = 'patientProfilePhoto';

export default function PatientDashboardPage() {
  // Get route parameters and router
  const router = useRouter();
  const searchParams = useSearchParams();
  const notification = searchParams?.get('notification');
  const returnUrl = searchParams?.get('returnUrl') || '';
  const initialPage = searchParams?.get('page') || 'dashboard';
  
  // Use our hospital context to avoid "hospital not found" errors
  const { hospital } = useHospitalContext();
  
  // Authentication verification ref
  const isAuthVerified = useRef(false);
  
  // Create an AbortController ref for API fetch requests
  const abortController = useRef(new AbortController());
  
  // Toast notifications
  const { toast } = useToast();
  
  // Initial patient data state with cached name if available
  const initialPatientName = typeof window !== 'undefined' ? 
    localStorage.getItem(PATIENT_NAME_CACHE_KEY) || "Unknown" : "Unknown";
  
  // Define component state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isOverview, setIsOverview] = useState(currentPage === 'dashboard');
  const [showSessionWarning, setShowSessionWarning] = useState(notification === 'session_warning');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isCriticalDataLoaded, setIsCriticalDataLoaded] = useState(false);
  const [isProfilePhotoLoading, setIsProfilePhotoLoading] = useState(true);
  const [isSecondaryDataLoading, setIsSecondaryDataLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Doctor data state
  const [hospitalDoctors, setHospitalDoctors] = useState<Doctor[]>([]);
  const [specialistDoctors, setSpecialistDoctors] = useState<{
    cardiologists: Doctor[],
    pediatricians: Doctor[]
  }>({cardiologists: [], pediatricians: []});
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  
  // Effect to combine all doctors for the main carousel
  useEffect(() => {
    const doctors = [
      ...hospitalDoctors,
      ...specialistDoctors.cardiologists
    ];
    // Create a unique set of doctors by ID to avoid duplicates
    const uniqueDoctors = doctors.filter((doctor, index, self) => 
      index === self.findIndex((d) => d.id === doctor.id)
    );
    setAllDoctors(uniqueDoctors);
  }, [hospitalDoctors, specialistDoctors]);
  
  // UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAppointmentPending, setIsAppointmentPending] = useState(false);
  
  // Profile-related states
  const [profile, setProfile] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem(PATIENT_PHOTO_CACHE_KEY) || '/images/default-avatar.png' : '/images/default-avatar.png'
  );
  
  // Patient data state
  const [patientData, setPatientData] = useState<PatientData>({
    name: initialPatientName,
    medicalNumber: "Pending",
    dateOfBirth: "Unknown",
    age: "", 
    gender: "unknown",
    bloodType: "",
    onboardingCompleted: false,
    admittedDate: "",
    attendingDoctor: "",
    room: "",
    address: "",
    phone: "",
    email: "",
    vitalSigns: {
      temperature: "",
      bloodPressure: "",
      heartRate: "",
      respiratoryRate: "",
      height: "",
      weight: ""
    },
    insurance: {
      provider: "Unknown",
      policyNumber: "",
      group: "",
      expirationDate: ""
    },
    allergies: [],
    conditions: [],
    medications: []
  });
  
  // OPTIMIZED: Use patient profile hook with improved options
  const { 
    profile: fetchedProfile, 
    error: profileError, 
    profilePhotoUrl, 
    isProfilePhotoLoading: hookProfilePhotoLoading,
    isLoading: profileIsLoading,
    refreshProfile
  } = usePatientProfile({ 
    persistSession: true,
    loadProfilePhoto: true,
    skipCache: false // Use cache by default for faster loading
  });
  
  // SECURITY: Client-side authentication guard
  useEffect(() => {
    // Check for any valid authentication token per CentralHealth standards
    const hasToken = !!localStorage.getItem('authToken');
    const hasSession = !!localStorage.getItem('patient_session');
    // No longer checking localStorage for medical IDs per CentralHealth policy
    const hasMedicalNumber = !!profile?.medicalNumber;
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
  }, [profile?.medicalNumber]);
  
  // Update our local profile state from the hook
  useEffect(() => {
    if (fetchedProfile) {
      setProfile(fetchedProfile);
    }
  }, [fetchedProfile]);
  
  // OPTIMIZED: Pre-load cached profile data immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Try to load profile from cache first for instant display
        const cachedProfileData = localStorage.getItem(PROFILE_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY);
        
        if (cachedProfileData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          const isRecent = now - timestamp < PROFILE_MAX_CACHE_AGE_MS;
          
          if (isRecent) {
            // Use cached data for immediate display
            const cachedProfile = JSON.parse(cachedProfileData);
            console.log('Using cached profile data for instant rendering');
            
            // Immediately update critical display fields
            setPatientData(prevData => ({
              ...prevData,
              name: cachedProfile.firstName && cachedProfile.lastName ? 
                `${cachedProfile.firstName} ${cachedProfile.lastName}`.trim() : 
                prevData.name,
              medicalNumber: cachedProfile.mrn || cachedProfile.medicalNumber || prevData.medicalNumber,
              age: cachedProfile.age ? cachedProfile.age.toString() : prevData.age,
              gender: cachedProfile.gender || prevData.gender
            }));
            
            setIsCriticalDataLoaded(true);
          }
        }
        
        // Try to load cached profile photo
        const cachedPhoto = localStorage.getItem(PATIENT_PHOTO_CACHE_KEY);
        if (cachedPhoto) {
          setProfilePhoto(cachedPhoto);
          setIsProfilePhotoLoading(false);
        }
      } catch (error) {
        console.warn('Error loading cached profile data:', error);
      }
    }
  }, []);
  
  // Load available doctors
  useEffect(() => {
    if (hospital) {
      // Get doctors from current hospital
      const hospitalDocs = getDoctorsByHospital(hospital.toString());
      setHospitalDoctors(hospitalDocs);
      
      // Get diverse doctors for the carousel
      const diverseDoctors = getDiverseDoctors();
      // We're not using the specialists state anymore, but keeping the code structure similar
      setSpecialistDoctors({cardiologists: diverseDoctors, pediatricians: []});
    }
  }, [hospital]);
  
  // Update error state and loading state whenever profile data changes
  useEffect(() => {
    // Update loading state based on profile loading status
    setIsLoading(profileIsLoading);
    
    // If we have a profile error, update our local error state
    if (profileError) {
      setLocalError(typeof profileError === 'string' ? profileError : 'An error occurred loading your profile');
    }
  }, [profileError, profileIsLoading]);
  
  // OPTIMIZED: Effect to immediately update patient name as soon as it's available
  useEffect(() => {
    if (profile) {
      // Extract patient name from profile using firstName and lastName per CentralHealth policy
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      
      if (fullName && fullName !== patientData.name && fullName !== "Unknown") {
        console.log('Updating patient name:', fullName);
        
        // Update only the name field immediately for faster UI rendering
        setPatientData(prev => ({
          ...prev,
          name: fullName,
          // Also update medical number if available
          medicalNumber: profile.mrn || patientData.medicalNumber
        }));
        
        // Cache the name for future visits
        if (typeof window !== 'undefined') {
          localStorage.setItem(PATIENT_NAME_CACHE_KEY, fullName);
        }
      }
    }
  }, [profile, patientData.name]);
  
  // OPTIMIZED: Effect to sync profile photo URL with improved caching
  useEffect(() => {
    if (profilePhotoUrl) {
      console.log('Setting profile photo');
      setProfilePhoto(profilePhotoUrl);
      setIsProfilePhotoLoading(false);
      
      // Cache photo for future visits
      if (typeof window !== 'undefined') {
        localStorage.setItem(PATIENT_PHOTO_CACHE_KEY, profilePhotoUrl);
      }
    } else if (profilePhoto === '/images/default-avatar.png') {
      // If using default, try localStorage
      if (typeof window !== 'undefined') {
        const cachedPhoto = localStorage.getItem(PATIENT_PHOTO_CACHE_KEY);
        if (cachedPhoto) {
          setProfilePhoto(cachedPhoto);
          setIsProfilePhotoLoading(false);
        } else {
          setIsProfilePhotoLoading(false);
        }
      }
    }
  }, [profilePhotoUrl, profilePhoto]);
  
  // Clean up all requests on unmount
  useEffect(() => {
    return () => {
      abortController.current.abort();
    };
  }, []);
  
  // OPTIMIZED: Handle navigation from sidebar with state preservation
  const handleNavigation = (page: string) => {
    console.log(`Navigation: ${currentPage} -> ${page}`);
    setCurrentPage(page);
    
    // Don't perform full-page navigation for client-side routes
    // This preserves state and improves performance
    if (page === 'dashboard' || page.startsWith('dashboard/')) {
      setIsOverview(page === 'dashboard');
      
      // Use client-side navigation without full page reload
      // This maintains the patient profile data in memory
      const path = page === 'dashboard' ? '/patient/dashboard' : `/patient/${page}`;
      router.push(path);
      return;
    }
    
    // For other pages, perform normal navigation
    router.push(`/patient/${page}`);
  };
  
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
  
  // Render loading state
  if (isLoading) {
    const DashboardLayoutComponent = DashboardLayout as any;
    return (
      <DashboardLayoutComponent
        currentPage={currentPage}
        onNavigate={handleNavigation}
        breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }]}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Spinner className="w-10 h-10" />
            </div>
          </div>
        </div>
      </DashboardLayoutComponent>
    );
  }
  
  // Render error state
  if (localError) {
    const DashboardLayoutComponent = DashboardLayout as any;
    return (
      <DashboardLayoutComponent 
        currentPage={currentPage}
        onNavigate={handleNavigation}
        breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }]}
      >
        <div className="max-w-7xl mx-auto">
          <div className="p-6 rounded-lg border border-red-200 bg-red-50">
            <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{localError || "Failed to load patient dashboard. Please try again."}</p>
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
      </DashboardLayoutComponent>
    );
  }
  
  // Extract the medical ID from the profile following CentralHealth policy
  // Medical IDs must follow NHS-style 5-character alphanumeric format and be stored as MRN
  const medicalNumber = profile?.mrn || "unknown";
  
  // Get the exact medical ID shown in the dashboard
  // CRITICAL: Per CentralHealth policy, medical IDs must be stored consistently in the mrn field
  const dashboardMedicalID = profile?.mrn || profile?.medicalNumber || profile?.id || "";
  
  // Store this exact ID in localStorage for consistency across pages
  if (typeof window !== 'undefined' && dashboardMedicalID) {
    localStorage.setItem('medicalNumber', dashboardMedicalID);
  }
  
  // Render the main dashboard content
  const DashboardLayoutComponent = DashboardLayout as any;
  return (
    <DashboardLayoutComponent
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }]}
      profileData={{
        name: patientData.name,
        medicalNumber: medicalNumber,
        profileImage: profilePhoto || undefined
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Welcome section with quick overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome, {patientData.name.split(' ')[0]}</h2>
          <p className="text-muted-foreground">Here's your health summary for today</p>
        </div>

        {/* Vitals and quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-blue-700">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {patientData.appointments?.length || 0}
              </div>
              <p className="text-sm text-blue-600">Next: {patientData.appointments?.length ? 'Jul 15, 2025' : 'None scheduled'}</p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-purple-700">Medication Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                {patientData.medications?.length || 0}
              </div>
              <p className="text-sm text-purple-600">{patientData.medications?.length ? 'Next dose in 3 hours' : 'No active medications'}</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-green-700">Health Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4 ring-2 ring-white">
                  <span className="text-green-600 font-medium">85%</span>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Good</p>
                  <p className="text-xs text-green-700">Based on recent checkups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main doctors carousel section with auto-sliding */}
        {allDoctors.length > 0 && (
          <DoctorCarousel 
            title="Recommended Doctors" 
            doctors={allDoctors}
            onAppointmentRequest={handleAppointmentRequest}
            singleLine={true}
            autoSlide={true}
          />
        )}

        {/* Calendar and appointments section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Schedule and manage your appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" className="rounded-md border" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Previous</Button>
              <Button>Book New Appointment</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>Your latest medical tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Blood Work</p>
                    <p className="text-sm text-muted-foreground">Complete Blood Count</p>
                  </div>
                  <Badge>Normal</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Jul 1, 2025</p>
              </div>
              
              <div className="border-b pb-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Urinalysis</p>
                    <p className="text-sm text-muted-foreground">Routine Test</p>
                  </div>
                  <Badge>Normal</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Jun 28, 2025</p>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Blood Pressure</p>
                    <p className="text-sm text-muted-foreground">Routine Check</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Review</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Jun 25, 2025</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Results</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayoutComponent>
  );
}