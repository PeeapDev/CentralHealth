"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Download, Eye, CreditCard, Calendar, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"

export default function BillingPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("billing")
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "billing") {
      setCurrentPage("billing")
    } else {
      router.push(`/patient/${page}`)
    }
  }
  
  const billingData = {
    patientId: "J8K9M",
    totalOutstanding: 2450.75,
    totalPaid: 8750.25,
    insuranceCoverage: 85,
    nextPaymentDue: "Nov 15, 2024",
  }

  const bills = [
    {
      id: 1,
      invoiceNumber: "INV-2024-001",
      description: "Emergency Room Visit",
      date: "Oct 15, 2024",
      amount: 1250.0,
      insuranceCovered: 1000.0,
      patientResponsibility: 250.0,
      status: "Paid",
      dueDate: "Oct 30, 2024",
      linkedId: "J8K9M",
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-002",
      description: "Laboratory Tests",
      date: "Oct 16, 2024",
      amount: 450.75,
      insuranceCovered: 360.6,
      patientResponsibility: 90.15,
      status: "Pending",
      dueDate: "Nov 15, 2024",
      linkedId: "J8K9M",
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-003",
      description: "Cardiology Consultation",
      date: "Oct 16, 2024",
      amount: 350.0,
      insuranceCovered: 280.0,
      patientResponsibility: 70.0,
      status: "Overdue",
      dueDate: "Oct 31, 2024",
      linkedId: "J8K9M",
    },
    {
      id: 4,
      invoiceNumber: "INV-2024-004",
      description: "Prescription Medications",
      date: "Oct 12, 2024",
      amount: 125.5,
      insuranceCovered: 100.4,
      patientResponsibility: 25.1,
      status: "Paid",
      dueDate: "Oct 27, 2024",
      linkedId: "J8K9M",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const pendingBills = bills.filter((bill) => bill.status === "Pending" || bill.status === "Overdue")
  const totalPending = pendingBills.reduce((sum, bill) => sum + bill.patientResponsibility, 0)
  
  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Billing" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
            <p className="text-gray-600">
              Manage your medical bills and payment history for Patient ID: {billingData.patientId}
            </p>
          </div>
          <Button className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Make Payment</span>
          </Button>
        </div>

        {/* Billing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${billingData.totalOutstanding.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Due by {billingData.nextPaymentDue}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${billingData.totalPaid.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">This year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Insurance Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{billingData.insuranceCoverage}%</div>
              <Progress value={billingData.insuranceCoverage} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingBills.length}</div>
              <p className="text-xs text-gray-500 mt-1">${totalPending.toFixed(2)} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Outstanding Bills Alert */}
        {pendingBills.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-800">Payment Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">
                You have {pendingBills.length} outstanding bill(s) totaling ${totalPending.toFixed(2)}. Please review and
                make payment to avoid late fees.
              </p>
              <Button className="mt-3 bg-orange-600 hover:bg-orange-700">Pay Now</Button>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search bills..." className="pl-10" />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          {bills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{bill.description}</CardTitle>
                    <CardDescription>
                      Invoice: {bill.invoiceNumber} • {bill.date} • Patient ID: {bill.linkedId}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Total Amount</div>
                    <div className="font-medium text-lg">${bill.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Insurance Covered</div>
                    <div className="font-medium text-green-600">${bill.insuranceCovered.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Your Responsibility</div>
                    <div className="font-medium text-blue-600">${bill.patientResponsibility.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Due Date</div>
                    <div className="font-medium flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{bill.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                  {(bill.status === "Pending" || bill.status === "Overdue") && (
                    <Button size="sm" className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Pay ${bill.patientResponsibility.toFixed(2)}</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
