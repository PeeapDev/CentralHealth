"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CalendarIcon, ClipboardCheck, FileText, StethoscopeIcon, Activity } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import BookingVisitForm from "../../components/booking-visit-form"
import MedicalHistoryForm from "../../components/medical-history-form"
import PhysicalExamForm from "../../components/physical-exam-form"
import LabRequestsForm from "../../components/lab-requests-form"
import VisitPlanForm from "../../components/visit-plan-form"
import ComplicationsForm from "../../components/complications-form"

interface Patient {
  id: string
  name: string
  medicalNumber?: string
  age?: number
  gender?: string
  phone?: string
  email?: string
  photo?: string
}

export default function AntenatalRegistration() {
  const router = useRouter()
  const params = useParams()
  // Add non-null assertions to ensure TypeScript knows these values exist
  const hospitalName = params?.hospitalName as string
  const patientId = params?.patientId as string
  
  const [activeTab, setActiveTab] = useState("booking-visit")
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    bookingVisit: {
      lmp: "",
      edd: "",
      gravida: "",
      para: "",
      completed: false,
    },
    medicalHistory: {
      previousPregnancies: "",
      complications: "",
      chronicConditions: "",
      allergies: "",
      medications: "",
      surgicalHistory: "",
      completed: false,
    },
    physicalExam: {
      height: "",
      weight: "",
      bmi: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      completed: false,
    },
    labRequests: {
      bloodGroup: "",
      hemoglobin: "",
      hivStatus: "",
      hepatitis: "",
      urinalysis: "",
      completed: false,
    },
    visitPlan: {
      nextVisitDate: "",
      visitSchedule: [],
      completed: false,
    },
    complications: {
      riskFactors: [] as string[],
      riskLevel: "low" as "low" | "medium" | "high",
      completed: false
    }
  })
  
  // Load patient data
  useEffect(() => {
    async function fetchPatient() {
      try {
        setLoading(true)
        // First try to get from localStorage if we just came from search page
        const storedPatient = localStorage.getItem("antenatalSelectedPatient")
        
        if (storedPatient) {
          const parsedPatient = JSON.parse(storedPatient)
          if (parsedPatient.id === patientId) {
            setPatient(parsedPatient)
            setLoading(false)
            return
          }
        }
        
        // If not in localStorage, fetch from API
        const response = await fetch(`/api/hospitals/${hospitalName}/patients/${patientId}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setPatient(data)
        } else {
          console.error("Failed to fetch patient data", response.status)
        }
      } catch (error) {
        console.error("Error fetching patient:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPatient()
  }, [patientId, hospitalName])
  
  // Update form data for a specific section
  const updateFormData = (section: string, data: any) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section as keyof typeof prevData],
        ...data,
        completed: true
      }
    }))
    
    // Automatically move to next tab if available
    const tabs = ['booking-visit', 'medical-history', 'physical-exam', 'lab-requests', 'visit-plan', 'complications']
    const currentIndex = tabs.indexOf(section)
    
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }
  
  // Handle back button
  const handleBack = () => {
    router.push(`/${hospitalName}/admin/antenatal`)
  }
  
  // Handle final submission of the antenatal registration
  const handleSubmitRegistration = async () => {
    try {
      const antenatalData = {
        patientId,
        ...formData,
      }
      
      const response = await fetch(`/api/hospitals/${hospitalName}/antenatal/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(antenatalData),
        credentials: 'include'
      })
      
      if (response.ok) {
        // Clear stored patient data
        localStorage.removeItem("antenatalSelectedPatient")
        
        // Navigate to antenatal patient details page
        router.push(`/${hospitalName}/admin/antenatal/patients/${patientId}`)
      } else {
        console.error("Failed to submit antenatal registration")
        // Handle error
      }
    } catch (error) {
      console.error("Error submitting antenatal registration:", error)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
        <span className="ml-2">Loading patient data...</span>
      </div>
    )
  }
  
  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-700">Patient Not Found</h2>
          <p className="text-red-600 mt-2">Unable to find patient with ID: {patientId}</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Antenatal
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Antenatal
        </Button>
        
        {/* Patient info header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Avatar className="h-16 w-16 mr-4">
                {patient.photo ? (
                  <AvatarImage src={patient.photo} alt={patient.name} />
                ) : (
                  <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{patient.name}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  {patient.medicalNumber && (
                    <span className="text-sm text-gray-600">Medical ID: {patient.medicalNumber}</span>
                  )}
                  {patient.age && (
                    <span className="text-sm text-gray-600">Age: {patient.age}</span>
                  )}
                </div>
              </div>
              <div className="ml-auto">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Antenatal Registration
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <h1 className="text-3xl font-bold">Antenatal Registration</h1>
        <p className="text-gray-600">Complete all sections to register patient for antenatal care</p>
      </div>
      
      {/* Multi-step form tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="booking-visit" className="flex flex-col items-center py-2">
            <CalendarIcon className="h-5 w-5 mb-1" />
            <span>Booking Visit</span>
            {formData.bookingVisit.completed && (
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">Completed</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="medical-history" className="flex flex-col items-center py-2">
            <FileText className="h-5 w-5 mb-1" />
            <span>Medical History</span>
            {formData.medicalHistory.completed && (
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">Completed</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="physical-exam" className="flex flex-col items-center py-2">
            <StethoscopeIcon className="h-5 w-5 mb-1" />
            <span>Physical Exam</span>
            {formData.physicalExam.completed && (
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">Completed</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lab-requests" className="flex flex-col items-center py-2">
            <ClipboardCheck className="h-5 w-5 mb-1" />
            <span>Lab Requests</span>
            {formData.labRequests.completed && (
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">Completed</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="visit-plan" className="flex flex-col items-center py-2">
            <CalendarIcon className="h-5 w-5 mb-1" />
            <span>Visit Plan</span>
            {formData.visitPlan.completed && (
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">Completed</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="complications" className="flex flex-col items-center py-2">
            <Activity className="h-5 w-5 mb-1" />
            <span>Risk Assessment</span>
            {formData.complications.completed && (
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">Completed</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Form content for each tab */}
        <TabsContent value="booking-visit">
          <BookingVisitForm 
            patientData={patient}
            initialData={formData.bookingVisit}
            onSave={(data) => updateFormData('booking-visit', data)}
          />
        </TabsContent>
        
        <TabsContent value="medical-history">
          <MedicalHistoryForm 
            patientData={patient}
            initialData={formData.medicalHistory}
            onSave={(data) => updateFormData('medical-history', data)}
          />
        </TabsContent>
        
        <TabsContent value="physical-exam">
          <PhysicalExamForm 
            patientData={patient}
            initialData={formData.physicalExam}
            onSave={(data) => updateFormData('physical-exam', data)}
          />
        </TabsContent>
        
        <TabsContent value="lab-requests">
          <LabRequestsForm 
            patientData={patient}
            initialData={formData.labRequests}
            onSave={(data) => updateFormData('lab-requests', data)}
          />
        </TabsContent>
        
        <TabsContent value="visit-plan">
          <VisitPlanForm 
            patientData={patient}
            initialData={formData.visitPlan}
            onSave={(data) => updateFormData('visit-plan', data)}
          />
        </TabsContent>
        
        <TabsContent value="complications">
          <ComplicationsForm 
            patientData={patient}
            initialData={formData.complications}
            onSave={(data) => updateFormData('complications', data)}
          />
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 flex justify-end">
        <Button 
          variant="outline" 
          className="mr-2"
          onClick={handleBack}
        >
          Cancel
        </Button>
        
        <Button 
          disabled={
            !formData.bookingVisit.completed ||
            !formData.medicalHistory.completed ||
            !formData.physicalExam.completed ||
            !formData.labRequests.completed ||
            !formData.visitPlan.completed ||
            !formData.complications.completed
          }
          onClick={handleSubmitRegistration}
        >
          Complete Registration
        </Button>
      </div>
    </div>
  )
}
