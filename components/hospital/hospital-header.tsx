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
import { Bell, MessageSquare, Search, Settings, LogOut, User, X, FileText, Activity, Phone, Mail, Calendar, Pill, Syringe, FileSpreadsheet, CircleUser, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState, useRef, useCallback } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HospitalHeaderProps {
  hospitalName: string
}

// FHIR Patient interface (simplified for search)
interface FHIRPatient {
  id: string;
  medicalNumber: string;
  active: boolean;
  name?: Array<{
    text?: string;
    family?: string;
    given?: string[];
  }> | string;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }> | string;
  gender?: string;
  birthDate?: string;
  email?: string;
  hospitalId?: string;
  photo?: string;
}

// Helper function to get initials from name
function getInitials(name?: string): string {
  if (!name) return "U"
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

export function HospitalHeader({ hospitalName }: HospitalHeaderProps) {
  const router = useRouter()

  // Get user data from localStorage if available
  const [userData, setUserData] = useState<{ id?: string; name?: string; email?: string }>({})
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Patient search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<FHIRPatient[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<FHIRPatient | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Search patients with debounced input
  const searchPatients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    
    try {
      // Using the existing patient API endpoint with hospital-scoped search
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}&hospitalId=${encodeURIComponent(hospitalName)}&page=1&pageSize=5`)
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.patients || [])
        setShowSearchResults(true)
      } else {
        console.error("Failed to search patients:", response.statusText)
        setSearchResults([])
      }
    } catch (error) {
      console.error("Error searching patients:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [hospitalName])
  
  // Handle input change with debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    
    // Set new timeout for debounce (300ms)
    searchTimeout.current = setTimeout(() => {
      searchPatients(query)
    }, 300)
  }
  
  // Close search results when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSearchResults(false)
    }
  }, [])
  
  // Open patient profile
  const openPatientProfile = (patient: FHIRPatient) => {
    setSelectedPatient(patient)
    setShowSearchResults(false)
  }
  
  // Format patient name from FHIR format
  const formatPatientName = (patient: FHIRPatient) => {
    if (!patient.name) return "Unknown Patient"
    
    // Handle string format (already processed)
    if (typeof patient.name === 'string') {
      return patient.name
    }
    
    // Handle array format
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
      
      return fullName || "Unknown Patient"
    }
    
    return "Unknown Patient"
  }
  
  // Add document click listener to close search results when clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])
  
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
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {selectedPatient.photo ? (
                      <AvatarImage src={selectedPatient.photo} alt={formatPatientName(selectedPatient)} />
                    ) : (
                      <AvatarFallback className="bg-blue-600 text-white">
                        {formatPatientName(selectedPatient).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <span>{formatPatientName(selectedPatient)}</span>
                    <Badge variant={selectedPatient.active ? "default" : "secondary"} className="ml-2">
                      {selectedPatient.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription className="flex flex-wrap gap-3 mt-2">
                  <span className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-1" />
                    <strong className="mr-1">Medical #:</strong> {selectedPatient.medicalNumber || "Not assigned"}
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
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}`)}
                      >
                        View Complete Profile
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => router.push(`/${hospitalName}/admin/patients/${selectedPatient.id}/edit`)}
                      >
                        Edit Patient
                      </Button>
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
          <h1 className="text-xl font-semibold capitalize">{hospitalName.replace("-", " ")} - Admin Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Patient Search */}
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search patients by name, email, or ID..."
              className="w-80 pl-10"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-md shadow-lg z-50 overflow-hidden">
                <div className="p-2 bg-muted/30 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Patient Results</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSearchResults(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ScrollArea className="max-h-72">
                    <div className="flex flex-col">
                      {searchResults.map((patient) => (
                        <button
                          key={patient.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                          onClick={() => openPatientProfile(patient)}
                        >
                          <Avatar className="h-9 w-9">
                            {patient.photo ? (
                              <AvatarImage src={patient.photo} alt={formatPatientName(patient)} />
                            ) : (
                              <AvatarFallback className="bg-blue-600 text-white">
                                {formatPatientName(patient).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{formatPatientName(patient)}</p>
                              <Badge variant={patient.active ? "default" : "secondary"} className="ml-2">
                                {patient.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground gap-3">
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                {patient.medicalNumber || "No MRN"}
                              </span>
                              {patient.email && (
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {patient.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : searchQuery.length > 1 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No patients found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Enter at least 2 characters to search</p>
                    <p className="text-xs text-muted-foreground mt-1">Search by name, medical number, or email</p>
                  </div>
                )}
                
                <div className="p-2 bg-muted/20 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs justify-center"
                    onClick={() => {
                      router.push(`/${hospitalName}/admin/patients?search=${encodeURIComponent(searchQuery)}`);
                      setShowSearchResults(false);
                    }}
                  >
                    View All Results
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Chat Notifications */}
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
    </header>
  )
}
