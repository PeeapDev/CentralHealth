import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Truck, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface AmbulancePageProps {
  params: { hospitalName: string }
}

export default function AmbulancePage({ params }: AmbulancePageProps) {
  const hospitalName = params.hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  const ambulances = [
    {
      id: "AMB001",
      vehicleNumber: "AMB-2024-001",
      driver: "John Smith",
      paramedic: "Sarah Johnson",
      status: "Available",
      location: "Hospital Parking",
      lastService: "2024-05-20",
      mileage: "45,230 km",
    },
    {
      id: "AMB002",
      vehicleNumber: "AMB-2024-002",
      driver: "Mike Wilson",
      paramedic: "Emily Brown",
      status: "On Call",
      location: "Downtown Area",
      lastService: "2024-05-15",
      mileage: "38,450 km",
    },
    {
      id: "AMB003",
      vehicleNumber: "AMB-2024-003",
      driver: "David Lee",
      paramedic: "Lisa Davis",
      status: "Maintenance",
      location: "Service Center",
      lastService: "2024-05-24",
      mileage: "52,100 km",
    },
  ]

  const emergencyCalls = [
    {
      id: "CALL001",
      patientName: "Emergency Call",
      location: "123 Main St",
      priority: "High",
      status: "Dispatched",
      ambulanceId: "AMB002",
      callTime: "14:30",
      eta: "5 mins",
    },
    {
      id: "CALL002",
      patientName: "Medical Emergency",
      location: "456 Oak Ave",
      priority: "Medium",
      status: "Completed",
      ambulanceId: "AMB001",
      callTime: "13:15",
      eta: "Completed",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        )
      case "On Call":
        return (
          <Badge className="bg-blue-500 text-white">
            <Truck className="h-3 w-3 mr-1" />
            On Call
          </Badge>
        )
      case "Maintenance":
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        )
      case "Dispatched":
        return (
          <Badge className="bg-orange-500 text-white">
            <MapPin className="h-3 w-3 mr-1" />
            Dispatched
          </Badge>
        )
      case "Completed":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge variant="destructive">High Priority</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500 text-white">Medium Priority</Badge>
      case "Low":
        return <Badge className="bg-green-500 text-white">Low Priority</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - Ambulance Services`}
        description="Manage ambulance fleet, emergency calls, and dispatch operations"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Ambulance Services" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ambulances</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">6 available, 2 on call</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Calls Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+5 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.5 min</div>
            <p className="text-xs text-muted-foreground">-1.2 min from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Rescues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Success rate this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Ambulance Fleet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ambulance Fleet</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Ambulance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle ID</TableHead>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Paramedic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Location</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ambulances.map((ambulance) => (
                  <TableRow key={ambulance.id}>
                    <TableCell className="font-medium">{ambulance.id}</TableCell>
                    <TableCell>{ambulance.vehicleNumber}</TableCell>
                    <TableCell>{ambulance.driver}</TableCell>
                    <TableCell>{ambulance.paramedic}</TableCell>
                    <TableCell>{getStatusBadge(ambulance.status)}</TableCell>
                    <TableCell>{ambulance.location}</TableCell>
                    <TableCell>{ambulance.lastService}</TableCell>
                    <TableCell>{ambulance.mileage}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Track
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Calls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Emergency Calls</CardTitle>
            <Button variant="destructive">
              <Plus className="h-4 w-4 mr-2" />
              Emergency Dispatch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ambulance</TableHead>
                  <TableHead>Call Time</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencyCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">{call.id}</TableCell>
                    <TableCell>{call.patientName}</TableCell>
                    <TableCell>{call.location}</TableCell>
                    <TableCell>{getPriorityBadge(call.priority)}</TableCell>
                    <TableCell>{getStatusBadge(call.status)}</TableCell>
                    <TableCell>{call.ambulanceId}</TableCell>
                    <TableCell>{call.callTime}</TableCell>
                    <TableCell>{call.eta}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
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
