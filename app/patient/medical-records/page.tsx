"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Download, Eye, FileText, Clock, Stethoscope, Calendar, Image as ImageIcon, TestTube, Pill, Scissors } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Spinner } from "@/components/ui/spinner"
import { usePatientData } from "@/hooks/use-patient-data"
import { useMedicalRecords } from "@/hooks/use-medical-records"

export default function MedicalRecordsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("medical-records")
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use hooks to fetch patient and medical record data
  const { patient } = usePatientData()
  const { medicalRecords, isLoading, error } = useMedicalRecords()

  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "medical-records") {
      setCurrentPage("medical-records")
    } else {
      router.push(`/patient/${page}`)
    }
  }

  
  // Filter records based on active tab
  const filteredRecords = activeTab === "all" 
    ? medicalRecords 
    : medicalRecords.filter(record => record.type.toLowerCase() === activeTab.toLowerCase())

  // Handle search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Records after search filter
  const searchedRecords = searchQuery.trim() === "" 
    ? filteredRecords 
    : filteredRecords.filter(record => 
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.category.toLowerCase().includes(searchQuery.toLowerCase())
      )

  // Get status badge color based on status
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Medical Records" }]}
    >
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Spinner className="w-10 h-10 mb-2" />
              <p className="text-gray-500">Loading medical records...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-lg border border-red-200 bg-red-50">
            <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
        <>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Medical Records</h1>
            <p className="text-gray-500 mt-1">Complete medical history for Patient ID: {patient?.patientId || 'Loading...'}</p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <span className="mr-2">+</span> Request Records
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search medical records..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <Button variant="outline" className="flex-shrink-0">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto mb-4">
            <TabsTrigger value="all" className="flex-grow">All Records</TabsTrigger>
            <TabsTrigger value="consultation" className="flex-grow">Consultations</TabsTrigger>
            <TabsTrigger value="lab report" className="flex-grow">Lab Reports</TabsTrigger>
            <TabsTrigger value="imaging" className="flex-grow">Imaging</TabsTrigger>
            <TabsTrigger value="prescription" className="flex-grow">Prescriptions</TabsTrigger>
            <TabsTrigger value="surgery" className="flex-grow">Surgeries</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-4">
              {searchedRecords.length > 0 ? (
                searchedRecords.map((record) => (
                  <div key={record.id} className="bg-white border rounded-lg p-6 mb-4">
                    <div className="flex items-center mb-1">
                      <div className="mr-3">
                        {React.createElement(record.icon, { className: "h-5 w-5 text-blue-600" })}
                      </div>
                      <h2 className="text-xl font-semibold">{record.title}</h2>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                      {record.date} at {record.time} • {record.doctor}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                        {record.category}
                      </Badge>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                      {record.id && (
                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                          ID: {patient?.patientId || 'Loading...'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Summary</h3>
                      <p className="text-gray-700">{record.summary}</p>
                    </div>
                    
                    {record.diagnoses && record.diagnoses.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Diagnosis</h3>
                        <div className="flex flex-wrap gap-2">
                          {record.diagnoses.map((diagnosis, index) => (
                            <Badge key={index} variant="outline" className="bg-gray-50">
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center bg-white border rounded-lg">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No records found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? "Try adjusting your search criteria" : "No records match the selected filter"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </>
      )}
      </div>
    </DashboardLayout>
  )
}
