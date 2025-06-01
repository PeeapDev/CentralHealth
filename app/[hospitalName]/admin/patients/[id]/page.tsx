"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Phone, Mail, Home, Activity, FileText, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { MedicalIdGenerator } from "@/components/patients/medical-id-generator"

// Patient details page props
interface PatientDetailsPageProps {
  params: {
    hospitalName: string
    id: string
  }
}

// Patient interface
interface Patient {
  id: string
  name: string
  medicalNumber?: string
  gender?: string
  birthDate?: string
  email?: string
  phoneNumber?: string
  address?: string
  hospitalId?: string
  createdAt?: string
  updatedAt?: string
  // Add other fields as needed
}

export default function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  const router = useRouter()
  const { hospitalName, id } = params
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch patient details
  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/${hospitalName}/admin/patients/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient')
        }
        
        const data = await response.json()
        setPatient(data)
      } catch (error) {
        console.error('Error fetching patient:', error)
        toast.error('Failed to load patient details')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchPatient()
    }
  }, [hospitalName, id])

  // Handle medical ID update
  const handleMedicalIdUpdate = (newMedicalId: string) => {
    if (patient) {
      setPatient({
        ...patient,
        medicalNumber: newMedicalId
      })
    }
  }

  // Go back to patients list
  const handleBack = () => {
    router.push(`/${hospitalName}/admin/patients`)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          heading="Patient Details"
          text="Loading patient information..."
        >
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Patients
          </Button>
        </PageHeader>
        
        <div className="grid gap-6 mt-8">
          <Card>
            <CardContent className="p-8">
              <div className="h-8 w-full bg-muted animate-pulse rounded" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error if patient not found
  if (!patient) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          heading="Patient Not Found"
          text="The requested patient could not be found."
        >
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Patients
          </Button>
        </PageHeader>
      </div>
    )
  }

  // Format name for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading={patient.name}
        text={patient.medicalNumber ? `Medical ID: ${patient.medicalNumber}` : "No Medical ID assigned"}
      >
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Button>
      </PageHeader>

      {/* Patient profile overview */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 mt-8">
        {/* Profile sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 mt-4">
                  <AvatarImage src="" alt={patient.name} />
                  <AvatarFallback className="text-xl">{getInitials(patient.name)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-semibold">{patient.name}</h3>
                  {patient.medicalNumber && (
                    <Badge variant="outline" className="mt-1">
                      {patient.medicalNumber}
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="w-full space-y-2">
                  {patient.gender && (
                    <div className="flex items-center text-sm">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{patient.gender}</span>
                    </div>
                  )}
                  {patient.birthDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{new Date(patient.birthDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {patient.phoneNumber && (
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{patient.phoneNumber}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center text-sm">
                      <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{patient.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical ID Generator */}
          <div className="mt-6">
            <MedicalIdGenerator
              patientId={patient.id}
              currentMedicalId={patient.medicalNumber}
              onUpdate={handleMedicalIdUpdate}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="md:col-span-2 lg:col-span-3">
          <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="records">Medical Records</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Summary</CardTitle>
                  <CardDescription>
                    Overview of patient information and recent activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Registration Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Patient registered on {patient.createdAt ? 
                          new Date(patient.createdAt).toLocaleDateString() : 
                          'Unknown date'}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Medical ID Information</h4>
                      {patient.medicalNumber ? (
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2">
                            {patient.medicalNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Last updated: {patient.updatedAt ? 
                              new Date(patient.updatedAt).toLocaleDateString() : 
                              'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No Medical ID assigned. Use the generator in the sidebar to assign one.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Appointments</CardTitle>
                  <CardDescription>
                    Patient's scheduled and past appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No appointments found</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Records</CardTitle>
                  <CardDescription>
                    Patient's medical history and records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No medical records found</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Prescriptions</CardTitle>
                  <CardDescription>
                    Patient's medication and prescriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No prescriptions found</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
