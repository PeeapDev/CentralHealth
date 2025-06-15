"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Search,
  Filter,
  Video,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Spinner } from "@/components/ui/spinner"
import { usePatientData } from "@/hooks/use-patient-data"
import { useAppointments } from "@/hooks/use-appointments"

export default function AppointmentsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("appointments")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use hooks to fetch patient and appointments data
  const { patient } = usePatientData()
  const { upcomingAppointments, pastAppointments, isLoading, error } = useAppointments()

  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "appointments") {
      setCurrentPage("appointments")
    } else {
      router.push(`/patient/${page}`)
    }
  }
  
  // Handle search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }
  
  // Filter appointments based on search query
  const filteredUpcoming = searchQuery.trim() === "" 
    ? upcomingAppointments 
    : upcomingAppointments.filter(apt => {
        const searchLower = searchQuery.toLowerCase();
        return apt.title.toLowerCase().includes(searchLower) || 
               apt.doctor.toLowerCase().includes(searchLower) || 
               apt.location.toLowerCase().includes(searchLower);
      });
      
  const filteredPast = searchQuery.trim() === "" 
    ? pastAppointments 
    : pastAppointments.filter(apt => {
        const searchLower = searchQuery.toLowerCase();
        return apt.title.toLowerCase().includes(searchLower) || 
               apt.doctor.toLowerCase().includes(searchLower) || 
               apt.location.toLowerCase().includes(searchLower);
      });


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Appointments" }]}
    >
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Spinner className="w-10 h-10 mb-2" />
              <p className="text-gray-500">Loading appointments...</p>
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
        ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600">Manage your medical appointments and consultations for ID: {patient?.patientId || 'Loading...'}</p>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Schedule Appointment</span>
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search appointments..." 
                className="pl-10" 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>

          {/* Appointments Tabs */}
          <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            {/* Upcoming Appointments */}
            <TabsContent value="upcoming" className="space-y-4">
              {filteredUpcoming?.length === 0 ? (
                <div className="py-10 text-center bg-white border rounded-lg">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No upcoming appointments</h3>
                  <p className="text-gray-500">
                    {searchQuery ? "Try adjusting your search criteria" : "You don't have any upcoming appointments scheduled"}
                  </p>
                </div>
              ) : filteredUpcoming?.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={appointment.doctor} />
                          <AvatarFallback>{appointment.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{appointment.title}</h3>
                          <p className="text-gray-600">{appointment.doctor}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{appointment.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{appointment.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {appointment.type === "Video Call" ? (
                            <Video className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="text-sm text-gray-600">{appointment.type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(appointment.status)}
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                      {appointment.type === "Video Call" && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Join Call
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Past Appointments */}
            <TabsContent value="past" className="space-y-4">
              {filteredPast?.length === 0 ? (
                <div className="py-10 text-center bg-white border rounded-lg">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No past appointments</h3>
                  <p className="text-gray-500">
                    {searchQuery ? "Try adjusting your search criteria" : "You don't have any past appointment records"}
                  </p>
                </div>
              ) : filteredPast?.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={appointment.doctor} />
                          <AvatarFallback>{appointment.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{appointment.title}</h3>
                          <p className="text-gray-600">{appointment.doctor}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{appointment.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{appointment.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(appointment.status)}
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        View Summary
                      </Button>
                      <Button variant="outline" size="sm">
                        Book Follow-up
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
        )}
      </div>
    </DashboardLayout>
  )
}
