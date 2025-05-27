"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Users, UserPlus, Activity, Calendar, FileText, Download, Filter, Heart } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

// FHIR Types
interface FHIRPatient {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  active: boolean;
  name: Array<{
    use?: string;
    text?: string;
    family: string;
    given: string[];
  }>;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  gender?: string;
  birthDate?: string;
  address?: Array<{
    use?: string;
    type?: string;
    text?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  contact?: Array<{
    relationship?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    }>;
    name?: {
      use?: string;
      text?: string;
      family?: string;
      given?: string[];
    };
    telecom?: Array<{
      system?: string;
      value?: string;
      use?: string;
    }>;
  }>;
}

interface PatientsPageProps {
  params: { hospitalName: string }
}

export default function PatientsPage({ params }: PatientsPageProps) {
  const { hospitalName } = params;
  const formattedHospitalName = hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fhirPatients, setFhirPatients] = useState<FHIRPatient[]>([]);

  const patients = [
    {
      id: "PAT001",
      name: "Alice Johnson",
      age: 45,
      gender: "Female",
      phone: "+1 (555) 123-4567",
      email: "alice.johnson@email.com",
      bloodType: "A+",
      status: "Active",
      lastVisit: "2024-05-24",
      doctor: "Dr. Smith",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "PAT002",
      name: "Robert Davis",
      age: 62,
      gender: "Male",
      phone: "+1 (555) 987-6543",
      email: "robert.davis@email.com",
      bloodType: "O-",
      status: "Admitted",
      lastVisit: "2024-05-23",
      doctor: "Dr. Wilson",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "PAT003",
      name: "Maria Garcia",
      age: 34,
      gender: "Female",
      phone: "+1 (555) 456-7890",
      email: "maria.garcia@email.com",
      bloodType: "B+",
      status: "Discharged",
      lastVisit: "2024-05-20",
      doctor: "Dr. Brown",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "Admitted":
        return <Badge className="bg-blue-500 text-white">Admitted</Badge>
      case "Discharged":
        return <Badge className="bg-gray-500 text-white">Discharged</Badge>
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - Patient Management`}
        description="Manage patient records, admissions, and medical history"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Patient Management" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+127 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admitted Today</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+5 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Patients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Scheduled visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Directory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Patient Directory (FHIR-Compliant)</CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      FHIR Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter patients using FHIR search parameters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search patients..." className="pl-10" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Assigned Doctor</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={patient.avatar || "/placeholder.svg"} alt={patient.name} />
                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-gray-500">{patient.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{patient.age} years</div>
                        <div className="text-sm text-gray-500">{patient.gender}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{patient.phone}</div>
                        <div className="text-sm text-gray-500">{patient.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {patient.bloodType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === "Active" ? "outline" : "secondary"} className="flex items-center gap-1">
                        {patient.status === "Active" && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {patient.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        FHIR: {patient.status === "Active" ? "active=true" : "active=false"}
                      </div>
                    </TableCell>
                    <TableCell>{patient.lastVisit}</TableCell>
                    <TableCell>{patient.doctor}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
