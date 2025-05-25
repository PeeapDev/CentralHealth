import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Pill, Package, AlertTriangle, TrendingUp } from "lucide-react"

interface PharmacyPageProps {
  params: { hospitalName: string }
}

export default function PharmacyPage({ params }: PharmacyPageProps) {
  const hospitalName = params.hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  const medications = [
    {
      id: "MED001",
      name: "Paracetamol 500mg",
      category: "Analgesic",
      stock: 250,
      minStock: 50,
      price: "$2.50",
      supplier: "PharmaCorp",
      expiry: "2025-12-31",
      status: "In Stock",
    },
    {
      id: "MED002",
      name: "Amoxicillin 250mg",
      category: "Antibiotic",
      stock: 15,
      minStock: 25,
      price: "$5.75",
      supplier: "MediSupply",
      expiry: "2024-08-15",
      status: "Low Stock",
    },
    {
      id: "MED003",
      name: "Insulin Glargine",
      category: "Diabetes",
      stock: 0,
      minStock: 10,
      price: "$45.00",
      supplier: "DiabetesCare",
      expiry: "2024-06-30",
      status: "Out of Stock",
    },
  ]

  const getStatusBadge = (status: string, stock: number, minStock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (stock <= minStock) {
      return <Badge className="bg-yellow-500 text-white">Low Stock</Badge>
    } else {
      return <Badge className="bg-green-500 text-white">In Stock</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - Pharmacy Management`}
        description="Manage medication inventory, prescriptions, and pharmacy operations"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Pharmacy" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+15 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,847</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions Today</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5 from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Medication Inventory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medication Inventory</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search medications..." className="pl-10" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.id}</TableCell>
                    <TableCell>{med.name}</TableCell>
                    <TableCell>{med.category}</TableCell>
                    <TableCell>
                      <span className={med.stock <= med.minStock ? "text-red-600 font-semibold" : ""}>{med.stock}</span>
                      <span className="text-gray-500 text-sm"> / {med.minStock} min</span>
                    </TableCell>
                    <TableCell>{med.price}</TableCell>
                    <TableCell>{med.supplier}</TableCell>
                    <TableCell>{med.expiry}</TableCell>
                    <TableCell>{getStatusBadge(med.status, med.stock, med.minStock)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
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
