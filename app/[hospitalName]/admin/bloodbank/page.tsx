import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Droplets, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface BloodBankPageProps {
  params: { hospitalName: string }
}

export default function BloodBankPage({ params }: BloodBankPageProps) {
  const hospitalName = params.hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  const bloodInventory = [
    {
      bloodType: "A+",
      units: 45,
      minUnits: 20,
      expiryDate: "2024-06-15",
      status: "Good Stock",
      lastDonation: "2024-05-23",
    },
    {
      bloodType: "O-",
      units: 8,
      minUnits: 15,
      expiryDate: "2024-06-10",
      status: "Low Stock",
      lastDonation: "2024-05-20",
    },
    {
      bloodType: "B+",
      units: 32,
      minUnits: 25,
      expiryDate: "2024-06-20",
      status: "Good Stock",
      lastDonation: "2024-05-24",
    },
    {
      bloodType: "AB-",
      units: 3,
      minUnits: 10,
      expiryDate: "2024-06-08",
      status: "Critical",
      lastDonation: "2024-05-18",
    },
  ]

  const getStatusBadge = (status: string, units: number, minUnits: number) => {
    if (units <= minUnits * 0.5) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      )
    } else if (units <= minUnits) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Low Stock
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Good Stock
        </Badge>
      )
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - Blood Bank Management`}
        description="Manage blood inventory, donations, and transfusion services"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Blood Bank" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">347</div>
            <p className="text-xs text-muted-foreground">All blood types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Types</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations Today</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfusions Today</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Blood Inventory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Blood Inventory</CardTitle>
            <div className="space-x-2">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Record Donation
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Blood Request
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Available Units</TableHead>
                  <TableHead>Minimum Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Last Donation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bloodInventory.map((blood) => (
                  <TableRow key={blood.bloodType}>
                    <TableCell className="font-medium text-lg">
                      <div className="flex items-center space-x-2">
                        <Droplets className="h-5 w-5 text-red-500" />
                        <span>{blood.bloodType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          blood.units <= blood.minUnits ? "text-red-600 font-semibold text-lg" : "text-lg font-semibold"
                        }
                      >
                        {blood.units}
                      </span>
                      <span className="text-gray-500 text-sm"> units</span>
                    </TableCell>
                    <TableCell>{blood.minUnits} units</TableCell>
                    <TableCell>{getStatusBadge(blood.status, blood.units, blood.minUnits)}</TableCell>
                    <TableCell>{blood.expiryDate}</TableCell>
                    <TableCell>{blood.lastDonation}</TableCell>
                    <TableCell>
                      <div className="space-x-2">
                        <Button variant="ghost" size="sm">
                          Request
                        </Button>
                        <Button variant="ghost" size="sm">
                          Details
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
