"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useParams } from "next/navigation"
import { Search, Plus, Bed, Users, Clock, Activity } from "lucide-react"

const hospitalNames = {
  "smart-hospital": "Smart Hospital & Research Center",
  "city-medical": "City Medical Center",
  "general-hospital": "General Hospital",
}

export default function IPDPage() {
  const params = useParams()
  const hospitalSlug = params?.hospitalName as string
  const hospitalName = hospitalNames[hospitalSlug as keyof typeof hospitalNames] || "Hospital"

  const ipdPatients = [
    {
      id: "IPD-001",
      patient: "John Doe",
      room: "101",
      bed: "A",
      doctor: "Dr. Smith",
      admission: "2025-05-20",
      condition: "Stable",
      department: "Cardiology",
    },
    {
      id: "IPD-002",
      patient: "Jane Smith",
      room: "102",
      bed: "B",
      doctor: "Dr. Johnson",
      admission: "2025-05-19",
      condition: "Critical",
      department: "ICU",
    },
    {
      id: "IPD-003",
      patient: "Mike Johnson",
      room: "103",
      bed: "A",
      doctor: "Dr. Brown",
      admission: "2025-05-18",
      condition: "Recovering",
      department: "Orthopedics",
    },
    {
      id: "IPD-004",
      patient: "Sarah Wilson",
      room: "201",
      bed: "C",
      doctor: "Dr. Davis",
      admission: "2025-05-17",
      condition: "Stable",
      department: "Pediatrics",
    },
    {
      id: "IPD-005",
      patient: "David Brown",
      room: "202",
      bed: "A",
      doctor: "Dr. Miller",
      admission: "2025-05-16",
      condition: "Improving",
      department: "Surgery",
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to {hospitalName} - IPD (In Patient Department)
        </h1>
        <p className="text-gray-600">Manage inpatient admissions and bed occupancy</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Beds</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85/120</div>
            <p className="text-xs text-muted-foreground">70.8% occupancy rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground">+5 new admissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Patients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">Days average stay</p>
          </CardContent>
        </Card>
      </div>

      {/* IPD Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Inpatients</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search patients..." className="pl-8 w-64" />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Admission
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IPD ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Room/Bed</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Admission Date</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ipdPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.id}</TableCell>
                  <TableCell>{patient.patient}</TableCell>
                  <TableCell>
                    {patient.room}/{patient.bed}
                  </TableCell>
                  <TableCell>{patient.doctor}</TableCell>
                  <TableCell>{patient.department}</TableCell>
                  <TableCell>{patient.admission}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        patient.condition === "Critical"
                          ? "destructive"
                          : patient.condition === "Stable"
                            ? "default"
                            : patient.condition === "Recovering" || patient.condition === "Improving"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {patient.condition}
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
