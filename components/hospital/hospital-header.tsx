"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, MessageSquare, Settings, LogOut, User, FileText, Activity, Mail, Calendar, Pill, Syringe, FileSpreadsheet, CircleUser, Building2, Stethoscope, FolderOutput, FlaskConical, ClipboardList, Baby, Shield, Clipboard, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { NewReferralDialog } from "@/components/new-referral-dialog"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ConnectedPatientSearch from "@/components/widgets/ConnectedPatientSearch"

interface HospitalHeaderProps {
  hospitalName: string
}

// Helper function to calculate age from birthdate
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// FHIR Patient interface (simplified for search)
interface FHIRPatient {
  id: string;
  name?: { given?: string[]; family?: string; text?: string }[];
  email?: string;
  telecom?: { system: string; value: string; use?: string }[];
  birthDate?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: any[];
  photo?: string;
  active?: boolean;
  mrn?: string;
  medicalNumber?: string;
  hospitalId?: string;
  modules?: string[];
  profilePicture?: {
    imageUrl: string;
  };
  // Database schema related fields
  onboardingCompleted?: boolean;
  lastVisit?: string | Date;
  nextVisit?: string | Date;
  note?: string;
  // Patient name fields for different data sources
  fullName?: string;
  firstName?: string;
  lastName?: string;
  // Add User field for proper name display
  User?: {
    id: string;
    name: string;
    email: string;
  };
}

// Helper function to get initials from name
function getInitials(name?: string): string {
  if (!name) return "U"
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

// Adapter to convert database patient to FHIR format
function adaptDatabasePatientToFHIR(patient: any): FHIRPatient {
  // Make sure we don't process null/undefined
  if (!patient) return null as any;
  
  // Check if it's already in FHIR format
  if (patient.medicalNumber && !patient.mrn) return patient;
  
  // Map database fields to FHIR format
  return {
    id: patient.id,
    medicalNumber: patient.mrn, // Medical ID in NHS-style 5-character alphanumeric format
    mrn: patient.mrn, // Ensure mrn is preserved for consistent identification
    active: patient.active !== undefined ? patient.active : true,
    name: patient.name ? [{ text: patient.name }] : [],
    gender: patient.gender,
    birthDate: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined,
    dateOfBirth: patient.dateOfBirth,
    email: patient.email,
    // Map profile picture - this is crucial for display in the UI
    photo: patient.profilePicture?.imageUrl,
    profilePicture: patient.profilePicture,
    hospitalId: patient.hospitalId,
    // Add User relationship data to ensure we have full name
    User: patient.User,
    // Preserve these fields for consistent data display
    onboardingCompleted: patient.onboardingCompleted,
    lastVisit: patient.lastVisit,
    nextVisit: patient.nextVisit,
    note: patient.note
  };
}

export function HospitalHeader({ hospitalName }: HospitalHeaderProps) {
  const router = useRouter()

  // Get user data from localStorage if available
  const [userData, setUserData] = useState<{ id?: string; name?: string; email?: string }>({}) 
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<FHIRPatient | null>(null);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Fetch recent messages and unread count
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/hospitals/${hospitalName}/messages/recent`)
      if (response.ok) {
        const data = await response.json()
        setRecentMessages(data.messages || [])
        setUnreadMessages(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }
  
  // Handle patient selection from search widget
  const handlePatientSelection = (patient: FHIRPatient | any) => {
    setSelectedPatient(adaptDatabasePatientToFHIR(patient))
    router.push(`/${hospitalName}/admin/patients/${patient.id}`)
  }
  
  // Open patient profile
  const openPatientProfile = (patient: FHIRPatient | any) => {
    setSelectedPatient(adaptDatabasePatientToFHIR(patient))
    // Navigate to patient profile
    router.push(`/${hospitalName}/admin/patients/${patient.id}`)
  }
  
  // Format patient name from FHIR format or database format
  const formatPatientName = (patient: FHIRPatient | any) => {
    // Safety check for null/undefined patient
    if (!patient) return "Unknown Patient"
    
    // Use fullName directly if provided (likely from API)
    if (patient.fullName) {
      return patient.fullName
    }
    
    // Handle User.name field if available (preferred for full name)
    if (patient.User && patient.User.name) {
      return patient.User.name
    }
    
    // Try firstName + lastName if both are available (from PatientSearch)
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`
    }
    
    // Direct name field (database format)
    if (patient.name && typeof patient.name === 'string') {
      return patient.name
    }
    
    // FHIR format - array of name objects
    if (Array.isArray(patient.name) && patient.name.length > 0) {
      const nameObj = patient.name[0]
      let fullName = ''
      
      if (nameObj.text) {
        return nameObj.text
      }
      
      if (nameObj.given && Array.isArray(nameObj.given)) {
        fullName += nameObj.given.join(' ')
      }
      
      if (nameObj.family) {
        fullName += fullName ? ` ${nameObj.family}` : nameObj.family
      }
      
      if (fullName) return fullName
    }
    
    // Email as name fallback if present
    if (patient.User && patient.User.email) {
      return patient.User.email.split('@')[0]
    }
    
    if (patient.email) {
      return patient.email.split('@')[0]
    }
    
    // Try to use the MRN as identification if name is missing
    // Using permanent medical ID (mrn) per CentralHealth policy
    const identifier = patient.mrn || patient.medicalNumber
    if (identifier) {
      // Don't use "Patient VYCF7" format - just show the ID
      // This follows CentralHealth rules for patient identification
      return identifier
    }
    
    return "Unknown Patient"
  }
  
  // Calculate age from birth date
  const calculateAge = (birthDateStr?: string | Date | null) => {
    if (!birthDateStr) return null
    
    const birthDate = new Date(birthDateStr)
    const today = new Date()
    
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }
  

  
  useEffect(() => {
    // Try to get user data from local storage
    const authData = localStorage.getItem("hospitalAuth")
    if (authData) {
      try {
        const parsedData = JSON.parse(authData)
        setUserData(parsedData)
        
        // Fetch initial messages
        fetchMessages()
        
        // Set up polling for new messages
        refreshInterval.current = setInterval(fetchMessages, 30000) // Poll every 30 seconds
      } catch (error) {
        console.error("Error parsing auth data:", error)
      }
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current)
      }
    }
  }, [])

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("auth")
    localStorage.removeItem("hospitalAuth")

    // Clear cookies - redirect to API endpoint that will clear cookies
    router.push(`/api/auth/logout?redirect=/${hospitalName}/auth/login`)
    
    // Show success message
    toast.success("Logged out successfully")
  }

  return (
    <header className="border-b bg-white px-6 py-4">
      {/* Patient Profile Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <>
              {/* Centered Profile Picture and Patient Information */}
              <div className="flex flex-col items-center mb-6">
                {/* Large Patient Avatar at the Top Center - Prioritize database profilePicture */}
                <Avatar className="h-24 w-24 mb-3 ring-4 ring-blue-100">
                  {(selectedPatient.profilePicture && selectedPatient.profilePicture.imageUrl) ? (
                    <AvatarImage 
                      src={selectedPatient.profilePicture.imageUrl} 
                      alt={formatPatientName(selectedPatient)}
                      className="object-cover"
                    />
                  ) : selectedPatient.photo ? (
                    <AvatarImage 
                      src={selectedPatient.photo} 
                      alt={formatPatientName(selectedPatient)}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {formatPatientName(selectedPatient).split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Patient Name as Title - Show full name if available */}
                <div className="text-center mb-1">
                  <DialogTitle className="text-xl font-semibold">
                    {selectedPatient.User?.name || selectedPatient.fullName || selectedPatient.name || 
                     (selectedPatient.firstName && selectedPatient.lastName ? 
                      `${selectedPatient.firstName} ${selectedPatient.lastName}` : 
                      formatPatientName(selectedPatient))}
                  </DialogTitle>
                </div>
                
                {/* Status Badge and Age (not DOB) */}
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={selectedPatient.active ? "default" : "secondary"}>
                    {selectedPatient.active ? "Active" : "Inactive"}
                  </Badge>
                  
                  {/* Show age instead of DOB */}
                  {(selectedPatient.dateOfBirth || selectedPatient.birthDate) && (
                    <span className="text-sm text-muted-foreground">
                      {calculateAge(selectedPatient.dateOfBirth || selectedPatient.birthDate) ?? 'Unknown'} years old
                    </span>
                  )}
                </div>
                
                {/* Permanent Medical ID - NHS-style 5-character alphanumeric format */}
                <div className="bg-blue-50 px-3 py-1.5 rounded-md inline-flex items-center text-sm font-medium">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  <strong className="mr-1">Medical ID:</strong> {selectedPatient.mrn || selectedPatient.medicalNumber || "Not assigned"}
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                {/* View Complete Profile button moved to top right */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="shrink-0"
                  onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}`)}
                >
                  View Complete Profile
                </Button>
              </div>
              
              <DialogHeader className="flex justify-between items-start">
                <DialogDescription className="flex flex-wrap gap-3 mt-2">
                  <span className="flex items-center text-sm bg-blue-50 px-2 py-1 rounded-md">
                    <FileText className="h-4 w-4 mr-1 text-blue-500" />
                    <strong className="mr-1">Medical ID:</strong> {selectedPatient.mrn || selectedPatient.medicalNumber || "Not assigned"}
                  </span>
                  {selectedPatient.email && (
                    <span className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-1" />
                      <strong className="mr-1">Email:</strong> {selectedPatient.email}
                    </span>
                  )}
                  {selectedPatient.gender && (
                    <span className="flex items-center text-sm">
                      <CircleUser className="h-4 w-4 mr-1" />
                      <strong className="mr-1">Gender:</strong> {selectedPatient.gender}
                    </span>
                  )}
                  {selectedPatient.birthDate && (
                    <span className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      <strong className="mr-1">DOB:</strong> {format(new Date(selectedPatient.birthDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="medications">Medications</TabsTrigger>
                  <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
                  <TabsTrigger value="records">Records</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Patient Summary</CardTitle>
                      <CardDescription>Key patient information and recent activity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Patient Summary Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Activity className="h-4 w-4" /> Vitals
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Recent vital signs will appear here when recorded
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Upcoming Appointments
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            No upcoming appointments
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Pill className="h-4 w-4" /> Current Medications
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            No active medications
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <FileSpreadsheet className="h-4 w-4" /> Recent Lab Results
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            No recent lab results
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                      {/* Main Action Buttons */}
                      {/* IMPORTANT: These are the buttons that appear in the QR scan patient dialog */}
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/admission/new`)}
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1" /> Admit Patient
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/consultation/new`)}
                      >
                        <Stethoscope className="h-3.5 w-3.5 mr-1" /> Start Consultation
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => router.push(`/${hospitalName}/admin/appointments/new?patientId=${selectedPatient.id}`)}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule Appointment
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => setReferralDialogOpen(true)}
                      >
                        <FolderOutput className="h-3.5 w-3.5 mr-1" /> Refer Patient
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/vaccinations/new`)}
                      >
                        <Syringe className="h-3.5 w-3.5 mr-1" /> Record Vaccination
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/lab-tests/new`)}
                      >
                        <FlaskConical className="h-3.5 w-3.5 mr-1" /> Order Lab Test
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/notes/new`)}
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1" /> Add Clinical Note
                      </Button>
                      
                      {/* Conditional buttons based on patient context */}
                      {selectedPatient.modules?.includes('antenatal') && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full flex items-center justify-center bg-pink-600 hover:bg-pink-700 text-white"
                          onClick={() => router.push(`/${hospitalName}/admin/antenatal/patients/${selectedPatient.id}/visit/new`)}
                        >
                          <Baby className="h-3.5 w-3.5 mr-1" /> ANC Visit
                        </Button>
                      )}
                      
                      {selectedPatient.birthDate && calculateAge(new Date(selectedPatient.birthDate)) < 5 && selectedPatient.id && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/immunizations/new`)}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1" /> Immunization
                        </Button>
                      )}
                      
                      {!selectedPatient.active && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/reactivate`)}
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" /> Reactivate Patient
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="appointments" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Appointments</CardTitle>
                      <CardDescription>Patient appointment history and schedule</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-sm font-medium">No appointments found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This patient doesn't have any scheduled appointments
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => router.push(`/${hospitalName}/admin/appointments/new?patientId=${selectedPatient.id}`)}
                      >
                        Schedule New Appointment
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="medications" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Medications</CardTitle>
                      <CardDescription>Active and past medications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Pill className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-sm font-medium">No medications found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This patient doesn't have any recorded medications
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/medications/new`)}
                      >
                        Add Medication
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="vaccinations" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Vaccinations</CardTitle>
                      <CardDescription>Vaccine history and immunization records</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Syringe className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-sm font-medium">No vaccinations found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This patient doesn't have any recorded vaccinations
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/vaccinations/new`)}
                      >
                        Record Vaccination
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="records" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Medical Records</CardTitle>
                      <CardDescription>Lab results, reports, and clinical notes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-sm font-medium">No medical records found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This patient doesn't have any uploaded medical records
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/records/upload`)}
                      >
                        Upload Medical Record
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">

  <div className="flex items-center space-x-4">
    {/* Patient Search Component */}
    <div className="w-64">
      <ConnectedPatientSearch 
        onPatientSelect={(patient: any) => handlePatientSelection(patient)}
        showQrScanner={true}
        searchPlaceholder="Search patients..."
        className="w-full"
      />
    </div>

    {/* ... rest of the code remains the same ... */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {unreadMessages}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="flex items-center justify-between p-3 bg-muted/30">
                <h3 className="font-medium">Messages</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/${hospitalName}/admin/notifications`)}
                  >
                    <span className="sr-only">View all messages</span>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              
              <ScrollArea className="h-[300px]">
                {recentMessages.length > 0 ? (
                  <div className="flex flex-col">
                    {recentMessages.map((message) => (
                      <Link
                        key={message.id}
                        href={`/${hospitalName}/admin/notifications?chat=${message.chatId}`}
                        className={cn(
                          "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors",
                          !message.isRead && "bg-muted/30"
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={message.sender.profileImage || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(message.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">{message.sender.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(message.sentAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {message.content}
                          </p>
                        </div>
                        {!message.isRead && (
                          <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground">
                      Check back later or start a new conversation
                    </p>
                  </div>
                )}
              </ScrollArea>
              
              <Separator />
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => router.push(`/${hospitalName}/admin/notifications`)}
                >
                  View All Messages
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" alt="Admin" />
                  <AvatarFallback className="bg-blue-600 text-white">
                  {userData?.name ? userData.name.split(" ").map(n => n[0]).join("").toUpperCase() : "AD"}
                </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userData?.name || "Hospital Admin"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userData?.email || `admin@${hospitalName.replace("-", "")}.com`}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/${hospitalName}/admin/profile`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Referral Dialog */}
      {selectedPatient && (
        <NewReferralDialog 
          open={referralDialogOpen} 
          setOpen={setReferralDialogOpen}
          initialPatient={{
            id: selectedPatient.id,
            name: typeof selectedPatient.name === 'string' ? selectedPatient.name : 
                  (selectedPatient.name?.[0]?.text || 
                   [selectedPatient.name?.[0]?.family, ...(selectedPatient.name?.[0]?.given || [])].filter(Boolean).join(' ')),
            medicalNumber: selectedPatient.medicalNumber,
            photo: ""
          }}
        />
      )}
    </header>
  )
}
