import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Scan, Clock, CheckCircle, Camera } from "lucide-react"

interface RadiologyPageProps {
  params: { hospitalName: string }
}

export default function RadiologyPage({ params }: RadiologyPageProps) {
  const hospitalName = params.hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  const scans = [
    {
      id: "RAD001",
      patientName: "John Doe",
      scanType: "Chest X-Ray",
      doctor: "Dr. Smith",
      status: "Completed",
      priority: "Normal",
      scheduledDate: "2024-05-24",
      completedDate: "2024-05-24",
      cost: "$120.00",
      technician: "Tech. Johnson",
    },
    {
      id: "RAD002",
      patientName: "Jane Smith",
      scanType: "MRI Brain",
      doctor: "Dr. Wilson",
      status: "In Progress",
      priority: "Urgent",
      scheduledDate: "2024-05-24",
      completedDate: "Pending",
      cost: "$850.00",
      technician: "Tech. Brown",
    },
    {
      id: "RAD003",
      patientName: "Mike Davis",
      scanType: "CT Abdomen",
      doctor: "Dr. Miller",
      status: "Scheduled",
      priority: "Normal",
      scheduledDate: "2024-05-25",
      completedDate: "Pending",
      cost: "$450.00",
      technician: "Tech. Wilson",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "In Progress":
        return (
          <Badge className="bg-blue-500 text-white">
            <Scan className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "Scheduled":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        )
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "Normal":
        return <Badge className="bg-green-500 text-white">Normal</Badge>
      case "Routine":
        return <Badge variant="outline">Routine</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - Radiology Department`}
        description="Manage imaging studies, scans, and radiology reports"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Radiology" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Today</CardTitle>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">+5 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Active</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12/14</div>
            <p className="text-xs text-muted-foreground">2 under maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,450</div>
            <p className="text-xs text-muted-foreground">+18% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Radiology Studies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Radiology Studies</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Scan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search scans..." className="pl-10" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Study ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Scan Type</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">{scan.id}</TableCell>
                    <TableCell>{scan.patientName}</TableCell>
                    <TableCell>{scan.scanType}</TableCell>
                    <TableCell>{scan.doctor}</TableCell>
                    <TableCell>{scan.technician}</TableCell>
                    <TableCell>{getPriorityBadge(scan.priority)}</TableCell>
                    <TableCell>{getStatusBadge(scan.status)}</TableCell>
                    <TableCell>{scan.scheduledDate}</TableCell>
                    <TableCell>{scan.cost}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
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
