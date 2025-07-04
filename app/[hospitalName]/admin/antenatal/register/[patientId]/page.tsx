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
  
  const [transferData, setTransferData] = useState<{
    sourceHospital: string;
    registrationDate: string;
    lastVisitDate: string;
  } | null>(null);
  
  // Load patient data and check for existing antenatal records
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
        const response = await fetch(`/api/patients/${patientId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch patient data')
        }
        const patientData = await response.json()
        setPatient(patientData)
        
        // Check if patient has existing antenatal records at any hospital
        const antenatalResponse = await fetch(`/api/antenatal/check-registration?patientId=${patientId}`)
        if (antenatalResponse.ok) {
          const existingData = await antenatalResponse.json()
          
          if (existingData && existingData.isRegistered && existingData.hospitalName !== hospitalName) {
            // Patient is registered at another hospital
            setTransferData({
              sourceHospital: existingData.hospitalName,
              registrationDate: existingData.registrationDate,
              lastVisitDate: existingData.lastVisitDate
            })
            
            // Pre-fill form data with existing information
            if (existingData.antenatalData) {
              setFormData({
                ...formData,
                ...existingData.antenatalData
              })
            }
          }
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
  
  // Handle saving booking visit data
  const handleBookingVisitSave = async (data: any) => {
    // Mark booking visit as complete
    const updatedFormData = {
      ...formData,
      bookingVisit: {
        ...data,
        completed: true
      }
    }
    
    setFormData(updatedFormData)
    
    // Save booking visit data to database
    if (patient?.id) {
      try {
        const response = await fetch(`/api/antenatal/booking-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId: patient.id,
            hospitalName,
            bookingVisitData: data,
            isTransfer: !!transferData
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to save booking visit data')
        }
        
        // Move to next tab
        setActiveTab("medical-history")
      } catch (error) {
        console.error('Error saving booking visit data:', error)
      }
    }
  }
  
  // Handle completing registration
  const handleCompleteRegistration = async () => {
    // Save all data and redirect to patient antenatal dashboard
    if (patient) {
      try {
        // Save complete antenatal registration data
        const response = await fetch(`/api/antenatal/complete-registration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId: patient.id,
            hospitalName,
            formData,
            isTransfer: !!transferData,
            sourceHospital: transferData?.sourceHospital || null
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to complete registration')
        }
        
        const result = await response.json()
        
        // Schedule notifications for upcoming visit if available
        if (formData.visitPlan.nextVisitDate) {
          await scheduleNotifications(formData.visitPlan.nextVisitDate, patient.id)
        }
        
        // Navigate to antenatal dashboard for this patient
        router.push(`/${hospitalName}/admin/antenatal/patient/${patient.id}`)
      } catch (error) {
        console.error('Error completing registration:', error)
        // Show error message
      }
    }
  }
  
  // Handle notifying patient about upcoming visit
  const scheduleNotifications = async (visitDate: string, patientId: string) => {
    try {
      // Schedule notifications for 2 days and 1 day before the visit
      const visitDateObj = new Date(visitDate)
      const twoDaysBefore = new Date(visitDateObj)
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2)
      
      const oneDayBefore = new Date(visitDateObj)
      oneDayBefore.setDate(oneDayBefore.getDate() - 1)
      
      // Get formatted date and time for more readable notifications
      const formattedDate = visitDateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      })
      
      await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          notifications: [
            {
              type: 'appointment',
              title: 'Upcoming Antenatal Visit',
              message: `Your antenatal visit is scheduled in 2 days on ${formattedDate}. Please remember to bring your ANC card.`,
              scheduledFor: twoDaysBefore.toISOString(),
            },
            {
              type: 'appointment',
              title: 'Antenatal Visit Tomorrow',
              message: `Reminder: Your antenatal visit is tomorrow on ${formattedDate}. Please arrive 15 minutes before your scheduled time.`,
              scheduledFor: oneDayBefore.toISOString(),
            }
          ]
        })
      })
    } catch (error) {
      console.error('Failed to schedule notifications:', error)
    }
  }
  
  // Update tab completion status based on form data
  const allTabsCompleted = 
    formData.bookingVisit.completed && 
    formData.medicalHistory.completed && 
    formData.physicalExam.completed && 
    formData.labRequests.completed && 
    formData.visitPlan.completed && 
    formData.complications.completed
  
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Antenatal Dashboard
        </Button>
      </div>
      
      {/* Hospital Transfer Alert */}
      {transferData && (
        <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded-md">
          <h3 className="text-lg font-semibold text-amber-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Patient Transfer Detected
          </h3>
          <p className="mt-2 text-amber-700">
            This patient is currently registered for antenatal care at {transferData.sourceHospital}. 
            Initial registration date: {new Date(transferData.registrationDate).toLocaleDateString()}. 
            Last visit date: {new Date(transferData.lastVisitDate).toLocaleDateString()}.
          </p>
          <p className="mt-2 text-amber-700 font-medium">
            You are updating this patient's antenatal record with {hospitalName} as the new hospital.
            All existing medical history and data will be preserved.
          </p>
        </div>
      )}
      
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
            onSave={handleBookingVisitSave}
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Antenatal Appointment Scheduling</CardTitle>
              <CardDescription>
                Schedule and manage upcoming antenatal visits for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Calendar visualization */}
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-sm font-medium text-blue-800">Scheduling for {patient?.name || 'Patient'}</h3>
                  </div>
                  <p className="text-sm text-blue-700 mt-1 ml-7">
                    {formData.bookingVisit.edd ? (
                      <>Due date: {new Date(formData.bookingVisit.edd).toLocaleDateString()}</>
                    ) : (
                      <>Please complete the booking visit section to calculate the EDD</>
                    )}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Next Visit Details</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                        Scheduling
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Next Visit Date with improved UI */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Next Visit Date</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <input 
                            type="date" 
                            className="w-full border rounded-lg p-2 pl-10"
                            value={formData.visitPlan.nextVisitDate || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                visitPlan: {
                                  ...prev.visitPlan,
                                  nextVisitDate: e.target.value,
                                  visitTime: prev.visitPlan.visitTime || "09:00",
                                  careProvider: prev.visitPlan.careProvider || "midwife",
                                  visitReason: prev.visitPlan.visitReason || "routine"
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Visit Time with AM/PM indicators */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Appointment Time</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <select 
                            className="w-full border rounded-lg p-2 pl-10"
                            value={formData.visitPlan.visitTime || "09:00"}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                visitPlan: {
                                  ...prev.visitPlan,
                                  visitTime: e.target.value
                                }
                              }));
                            }}
                          >
                            <option value="08:00">08:00 AM - Morning Clinic</option>
                            <option value="09:00">09:00 AM - Morning Clinic</option>
                            <option value="10:00">10:00 AM - Morning Clinic</option>
                            <option value="11:00">11:00 AM - Morning Clinic</option>
                            <option value="12:00">12:00 PM - Midday Clinic</option>
                            <option value="13:00">01:00 PM - Afternoon Clinic</option>
                            <option value="14:00">02:00 PM - Afternoon Clinic</option>
                            <option value="15:00">03:00 PM - Afternoon Clinic</option>
                            <option value="16:00">04:00 PM - Afternoon Clinic</option>
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Select a convenient time slot for the patient</p>
                      </div>
                      
                      {/* Care Provider with icons */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Care Provider</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <select 
                            className="w-full border rounded-lg p-2 pl-10"
                            value={formData.visitPlan.careProvider || "midwife"}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                visitPlan: {
                                  ...prev.visitPlan,
                                  careProvider: e.target.value
                                }
                              }));
                            }}
                          >
                            <option value="midwife">Midwife</option>
                            <option value="obstetrician">Obstetrician</option>
                            <option value="general">General Practitioner</option>
                            <option value="specialist">Specialist</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Visit Reason with better options */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Visit Reason</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <select 
                            className="w-full border rounded-lg p-2 pl-10"
                            value={formData.visitPlan.visitReason || "routine"}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                visitPlan: {
                                  ...prev.visitPlan,
                                  visitReason: e.target.value
                                }
                              }));
                            }}
                          >
                            <option value="routine">Routine ANC Visit</option>
                            <option value="followup">Follow-up Consultation</option>
                            <option value="ultrasound">Ultrasound Scan</option>
                            <option value="lab">Laboratory Tests</option>
                            <option value="high-risk">High-Risk Assessment</option>
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Helps the clinic prepare for the visit</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Visit Schedule and Information */}
                  <div className="space-y-5">
                    <h3 className="text-lg font-medium">Recommended Visit Schedule</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-100">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <div>
                            <span className="font-medium">First Trimester</span>
                            <p className="text-sm text-gray-600">8-12 weeks</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white text-blue-600 border-blue-200">1 visit</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md border border-purple-100">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                          <div>
                            <span className="font-medium">Second Trimester</span>
                            <p className="text-sm text-gray-600">13-26 weeks</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white text-purple-600 border-purple-200">2 visits</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-amber-50 rounded-md border border-amber-100">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                          <div>
                            <span className="font-medium">Third Trimester</span>
                            <p className="text-sm text-gray-600">27-40 weeks</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white text-amber-600 border-amber-200">4+ visits</Badge>
                      </div>
                    </div>
                    
                    {/* Visit Notes field */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium mb-1.5">Visit Notes (Optional)</label>
                      <textarea 
                        className="w-full border rounded-lg p-2 h-20 resize-none" 
                        placeholder="Any special instructions or notes for this appointment..."
                        value={formData.visitPlan.visitNotes || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            visitPlan: {
                              ...prev.visitPlan,
                              visitNotes: e.target.value
                            }
                          }));
                        }}
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                {/* Notification preferences with improved UI */}
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Appointment Reminders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="sms-notification" 
                          className="mr-3 h-4 w-4" 
                          defaultChecked 
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              visitPlan: {
                                ...prev.visitPlan,
                                sendSMS: e.target.checked
                              }
                            }));
                          }}
                        />
                        <div>
                          <label htmlFor="sms-notification" className="font-medium cursor-pointer">SMS Reminder</label>
                          <p className="text-xs text-gray-500">"Your antenatal visit at [hospital name] is on [appointment date] at [scheduled time]. Please bring your ANC card."</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="app-notification" 
                          className="mr-3 h-4 w-4" 
                          defaultChecked 
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              visitPlan: {
                                ...prev.visitPlan,
                                sendAppNotification: e.target.checked
                              }
                            }));
                          }}
                        />
                        <div>
                          <label htmlFor="app-notification" className="font-medium cursor-pointer">App Notification</label>
                          <p className="text-xs text-gray-500">"Reminder: Your appointment tomorrow at [scheduled time]. Please arrive 15 minutes early."</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="missed-followup" 
                          className="mr-3 h-4 w-4" 
                          defaultChecked 
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              visitPlan: {
                                ...prev.visitPlan,
                                missedVisitFollowUp: e.target.checked
                              }
                            }));
                          }}
                        />
                        <div>
                          <label htmlFor="missed-followup" className="font-medium cursor-pointer">Missed Visit Follow-up</label>
                          <p className="text-xs text-gray-500">Automatically flag for community health worker follow-up if appointment is missed</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="call-reminder" 
                          className="mr-3 h-4 w-4"
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              visitPlan: {
                                ...prev.visitPlan,
                                phoneCallReminder: e.target.checked
                              }
                            }));
                          }}
                        />
                        <div>
                          <label htmlFor="call-reminder" className="font-medium cursor-pointer">Phone Call Reminder</label>
                          <p className="text-xs text-gray-500">Schedule a call the day before the appointment (for high-risk patients)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Button section */}
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => updateFormData('visit-plan', {
                      nextVisitDate: formData.visitPlan.nextVisitDate,
                      visitTime: formData.visitPlan.visitTime || "09:00",
                      careProvider: formData.visitPlan.careProvider || "midwife",
                      visitReason: formData.visitPlan.visitReason || "routine",
                      visitNotes: formData.visitPlan.visitNotes || "",
                      sendSMS: formData.visitPlan.sendSMS !== false,
                      sendAppNotification: formData.visitPlan.sendAppNotification !== false,
                      missedVisitFollowUp: formData.visitPlan.missedVisitFollowUp !== false,
                      phoneCallReminder: formData.visitPlan.phoneCallReminder || false,
                      visitSchedule: ['first', 'second', 'third']
                    })}
                    className="px-6"
                  >
                    Save Appointment Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="complications">
          <ComplicationsForm 
            patientData={patient}
            initialData={formData.complications}
            onSave={(data) => updateFormData('complications', data)}
          />
        </TabsContent>
      </Tabs>
      
      {/* Progress indicator */}
      <div className="mt-6 mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${Object.values(formData).filter(section => section.completed).length * 16.67}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-1 text-right">
          {Object.values(formData).filter(section => section.completed).length}/6 sections completed
        </p>
      </div>
      
      {/* Save & Complete Registration Button */}
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleCompleteRegistration}
          disabled={!allTabsCompleted}
          className="px-6"
        >
          Save & Complete Registration
        </Button>
      </div>
    </div>
  )
}
