"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useParams } from "next/navigation"
import { Search, Plus, FileText, DollarSign, CreditCard, Receipt } from "lucide-react"

const hospitalNames = {
  "smart-hospital": "Smart Hospital & Research Center",
  "city-medical": "City Medical Center",
  "general-hospital": "General Hospital",
}

export default function BillingPage() {
  const params = useParams()
  const hospitalSlug = params?.hospitalName as string
  const hospitalName = hospitalNames[hospitalSlug as keyof typeof hospitalNames] || "Hospital"

  const recentBills = [
    { id: "INV-001", patient: "John Doe", amount: "$1,250.00", status: "Paid", date: "2025-05-20", type: "OPD" },
    { id: "INV-002", patient: "Jane Smith", amount: "$3,450.00", status: "Pending", date: "2025-05-19", type: "IPD" },
    { id: "INV-003", patient: "Mike Johnson", amount: "$850.00", status: "Paid", date: "2025-05-18", type: "Pharmacy" },
    {
      id: "INV-004",
      patient: "Sarah Wilson",
      amount: "$2,100.00",
      status: "Overdue",
      date: "2025-05-15",
      type: "Surgery",
    },
    { id: "INV-005", patient: "David Brown", amount: "$650.00", status: "Paid", date: "2025-05-14", type: "Lab" },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to {hospitalName} - Billing Management</h1>
        <p className="text-gray-600">Manage patient billing, invoices, and payment processing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">-4 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Today</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,234</div>
            <p className="text-xs text-muted-foreground">+19% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">-2 from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bills</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search bills..." className="pl-8 w-64" />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.id}</TableCell>
                  <TableCell>{bill.patient}</TableCell>
                  <TableCell>{bill.type}</TableCell>
                  <TableCell>{bill.amount}</TableCell>
                  <TableCell>{bill.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        bill.status === "Paid" ? "default" : bill.status === "Pending" ? "secondary" : "destructive"
                      }
                    >
                      {bill.status}
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
