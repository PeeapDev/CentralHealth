"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useParams } from "next/navigation"
import { Search, Plus, Users, Clock, Stethoscope, FileText } from "lucide-react"

const hospitalNames = {
  "smart-hospital": "Smart Hospital & Research Center",
  "city-medical": "City Medical Center",
  "general-hospital": "General Hospital",
}

export default function OPDPage() {
  const params = useParams()
  const hospitalSlug = params?.hospitalName as string
  const hospitalName = hospitalNames[hospitalSlug as keyof typeof hospitalNames] || "Hospital"

  const opdPatients = [
    {
      id: "OPD-001",
      patient: "John Doe",
      doctor: "Dr. Smith",
      department: "Cardiology",
      time: "09:00 AM",
      status: "Waiting",
      priority: "Normal",
    },
    {
      id: "OPD-002",
      patient: "Jane Smith",
      doctor: "Dr. Johnson",
      department: "Neurology",
      time: "09:30 AM",
      status: "In Progress",
      priority: "High",
    },
    {
      id: "OPD-003",
      patient: "Mike Johnson",
      doctor: "Dr. Brown",
      department: "Orthopedics",
      time: "10:00 AM",
      status: "Completed",
      priority: "Normal",
    },
    {
      id: "OPD-004",
      patient: "Sarah Wilson",
      doctor: "Dr. Davis",
      department: "Pediatrics",
      time: "10:30 AM",
      status: "Waiting",
      priority: "Urgent",
    },
    {
      id: "OPD-005",
      patient: "David Brown",
      doctor: "Dr. Miller",
      department: "Dermatology",
      time: "11:00 AM",
      status: "Waiting",
      priority: "Normal",
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to {hospitalName} - OPD (Out Patient Department)
        </h1>
        <p className="text-gray-600">Manage outpatient consultations and appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Average wait: 15 min</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Currently consulting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31</div>
            <p className="text-xs text-muted-foreground">Today's consultations</p>
          </CardContent>
        </Card>
      </div>

      {/* OPD Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>OPD Queue</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search patients..." className="pl-8 w-64" />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OPD ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opdPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.id}</TableCell>
                  <TableCell>{patient.patient}</TableCell>
                  <TableCell>{patient.doctor}</TableCell>
                  <TableCell>{patient.department}</TableCell>
                  <TableCell>{patient.time}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        patient.priority === "Urgent"
                          ? "destructive"
                          : patient.priority === "High"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {patient.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        patient.status === "Completed"
                          ? "default"
                          : patient.status === "In Progress"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Update
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
