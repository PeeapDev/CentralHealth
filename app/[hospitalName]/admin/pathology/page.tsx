import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, TestTube, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface PathologyPageProps {
  params: { hospitalName: string }
}

export default function PathologyPage({ params }: PathologyPageProps) {
  const hospitalName = params.hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  const tests = [
    {
      id: "LAB001",
      patientName: "John Doe",
      testType: "Complete Blood Count",
      doctor: "Dr. Smith",
      status: "Completed",
      priority: "Normal",
      sampleDate: "2024-05-24",
      resultDate: "2024-05-24",
      cost: "$45.00",
    },
    {
      id: "LAB002",
      patientName: "Jane Smith",
      testType: "Liver Function Test",
      doctor: "Dr. Johnson",
      status: "In Progress",
      priority: "Urgent",
      sampleDate: "2024-05-24",
      resultDate: "Pending",
      cost: "$75.00",
    },
    {
      id: "LAB003",
      patientName: "Mike Wilson",
      testType: "Thyroid Function",
      doctor: "Dr. Brown",
      status: "Sample Collected",
      priority: "Normal",
      sampleDate: "2024-05-23",
      resultDate: "Pending",
      cost: "$60.00",
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
            <TestTube className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "Sample Collected":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Sample Collected
          </Badge>
        )
      case "Pending":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Urgent
          </Badge>
        )
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
        title={`Welcome to ${hospitalName} - Pathology Department`}
        description="Manage laboratory tests, samples, and pathology reports"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Pathology" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Today</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+8 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">Results delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,340</div>
            <p className="text-xs text-muted-foreground">+15% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Laboratory Tests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Laboratory Tests</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Test Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search tests..." className="pl-10" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sample Date</TableHead>
                  <TableHead>Result Date</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.id}</TableCell>
                    <TableCell>{test.patientName}</TableCell>
                    <TableCell>{test.testType}</TableCell>
                    <TableCell>{test.doctor}</TableCell>
                    <TableCell>{getPriorityBadge(test.priority)}</TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell>{test.sampleDate}</TableCell>
                    <TableCell>{test.resultDate}</TableCell>
                    <TableCell>{test.cost}</TableCell>
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
