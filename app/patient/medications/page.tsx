"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Plus, Search, Filter, CheckCircle, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"

export default function MedicationsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("medications")
  const [activeTab, setActiveTab] = useState("current")
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "medications") {
      setCurrentPage("medications")
    } else {
      router.push(`/patient/${page}`)
    }
  }

  const currentMedications = [
    {
      id: 1,
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      timeOfDay: "Morning",
      prescribedBy: "Dr. Sarah Johnson",
      startDate: "Oct 1, 2024",
      endDate: "Ongoing",
      compliance: 95,
      nextDose: "Tomorrow 8:00 AM",
      instructions: "Take with food. Monitor blood pressure.",
      sideEffects: ["Dizziness", "Dry cough"],
      status: "active",
    },
    {
      id: 2,
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      timeOfDay: "Morning & Evening",
      prescribedBy: "Dr. Sarah Johnson",
      startDate: "Sep 15, 2024",
      endDate: "Ongoing",
      compliance: 88,
      nextDose: "Today 6:00 PM",
      instructions: "Take with meals to reduce stomach upset.",
      sideEffects: ["Nausea", "Stomach upset"],
      status: "active",
    },
    {
      id: 3,
      name: "Ibuprofen",
      dosage: "400mg",
      frequency: "As needed",
      timeOfDay: "As needed",
      prescribedBy: "Dr. Sarah Johnson",
      startDate: "Oct 15, 2024",
      endDate: "Oct 25, 2024",
      compliance: 100,
      nextDose: "As needed",
      instructions: "Take with food. Maximum 3 times per day.",
      sideEffects: ["Stomach irritation"],
      status: "prn",
    },
  ]

  const medicationHistory = [
    {
      id: 4,
      name: "Amoxicillin",
      dosage: "500mg",
      frequency: "Three times daily",
      prescribedBy: "Dr. Sarah Johnson",
      startDate: "Sep 1, 2024",
      endDate: "Sep 10, 2024",
      reason: "Bacterial infection",
      status: "completed",
    },
    {
      id: 5,
      name: "Prednisone",
      dosage: "20mg",
      frequency: "Once daily",
      prescribedBy: "Dr. Michael Roberts",
      startDate: "Aug 15, 2024",
      endDate: "Aug 25, 2024",
      reason: "Inflammation",
      status: "completed",
    },
  ]

  const todaysSchedule = [
    {
      time: "8:00 AM",
      medication: "Lisinopril 10mg",
      taken: true,
    },
    {
      time: "12:00 PM",
      medication: "Metformin 500mg",
      taken: true,
    },
    {
      time: "6:00 PM",
      medication: "Metformin 500mg",
      taken: false,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "prn":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "discontinued":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Medications" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
            <p className="text-gray-600">Manage your prescriptions and medication schedule</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Medication</span>
          </Button>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Today's Medication Schedule</span>
            </CardTitle>
            <CardDescription>Track your daily medication intake</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysSchedule.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${item.taken ? "bg-green-100" : "bg-gray-100"}`}>
                      {item.taken ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{item.medication}</div>
                      <div className="text-sm text-gray-500">{item.time}</div>
                    </div>
                  </div>
                  {!item.taken && (
                    <Button size="sm" variant="outline">
                      Mark as Taken
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search medications..." className="pl-10" />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Medications Tabs */}
        <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="current">Current Medications</TabsTrigger>
            <TabsTrigger value="history">Medication History</TabsTrigger>
          </TabsList>

          {/* Current Medications */}
          <TabsContent value="current" className="space-y-4">
            {currentMedications.map((medication) => (
              <Card key={medication.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{medication.name}</h3>
                      <p className="text-gray-600">
                        {medication.dosage} - {medication.frequency}
                      </p>
                      <p className="text-sm text-gray-500">Prescribed by {medication.prescribedBy}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(medication.status)}>
                        {medication.status === "prn" ? "As Needed" : "Active"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Time of Day</div>
                      <div className="font-medium">{medication.timeOfDay}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Next Dose</div>
                      <div className="font-medium">{medication.nextDose}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Start Date</div>
                      <div className="font-medium">{medication.startDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">End Date</div>
                      <div className="font-medium">{medication.endDate}</div>
                    </div>
                  </div>

                  {medication.status === "active" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Compliance Rate</span>
                        <span>{medication.compliance}%</span>
                      </div>
                      <Progress value={medication.compliance} className="h-2" />
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Instructions</div>
                      <div className="text-sm">{medication.instructions}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Possible Side Effects</div>
                      <div className="flex flex-wrap gap-1">
                        {medication.sideEffects.map((effect, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {effect}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Bell className="h-4 w-4 mr-2" />
                      Set Reminder
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Refill Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Medication History */}
          <TabsContent value="history" className="space-y-4">
            {medicationHistory.map((medication) => (
              <Card key={medication.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{medication.name}</h3>
                      <p className="text-gray-600">
                        {medication.dosage} - {medication.frequency}
                      </p>
                      <p className="text-sm text-gray-500">Prescribed by {medication.prescribedBy}</p>
                    </div>
                    <Badge className={getStatusColor(medication.status)}>Completed</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Start Date</div>
                      <div className="font-medium">{medication.startDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">End Date</div>
                      <div className="font-medium">{medication.endDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Reason</div>
                      <div className="font-medium">{medication.reason}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
