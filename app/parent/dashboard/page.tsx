"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  Users,
  LogOut,
  Plus
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

export default function ParentDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [parent, setParent] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in as a parent
    const checkAuth = async () => {
      try {
        // In a real app, you'd check for auth token and fetch parent data
        // This is a mock implementation
        const parentId = localStorage.getItem('parentId')
        const userType = localStorage.getItem('userType')
        
        if (!parentId || userType !== 'parent') {
          // Redirect to login if not authenticated as a parent
          router.push('/auth/parent-login')
          return
        }

        // Get parent name from localStorage
        const parentName = localStorage.getItem('parentName') || "Parent"
        
        // Get children data from localStorage
        let childrenData = []
        try {
          const storedChildren = localStorage.getItem('children')
          const childrenNames = storedChildren ? JSON.parse(storedChildren) : []
          
          childrenData = childrenNames.map((name: string, index: number) => ({
            id: `child-${index}`,
            name,
            age: 5 + index,
            gender: index % 2 === 0 ? "Female" : "Male",
            medicalNumber: `CH${1000 + index}`,
            appointments: [
              {
                id: `apt-${index}-1`,
                doctor: "Dr. Sarah Johnson",
                specialty: "Pediatrics",
                date: "June 15, 2025",
                time: "10:00 AM",
                status: "upcoming"
              }
            ],
            medications: [
              {
                id: `med-${index}-1`,
                name: "Vitamin D",
                dosage: "400 IU",
                frequency: "Daily",
                refillDate: "July 10, 2025",
                status: "active"
              }
            ],
            vaccinations: [
              {
                id: `vac-${index}-1`,
                name: "MMR",
                date: "May 20, 2025",
                status: "completed"
              },
              {
                id: `vac-${index}-2`,
                name: "Influenza",
                date: "June 30, 2025",
                status: "due"
              }
            ]
          }))
        } catch (error) {
          console.error("Error parsing children data:", error)
          childrenData = []
        }
        
        // Set parent data
        setParent({
          id: parentId,
          name: parentName,
          email: "parent@example.com"
        })
        
        // Set children data
        setChildren(childrenData)
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0].id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error("Authentication error:", error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('parentId')
    localStorage.removeItem('parentName')
    localStorage.removeItem('userType')
    localStorage.removeItem('children')
    router.push('/auth/parent-login')
  }

  const getSelectedChild = () => {
    return children.find(child => child.id === selectedChild) || null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Session Expired</h1>
        <p className="text-muted-foreground mb-6">Please log in to access your dashboard</p>
        <Button asChild>
          <Link href="/auth/parent-login">Go to Login</Link>
        </Button>
      </div>
    )
  }

  const currentChild = getSelectedChild()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="bg-blue-100 rounded-md p-2 mr-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-lg font-bold">Parent Portal</h1>
        </div>
        
        <div className="flex-1 py-4 px-3">
          <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Your Children
          </h2>
          <nav className="space-y-1 mb-6">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChild === child.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedChild(child.id)}
              >
                <User className="mr-2 h-4 w-4" />
                {child.name}
              </Button>
            ))}
          </nav>
          
          <Separator className="my-4" />
          
          <nav className="space-y-1">
            <Link href="/parent/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-600">
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            
            <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              <Calendar className="mr-3 h-5 w-5" />
              Appointments
            </Link>
            
            <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              <Activity className="mr-3 h-5 w-5" />
              Health Records
            </Link>
            
            <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              <Pill className="mr-3 h-5 w-5" />
              Medications
            </Link>
            
            <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              <Heart className="mr-3 h-5 w-5" />
              Vaccinations
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {parent.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{parent.name}</p>
              <p className="text-xs text-gray-500">Parent Account</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              {currentChild ? (
                <>
                  <h1 className="text-2xl font-bold">{currentChild.name}'s Dashboard</h1>
                  <p className="text-muted-foreground">Medical #: {currentChild.medicalNumber} • {currentChild.age} years old • {currentChild.gender}</p>
                </>
              ) : (
                <h1 className="text-2xl font-bold">Parent Dashboard</h1>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {!currentChild ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Child Selected</h2>
              <p className="text-muted-foreground">Please select a child from the sidebar to view their health information.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="medications">Medications</TabsTrigger>
                  <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                          Upcoming Appointments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{currentChild.appointments.length}</div>
                        <p className="text-sm text-blue-600">Next: {currentChild.appointments[0]?.date || "None"}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Pill className="mr-2 h-5 w-5 text-green-600" />
                          Active Medications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          {currentChild.medications.filter(m => m.status === "active").length}
                        </div>
                        <p className="text-sm text-green-600">
                          Refill: {currentChild.medications[0]?.refillDate || "None needed"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Heart className="mr-2 h-5 w-5 text-purple-600" />
                          Vaccinations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-600">
                          {currentChild.vaccinations.filter(v => v.status === "completed").length}/{currentChild.vaccinations.length}
                        </div>
                        <Progress 
                          value={(currentChild.vaccinations.filter(v => v.status === "completed").length / currentChild.vaccinations.length) * 100} 
                          className="h-2 mt-2" 
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Appointments and Medications */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointments */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle>Upcoming Appointments</CardTitle>
                          <CardDescription>Scheduled visits</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Book New
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {currentChild.appointments.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No upcoming appointments</p>
                          ) : (
                            currentChild.appointments.map((appointment) => (
                              <div key={appointment.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-100 p-2 rounded-full">
                                    <User className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{appointment.doctor}</p>
                                    <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{appointment.date}</p>
                                  <p className="text-sm text-muted-foreground">{appointment.time}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <Button variant="link" size="sm" className="mx-auto">
                          View All Appointments
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Medications */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle>Medications</CardTitle>
                          <CardDescription>Current prescriptions</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Request Refill
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {currentChild.medications.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No active medications</p>
                          ) : (
                            currentChild.medications.map((medication) => (
                              <div key={medication.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-green-100 p-2 rounded-full">
                                    <Pill className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{medication.name}</p>
                                    <p className="text-sm text-muted-foreground">{medication.dosage}, {medication.frequency}</p>
                                  </div>
                                </div>
                                <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                                  {medication.status}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <Button variant="link" size="sm" className="mx-auto">
                          View Medication History
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="appointments" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Appointments</CardTitle>
                      <CardDescription>Manage your child's appointments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentChild.appointments.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Appointments</h3>
                          <p className="text-muted-foreground mb-4">Your child doesn't have any appointments scheduled.</p>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Book New Appointment
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {currentChild.appointments.map((appointment) => (
                            <div key={appointment.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center mb-2 md:mb-0">
                                <div className="bg-blue-100 p-3 rounded-full mr-4">
                                  <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-lg">{appointment.doctor}</p>
                                  <p className="text-muted-foreground">{appointment.specialty}</p>
                                </div>
                              </div>
                              <div className="flex flex-col md:items-end">
                                <p className="font-medium">{appointment.date}</p>
                                <p className="text-muted-foreground">{appointment.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="medications" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Medications</CardTitle>
                      <CardDescription>Manage your child's medications and prescriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentChild.medications.length === 0 ? (
                        <div className="text-center py-8">
                          <Pill className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Medications</h3>
                          <p className="text-muted-foreground">Your child doesn't have any active medications.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {currentChild.medications.map((medication) => (
                            <div key={medication.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center mb-2 md:mb-0">
                                <div className="bg-green-100 p-3 rounded-full mr-4">
                                  <Pill className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-lg">{medication.name}</p>
                                  <p className="text-muted-foreground">{medication.dosage}, {medication.frequency}</p>
                                </div>
                              </div>
                              <div className="flex flex-col md:items-end">
                                <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                                  {medication.status}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">Refill: {medication.refillDate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="vaccinations" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vaccinations</CardTitle>
                      <CardDescription>Track your child's immunization records</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentChild.vaccinations.map((vaccination) => (
                          <div key={vaccination.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center mb-2 md:mb-0">
                              <div className={`p-3 rounded-full mr-4 ${
                                vaccination.status === "completed" ? "bg-green-100" : 
                                vaccination.status === "due" ? "bg-blue-100" : "bg-amber-100"
                              }`}>
                                <Heart className={`h-6 w-6 ${
                                  vaccination.status === "completed" ? "text-green-600" : 
                                  vaccination.status === "due" ? "text-blue-600" : "text-amber-600"
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-lg">{vaccination.name}</p>
                                <p className="text-muted-foreground">
                                  {vaccination.status === "completed" 
                                    ? `Completed on ${vaccination.date}` 
                                    : `Due on ${vaccination.date}`}
                                </p>
                              </div>
                            </div>
                            <Badge variant={
                              vaccination.status === "completed" ? "success" : 
                              vaccination.status === "due" ? "default" : "outline"
                            }>
                              {vaccination.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
