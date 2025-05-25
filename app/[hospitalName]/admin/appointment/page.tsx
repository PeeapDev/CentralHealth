"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useParams } from "next/navigation"
import { Search, Plus, Calendar, Clock, User, Stethoscope } from "lucide-react"

const hospitalNames = {
  "smart-hospital": "Smart Hospital & Research Center",
  "city-medical": "City Medical Center",
  "general-hospital": "General Hospital",
}

export default function AppointmentPage() {
  const params = useParams()
  const hospitalSlug = params?.hospitalName as string
  const hospitalName = hospitalNames[hospitalSlug as keyof typeof hospitalNames] || "Hospital"

  const appointments = [
    {
      id: "APT-001",
      patient: "John Doe",
      doctor: "Dr. Smith",
      department: "Cardiology",
      time: "09:00 AM",
      date: "2025-05-24",
      status: "Confirmed",
    },
    {
      id: "APT-002",
      patient: "Jane Smith",
      doctor: "Dr. Johnson",
      department: "Neurology",
      time: "10:30 AM",
      date: "2025-05-24",
      status: "Pending",
    },
    {
      id: "APT-003",
      patient: "Mike Johnson",
      doctor: "Dr. Brown",
      department: "Orthopedics",
      time: "02:00 PM",
      date: "2025-05-24",
      status: "Confirmed",
    },
    {
      id: "APT-004",
      patient: "Sarah Wilson",
      doctor: "Dr. Davis",
      department: "Pediatrics",
      time: "03:30 PM",
      date: "2025-05-24",
      status: "Cancelled",
    },
    {
      id: "APT-005",
      patient: "David Brown",
      doctor: "Dr. Miller",
      department: "Dermatology",
      time: "04:00 PM",
      date: "2025-05-24",
      status: "Confirmed",
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to {hospitalName} - Appointment Management</h1>
        <p className="text-gray-600">Schedule and manage patient appointments with doctors</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">75% confirmation rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Currently on duty</p>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Appointments</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search appointments..." className="pl-8 w-64" />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appointment ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.id}</TableCell>
                  <TableCell>{appointment.patient}</TableCell>
                  <TableCell>{appointment.doctor}</TableCell>
                  <TableCell>{appointment.department}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appointment.status === "Confirmed"
                          ? "default"
                          : appointment.status === "Pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
