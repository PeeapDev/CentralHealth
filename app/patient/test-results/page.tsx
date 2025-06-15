"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Eye, TrendingUp, TrendingDown, Minus, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"

export default function TestResultsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("test-results")
  const [activeTab, setActiveTab] = useState("recent")
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "test-results") {
      setCurrentPage("test-results")
    } else {
      router.push(`/patient/${page}`)
    }
  }

  const testResults = [
    {
      id: 1,
      name: "Complete Blood Count (CBC)",
      date: "Oct 16, 2024",
      time: "9:30 AM",
      status: "Normal",
      doctor: "Dr. Sarah Johnson",
      category: "Blood Work",
      results: [
        { parameter: "White Blood Cells", value: "7.2", unit: "K/uL", range: "4.0-11.0", status: "normal" },
        { parameter: "Red Blood Cells", value: "4.8", unit: "M/uL", range: "4.2-5.4", status: "normal" },
        { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", range: "12.0-16.0", status: "normal" },
        { parameter: "Platelets", value: "285", unit: "K/uL", range: "150-450", status: "normal" },
      ],
    },
    {
      id: 2,
      name: "Comprehensive Metabolic Panel",
      date: "Oct 16, 2024",
      time: "9:30 AM",
      status: "Abnormal",
      doctor: "Dr. Sarah Johnson",
      category: "Blood Work",
      results: [
        { parameter: "Glucose", value: "145", unit: "mg/dL", range: "70-100", status: "high" },
        { parameter: "Sodium", value: "140", unit: "mEq/L", range: "136-145", status: "normal" },
        { parameter: "Potassium", value: "4.1", unit: "mEq/L", range: "3.5-5.0", status: "normal" },
        { parameter: "Creatinine", value: "1.0", unit: "mg/dL", range: "0.7-1.3", status: "normal" },
      ],
    },
    {
      id: 3,
      name: "Chest X-Ray",
      date: "Oct 15, 2024",
      time: "2:15 PM",
      status: "Normal",
      doctor: "Dr. Michael Roberts",
      category: "Imaging",
      findings: "No acute cardiopulmonary abnormalities. Heart size normal. Lungs clear.",
    },
    {
      id: 4,
      name: "Lipid Panel",
      date: "Oct 10, 2024",
      time: "8:00 AM",
      status: "Borderline",
      doctor: "Dr. Sarah Johnson",
      category: "Blood Work",
      results: [
        { parameter: "Total Cholesterol", value: "205", unit: "mg/dL", range: "<200", status: "high" },
        { parameter: "LDL Cholesterol", value: "130", unit: "mg/dL", range: "<100", status: "high" },
        { parameter: "HDL Cholesterol", value: "45", unit: "mg/dL", range: ">40", status: "normal" },
        { parameter: "Triglycerides", value: "150", unit: "mg/dL", range: "<150", status: "normal" },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
        return "bg-green-100 text-green-800"
      case "abnormal":
        return "bg-red-100 text-red-800"
      case "borderline":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getParameterStatus = (status: string) => {
    switch (status) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "low":
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      case "normal":
        return <Minus className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getParameterColor = (status: string) => {
    switch (status) {
      case "high":
        return "text-red-600"
      case "low":
        return "text-blue-600"
      case "normal":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Test Results" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
            <p className="text-gray-600">View and track your medical test results</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search test results..." className="pl-10" />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <CardDescription>
                      {test.date} at {test.time} • Ordered by {test.doctor}
                    </CardDescription>
                    <Badge variant="outline" className="w-fit">
                      {test.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {test.results ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Test Parameters</h4>
                    <div className="space-y-2">
                      {test.results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getParameterStatus(result.status)}
                            <div>
                              <div className="font-medium">{result.parameter}</div>
                              <div className="text-sm text-gray-500">Normal range: {result.range}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${getParameterColor(result.status)}`}>
                              {result.value} {result.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : test.findings ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Findings</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{test.findings}</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
