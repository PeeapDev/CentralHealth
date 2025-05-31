"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Search
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types
interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  refillDate: string;
  status: string;
}

interface Vaccination {
  id: string;
  name: string;
  date: string;
  status: string;
}

interface PatientData {
  id: string;
  name: string;
  email: string;
  medicalNumber: string;
  age: number;
  gender: string;
  bloodType: string;
  appointments: Appointment[];
  medications: Medication[];
  vaccinations: Vaccination[];
  vitalSigns: {
    lastChecked: string;
    bloodPressure: string;
    heartRate: number;
    temperature: string;
    oxygenLevel: number;
  };
}

export default function PatientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: kindeLoading } = useKindeBrowserClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "medications" | "vaccinations" | "medical-records">("overview");

  useEffect(() => {
    // Check if user is logged in as a patient - Kinde or traditional auth
    const checkAuth = async () => {
      try {
        // First check Kinde auth
        if (isAuthenticated && user) {
          console.log('Authenticated via Kinde', user);
          // User is authenticated with Kinde
        } else {
          // Fall back to traditional auth check
          const storedMedicalNumber = localStorage.getItem('medicalNumber');
          const isLoggedIn = localStorage.getItem('isPatientLoggedIn');
          
          if (!isLoggedIn && !isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            // Redirect to login if not authenticated
            window.location.href = '/';
            return;
          }
        }
        
        // Set loading state while fetching patient data
        setLoading(true);
        setError(null);
        
        try {
          // Mock patient data since we can't rely on the API during this transition
          const mockPatientData: PatientData = {
            id: isAuthenticated && user?.id ? user.id : "p12345",
            name: isAuthenticated && user?.given_name 
              ? `${user.given_name} ${user.family_name || ''}` 
              : localStorage.getItem('patientName') || "John Doe",
            email: isAuthenticated && user?.email 
              ? user.email 
              : "patient@example.com",
            medicalNumber: isAuthenticated && user?.id 
              ? user.id.substring(0, 8) 
              : localStorage.getItem('medicalNumber') || "MRN12345",
            age: 35,
            gender: "Not specified",
            bloodType: "O+",
            appointments: [
              {
                id: "apt-1",
                doctor: "Dr. Sarah Johnson",
                specialty: "Cardiology",
                date: "June 15, 2023",
                time: "10:30 AM",
                status: "scheduled"
              },
              {
                id: "apt-2",
                doctor: "Dr. Michael Chen",
                specialty: "General Practice",
                date: "July 2, 2023",
                time: "2:00 PM",
                status: "scheduled"
              }
            ],
            medications: [
              {
                id: "med-1",
                name: "Lisinopril",
                dosage: "10mg",
                frequency: "Once daily",
                refillDate: "August 15, 2023",
                status: "active"
              },
              {
                id: "med-2",
                name: "Metformin",
                dosage: "500mg",
                frequency: "Twice daily",
                refillDate: "July 30, 2023",
                status: "active"
              }
            ],
            vaccinations: [
              {
                id: "vac-1",
                name: "Influenza",
                date: "November 10, 2022",
                status: "completed"
              },
              {
                id: "vac-2",
                name: "COVID-19",
                date: "March 15, 2022",
                status: "completed"
              }
            ],
            vitalSigns: {
              lastChecked: "May 20, 2023",
              bloodPressure: "128/85",
              heartRate: 72,
              temperature: "98.6°F",
              oxygenLevel: 98
            }
          };
          
          // Update patient state with mock data
          setPatient(mockPatientData);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching patient data:', err);
          setError('Failed to load patient data. Please try again later.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [user, isAuthenticated, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Button onClick={() => window.location.href = '/'}>
                Back to Login
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Link>
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
              
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {patient?.name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Mobile Tab Navigation */}
          <div className="p-0 border-t border-gray-200">
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
              </TabsList>
            </Tabs>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-6 shadow-lg text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back, {patient?.name?.split(' ')[0] || user?.given_name || 'Patient'}!</h2>
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
                    <div className="text-2xl font-bold">{patient?.appointments?.filter(a => a.status === 'scheduled').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Next: {patient?.appointments?.find(a => a.status === 'scheduled')?.date || 'N/A'}</p>
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
                    <div className="text-2xl font-bold">{patient?.medications?.filter(m => m.status === 'active').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Next refill: {patient?.medications?.find(m => m.status === 'active')?.refillDate || 'N/A'}</p>
                    <div className="mt-3">
                      <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50 border-green-100">
                        Prescription History
                      </Badge>
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
                  {patient?.appointments?.filter(a => a.status === 'scheduled').map((appointment, i) => (
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
                  ))}
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
                {patient?.appointments?.map((appointment) => (
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
                {patient?.medications?.map((medication) => (
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
                {patient?.vaccinations?.map((vaccination) => (
                  <Card key={vaccination.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{vaccination.name}</CardTitle>
                        <Badge variant="success">
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
