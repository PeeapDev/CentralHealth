"use client"

import { useState } from 'react'
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Receipt, Download, Eye, ArrowRight } from "lucide-react"

export default function InvoicesPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("invoices")
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "invoices") {
      setCurrentPage("invoices")
    } else {
      // Navigate to other pages
      router.push(`/patient/${page}`)
    }
  }
  
  // Sample invoices data
  const invoices = [
    {
      id: "INV-2025-0042",
      description: "Hospital Admission - Cardiology",
      date: "May 22, 2025",
      dueDate: "June 21, 2025",
      amount: "$2,200.00",
      status: "Unpaid"
    },
    {
      id: "INV-2025-0038",
      description: "Laboratory Services",
      date: "May 15, 2025",
      dueDate: "June 14, 2025",
      amount: "$450.00",
      status: "Unpaid"
    },
    {
      id: "INV-2025-0031",
      description: "Specialist Consultation",
      date: "April 28, 2025",
      dueDate: "May 28, 2025",
      amount: "$350.00",
      status: "Processing Payment"
    },
    {
      id: "INV-2025-0024",
      description: "Emergency Room Services",
      date: "April 5, 2025",
      dueDate: "May 5, 2025",
      amount: "$1,800.00",
      status: "Paid"
    },
    {
      id: "INV-2025-0015",
      description: "Outpatient Procedure",
      date: "March 12, 2025",
      dueDate: "April 11, 2025",
      amount: "$1,250.00",
      status: "Paid"
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Unpaid": return "bg-red-100 text-red-800";
      case "Processing Payment": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Invoices" }]}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-lg">All Invoices</h2>
            <Button variant="ghost" size="sm" className="text-sm">Filter</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Issued
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <Receipt className="h-4 w-4 text-gray-500 mr-2" />
                        {invoice.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {invoice.status === "Unpaid" && (
                          <Button size="sm">Pay Now</Button>
                        )}
                        {invoice.status === "Paid" && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
