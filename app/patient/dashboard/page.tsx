"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCachedFetch } from "@/lib/use-cached-fetch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Calendar, 
  FileText, 
  User, 
  Activity, 
  Pill, 
  Heart, 
  Home, 
  Settings, 
  Bell,
  Shield,
  LogOut,
  Plus,
  ChevronRight,
  Clock,
  Search,
  Edit,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  Save,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Type definitions for patient data and related objects
type Appointment = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
};

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  refillDate: string;
  status: string;
};

type Vaccination = {
  id: string;
  name: string;
  date: string;
  status: string;
};

type VitalSigns = {
  lastChecked: string;
  bloodPressure: string;
  heartRate: number;
  temperature: string;
  oxygenLevel: number;
};

// Type for patient data
type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
  medicalId?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  addressData?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  phone?: string;
  appointments?: Appointment[];
  medications?: Medication[];
  vaccinations?: Vaccination[];
  vitalSigns?: VitalSigns;
};

// Form data type
type FormData = {
  email: string;
  phone: string;
  address: {
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// Format address as a string
const formatAddress = (address: any) => {
  if (!address) return "No address provided";
  
  try {
    const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
    const line = addressObj.line && addressObj.line.length > 0 ? addressObj.line.join(", ") : "";
    const city = addressObj.city || "";
    const state = addressObj.state || "";
    const postalCode = addressObj.postalCode || "";
    const country = addressObj.country || "";
    
    return [line, city, state, postalCode, country].filter(Boolean).join(", ");
  } catch (e) {
    return typeof address === 'string' ? address : "Invalid address format";
  }
};

// Format name for display
const formatName = (name: any) => {
  if (!name) return "Unknown";
  
  try {
    const nameData = typeof name === 'string' ? JSON.parse(name) : name;
    const nameObj = Array.isArray(nameData) ? nameData[0] : nameData;
    
    if (nameObj.text) return nameObj.text;
    
    const given = nameObj.given ? nameObj.given.join(' ') : '';
    const family = nameObj.family || '';
    
    return `${given} ${family}`.trim() || "Unknown";
  } catch (e) {
    return typeof name === 'string' ? name : "Unknown";
  }
};

// Calculate age from birthdate
const calculateAge = (birthDate: string) => {
  if (!birthDate) return "";
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const m = today.getMonth() - birthDateObj.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  return age;
};

export default function PatientDashboard() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<any>({
    email: '',
    phone: '',
    address: {
      line: [''],
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "medications" | "vaccinations" | "medical-records" | "profile">("overview");
  const [editing, setEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: {
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: ""
    }
  });

  // Use our optimized cached fetch hook with faster loading
  const { 
    data: patientResponse, 
    isLoading, 
    error: patientError,
    revalidate: revalidatePatient
  } = useCachedFetch('/api/patients/session/me', {
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
    revalidateOnFocus: true,
    timeout: 5000 // 5 second timeout to fail faster on slow connections
  });
  
  // Patient data derived from the fetch response
  const patient = patientResponse?.patient;
  
  // Setup authentication state and form data when patient data loads
  useEffect(() => {
    if (patientResponse) {
      setIsAuthenticated(!!patientResponse.authenticated);
      
      if (patientResponse.patient) {
        // Set form data from patient
        setPatientData({
          email: patientResponse.patient.email || '',
          phone: patientResponse.patient.phone || '',
          address: {
            line: patientResponse.patient.addressData?.[0]?.line || [''],
            city: patientResponse.patient.addressData?.[0]?.city || '',
            state: patientResponse.patient.addressData?.[0]?.state || '',
            postalCode: patientResponse.patient.addressData?.[0]?.postalCode || '',
            country: patientResponse.patient.addressData?.[0]?.country || ''
          }
        });
        
        // Using session-based authentication, no need for localStorage caching
        
        console.log('Patient data loaded:', patientResponse.patient);
      }
    }
    
    if (patientError) {
      console.error('Error loading patient data:', patientError);
      setIsAuthenticated(false);
    }
  }, [patientResponse, patientError]);

  // Handle profile form data changes
  const handleProfileInputChange = (field: string, value: string) => {
    setFormData(prevFormData => {
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1];
        if (addressField === 'line') {
          return {
            ...prevFormData,
            address: {
              ...prevFormData.address,
              line: [value]
            }
          };
        } else {
          return {
            ...prevFormData,
            address: {
              ...prevFormData.address,
              [addressField]: value
            }
          };
        }
      } else {
        return {
          ...prevFormData,
          [field]: value
        };
      }
    });
  };

  // Handle profile form submission
  const handleProfileSubmit = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/patients/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Important for sending cookies
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedData = await response.json();
      // Refresh patient data after update
      revalidatePatient();
      setPatientData((prevData: any) => ({
        ...prevData, 
        email: updatedData.email,
        phone: updatedData.phone,
        address: updatedData.address
      }));
      setEditing(false);
      // Show success toast or message
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error toast or message
    } finally {
      setIsSaving(false);
    }
  };

  // Handle authentication and onboarding requirements silently in the background
  useEffect(() => {
    // Debug onboarding conditions
    console.log('Debug onboarding conditions:', {
      authenticated: patientResponse?.authenticated,
      onboardingCompleted: patientResponse?.onboardingCompleted,
      patientExists: !!patientResponse?.patient,
      extensionData: patientResponse?.patient?.extension
    });
    
    // If authentication explicitly fails, redirect to login without showing errors to user
    if (patientResponse && !patientResponse.authenticated) {
      console.log('Authentication failed, redirecting to landing');
      window.location.href = '/';
      return;
    }
    
    // IMPORTANT: Show the onboarding wizard for a new registration
    // We make the check more aggressive by considering anything not explicitly
    // marked as completed as needing onboarding
    if (patientResponse && patientResponse.authenticated && patientResponse.onboardingCompleted !== true) {
      console.log('Onboarding not explicitly completed, showing wizard');
      setShowOnboardingWizard(true);
      
      // Force this to run after a slight delay to ensure the UI has updated
      setTimeout(() => {
        console.log('Delayed check - wizard shown:', showOnboardingWizard);
        if (!showOnboardingWizard) {
          console.log('Forcing wizard to show!');
          setShowOnboardingWizard(true);
        }
      }, 1000);
      
      return;
    } else {
      console.log('Onboarding conditions not met, wizard hidden');
    }
    
    // If there's a network/server error, don't immediately redirect
    // Just log it and let the app continue with whatever data it has
    if (patientError) {
      console.error('Error fetching patient data:', patientError);
    }
  }, [patientResponse, patientError, router]);
  
  // Setup form data when patient data is loaded
  useEffect(() => {
    if (patient) {
      setFormData({
        email: patient.email || '',
        phone: patient.phone || '',
        address: {
          line: patient.addressData?.[0]?.line || [''],
          city: patient.addressData?.[0]?.city || '',
          state: patient.addressData?.[0]?.state || '',
          postalCode: patient.addressData?.[0]?.postalCode || '',
          country: patient.addressData?.[0]?.country || ''
        }
      });
    }
  }, [patient]);

  // Onboarding wizard dialog
  const OnboardingWizardDialog = () => (
    <Dialog open={showOnboardingWizard} onOpenChange={setShowOnboardingWizard}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Central Health!</DialogTitle>
          <DialogDescription>
            Complete your patient profile to access all features of the patient portal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <h3 className="font-medium">Complete your onboarding process to:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Update your personal and health information</li>
              <li>Add emergency contacts</li>
              <li>Record important medical details</li>
              <li>Get your digital medical ID</li>
            </ul>
          </div>
          
          {/* Debug info for admins */}
          <div className="border-t pt-2 mt-2 text-xs text-gray-500">
            <p>Debug info:</p>
            <p>onboardingCompleted: {String(patientResponse?.onboardingCompleted)}</p>
            <p>isAuthenticated: {String(patientResponse?.authenticated)}</p>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <div>
            <Button 
              type="button" 
              variant="default"
              onClick={() => {
                setShowOnboardingWizard(false);
                router.push('/onboarding');
              }}
            >
              Start Onboarding
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="ml-2"
              onClick={() => setShowOnboardingWizard(false)}
            >
              Later
            </Button>
          </div>
          
          {/* Force toggle button for debugging - only visible for admins */}
          <Button 
            type="button" 
            variant="ghost"
            size="sm"
            className="text-xs opacity-50 hover:opacity-100"
            onClick={() => {
              console.log('Forcing onboarding dialog toggle:', !showOnboardingWizard);
              setShowOnboardingWizard(!showOnboardingWizard);
            }}
          >
            Toggle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="bg-primary/10 rounded-md p-2 mr-2">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold">Patient Portal</h1>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary">
                {patient?.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{patient?.name}</p>
              <p className="text-sm text-muted-foreground">MRN: {patient?.medicalNumber}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Button 
            variant={activeTab === "overview" ? "secondary" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => setActiveTab("overview")}
          >
            <Home className="mr-2 h-4 w-4" />
            Overview
          </Button>
          
          <Button 
            variant={activeTab === "appointments" ? "secondary" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => setActiveTab("appointments")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Appointments
          </Button>
          
          <Button 
            variant={activeTab === "medications" ? "secondary" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => setActiveTab("medications")}
          >
            <Pill className="mr-2 h-4 w-4" />
            Medications
          </Button>
          
          <Button 
            variant={activeTab === "vaccinations" ? "secondary" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => setActiveTab("vaccinations")}
          >
            <Shield className="mr-2 h-4 w-4" />
            Vaccinations
          </Button>
          
          <Button 
            variant={activeTab === "medical-records" ? "secondary" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => setActiveTab("medical-records")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Medical Records
          </Button>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          {/* Profile link button */}
          <Button 
            variant={activeTab === "profile" ? "secondary" : "outline"} 
            className="w-full justify-start mb-2" 
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          
          {/* Logout button */}
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={async () => {
              try {
                const response = await fetch('/api/patients/session/logout', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  console.log('Logged out successfully');
                  // Redirect to landing page after successful logout
                  router.push('/');
                } else {
                  console.error('Logout failed');
                }
              } catch (error) {
                console.error('Error during logout:', error);
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm md:hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 rounded-md p-2">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Patient Portal</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab("profile")}
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Button>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {patient?.name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
          
        {/* Mobile Tab Navigation */}
        <div className="p-0 border-t border-gray-200 md:hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto p-0 h-12">
              <TabsTrigger value="overview" className="flex-1">
                <Home className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Overview</span>
              </TabsTrigger>
                
                <TabsTrigger value="appointments" className="flex-1">
                  <Calendar className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Appointments</span>
                </TabsTrigger>
                
                <TabsTrigger value="medications" className="flex-1">
                  <Pill className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Medications</span>
                </TabsTrigger>
                
                <TabsTrigger value="vaccinations" className="flex-1">
                  <Shield className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Vaccinations</span>
                </TabsTrigger>
                
                <TabsTrigger value="medical-records" className="flex-1">
                  <FileText className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Records</span>
                </TabsTrigger>
                
                <TabsTrigger value="profile" className="flex-1">
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Profile</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-6 shadow-lg text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back, {patient?.name?.split(' ')[0] || 'Patient'}!</h2>
                <p className="text-blue-100">Let's keep track of your health today</p>
              </div>
              <div className="hidden md:block bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <div className="text-sm">Today's Date</div>
                <div className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-blue-500"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{patient?.appointments?.filter((a: Appointment) => a.status === 'scheduled').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Next: {patient?.appointments?.find((a: Appointment) => a.status === 'scheduled')?.date || 'N/A'}</p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full text-xs border-blue-500 text-blue-500 hover:bg-blue-50">
                        <Plus className="h-3 w-3 mr-1" /> Book Appointment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-green-500"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
                      <Pill className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{patient?.medications?.filter((m: Medication) => m.status === 'active').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Next refill: {patient?.medications?.find((m: Medication) => m.status === 'active')?.refillDate || 'N/A'}</p>
                    <div className="mt-3">
                      <Badge className="bg-green-50 text-green-600 hover:bg-green-100 border-none">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-red-500"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                      <Activity className="h-4 w-4 text-red-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{patient?.vitalSigns?.bloodPressure || 'Not recorded'}</div>
                    <p className="text-xs text-muted-foreground">Last checked: {patient?.vitalSigns?.lastChecked || 'N/A'}</p>
                    <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Low</span>
                      <span>Normal</span>
                      <span>High</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-purple-500"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                      <Heart className="h-4 w-4 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{patient?.vitalSigns?.heartRate || 0} BPM</div>
                    <p className="text-xs text-muted-foreground">Last checked: {patient?.vitalSigns?.lastChecked || 'N/A'}</p>
                    <div className="mt-3">
                      <div className="flex items-end gap-2">
                        <div className="text-2xl font-bold">{patient?.vitalSigns?.oxygenLevel}%</div>
                        <Progress value={patient?.vitalSigns?.oxygenLevel} className="h-2 mt-2 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <div className="space-y-3 mt-4">
                <h3 className="font-medium">Upcoming Schedule</h3>
                <div className="space-y-2">
                  {patient?.appointments?.length > 0 ? patient.appointments.sort((a: Appointment, b: Appointment) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3).map((appointment: Appointment, i: number) => (
                    <div key={appointment.id} className="flex items-start space-x-4 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="flex-shrink-0 bg-blue-100 text-blue-800 p-2 rounded-lg">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{appointment.doctor}</p>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{appointment.date} at {appointment.time}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : <div className="text-center py-4 text-muted-foreground">No upcoming appointments</div>}
                </div>
              </div>
            </div>
          )}
          
          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Appointments</h1>
                  <p className="text-muted-foreground">Manage your upcoming and past appointments</p>
                </div>
                
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Appointment
                </Button>
              </div>
              
              <div className="space-y-4">
                {patient?.appointments?.map((appointment: Appointment) => (
                  <Card key={appointment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{appointment.doctor}</CardTitle>
                        <Badge variant={appointment.status === 'scheduled' ? 'outline' : 'secondary'}>
                          {appointment.status === 'scheduled' ? 'Upcoming' : 'Completed'}
                        </Badge>
                      </div>
                      <CardDescription>{appointment.specialty}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{appointment.date} at {appointment.time}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">Reschedule</Button>
                      <Button variant="default" size="sm">View Details</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Medications Tab */}
          {activeTab === "medications" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Medications</h1>
                  <p className="text-muted-foreground">Track your prescriptions and medication history</p>
                </div>
                
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Request Refill
                </Button>
              </div>
              
              <div className="space-y-4">
                {patient?.medications?.map((medication: Medication) => (
                  <Card key={medication.id} className={medication.status === 'active' ? 'border-l-4 border-l-green-500' : ''}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{medication.name}</CardTitle>
                        <Badge variant={medication.status === 'active' ? 'default' : 'secondary'}>
                          {medication.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>{medication.dosage} - {medication.frequency}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Refill by: {medication.refillDate}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Vaccinations Tab */}
          {activeTab === "vaccinations" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Vaccinations</h1>
                  <p className="text-muted-foreground">Track your immunization history</p>
                </div>
                
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vaccination
                </Button>
              </div>
              
              <div className="space-y-4">
                {patient?.vaccinations?.map((vaccination: Vaccination) => (
                  <Card key={vaccination.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{vaccination.name}</CardTitle>
                        <Badge variant="default">
                          {vaccination.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Date: {vaccination.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Medical Records Tab */}
          {activeTab === "medical-records" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Medical Records</h1>
                  <p className="text-muted-foreground">Access and download your medical history</p>
                </div>
                
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Request Records
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lab Results</CardTitle>
                    <CardDescription>Blood work and diagnostic tests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Complete Blood Count</p>
                          <p className="text-sm text-muted-foreground">Jan 15, 2023</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Medical History</CardTitle>
                    <CardDescription>Diagnoses and conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Annual Physical</p>
                          <p className="text-sm text-muted-foreground">Mar 10, 2023</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>Dr</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">Your Doctor</div>
                          <div className="text-sm text-muted-foreground">Appointment Today</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Profile</h1>
                  <p className="text-muted-foreground">View and edit your profile information</p>
                </div>
                
                {!editing ? (
                  <Button onClick={() => setEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Name</p>
                          <p className="text-sm text-muted-foreground">{patient?.name || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{patient?.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Render the onboarding wizard */}
      <OnboardingWizardDialog />
    </div>
  );
}
