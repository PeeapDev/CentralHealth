"use client"

import React, { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Phone, Mail, Home, Activity, FileText, ChevronLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { MedicalIdGenerator } from "@/components/patients/medical-id-generator"

// Patient details page props
interface PatientDetailsPageProps {
  params: Promise<{
    hospitalName: string
    patientId: string
  }>
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
  // Module-specific data
  neonatalData?: any
  antenatalData?: any
  // Add other fields as needed
}

export default function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  const router = useRouter()
  const { hospitalName, patientId } = use(params)
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    birthWeight: "",
    careLevel: "normal",
    status: "active",
    motherId: "",
    medicalNumber: localStorage.getItem("medicalNumber") || ""
  })

  // Fetch patient details with module-specific data
  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true)
      try {
        // Check if we're creating a new patient
        if (patientId === "new") {
          console.log("Creating a new patient - no need to fetch data")
          // Get the module from URL query params to determine patient type
          const urlParams = new URLSearchParams(window.location.search)
          const module = urlParams.get("module")
          
          // Get medical ID with priority: localStorage medicalNumber > localStorage patientId > generate new
          const storedMedicalNumber = localStorage.getItem("medicalNumber")
          const storedPatientId = localStorage.getItem("patientId")
          let medicalNumber = ""
          
          if (storedMedicalNumber) {
            console.log("Using stored medical number from localStorage:", storedMedicalNumber)
            medicalNumber = storedMedicalNumber
          } else if (storedPatientId) {
            console.log("Using stored patient ID as medical number:", storedPatientId)
            medicalNumber = storedPatientId
          }
          
          // Create an empty patient object with any module-specific placeholders
          const newPatient: Patient = {
            id: "",  // Will be assigned on save
            name: "",
            // Use the retrieved medical ID or leave empty for generation
            medicalNumber: medicalNumber
          }
          
          // Add module-specific empty data
          if (module === "neonatal") {
            newPatient.neonatalData = {}
          } else if (module === "antenatal") {
            newPatient.antenatalData = {}
          }
          
          setPatient(newPatient)
          setIsLoading(false)
          return
        }
        
        // For existing patients, fetch from API as usual
        const response = await fetch(`/api/patients/${patientId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch patient: ${response.status} ${response.statusText}`)
        }
        
        const patientData = await response.json()
        console.log(`Patient base data retrieved successfully:`, patientData)
        
        // Now fetch any module-specific data
        try {
          // Check for neonatal data
          const neonatalResponse = await fetch(`/api/patients/${patientId}/plugin-data?plugin=neonatal`)
          if (neonatalResponse.ok) {
            const neonatalData = await neonatalResponse.json()
            console.log('Neonatal data retrieved:', neonatalData)
            if (neonatalData && neonatalData.data) {
              patientData.neonatalData = neonatalData.data
            }
          }
          
          // Check for antenatal data
          const antenatalResponse = await fetch(`/api/patients/${patientId}/plugin-data?plugin=antenatal`)
          if (antenatalResponse.ok) {
            const antenatalData = await antenatalResponse.json()
            console.log('Antenatal data retrieved:', antenatalData)
            if (antenatalData && antenatalData.data) {
              patientData.antenatalData = antenatalData.data
            }
          }
        } catch (pluginError) {
          // Don't fail entirely if plugin data can't be fetched
          console.warn('Error fetching module-specific data:', pluginError)
        }
        
        setPatient(patientData)
      } catch (error) {
        console.error('Error fetching patient:', error)
        toast.error('Failed to load patient details. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    if (patientId) {
      fetchPatient()
    }
  }, [hospitalName, patientId])

  // Handle medical ID update
  const handleMedicalIdUpdate = (newMedicalId: string) => {
    console.log('Medical ID updated:', newMedicalId)

    // Save to localStorage for persistence across registration and onboarding
    if (newMedicalId) {
      localStorage.setItem('medicalNumber', newMedicalId)
      localStorage.setItem('medicalIdSource', 'generator')
    }

    // Update the patient and form state
    if (patient) {
      setPatient({
        ...patient,
        medicalNumber: newMedicalId
      })
    }

    setFormData(prev => ({ ...prev, medicalNumber: newMedicalId }))
  }

  // Save new patient data
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Get module from URL
      const urlParams = new URLSearchParams(window.location.search)
      const module = urlParams.get("module")
      
      // Ensure we have a medical ID - use our priority system
      // API response > form data > localStorage medicalNumber > localStorage patientId > generate new
      let finalMedicalNumber = formData.medicalNumber
      
      if (!finalMedicalNumber) {
        const storedMedicalNumber = localStorage.getItem("medicalNumber")
        const storedPatientId = localStorage.getItem("patientId")
        
        if (storedMedicalNumber) {
          console.log("Using stored medical number for new patient:", storedMedicalNumber)
          finalMedicalNumber = storedMedicalNumber
        } else if (storedPatientId) {
          console.log("Using stored patient ID as medical number for new patient:", storedPatientId)
          finalMedicalNumber = storedPatientId
        } else {
          console.warn("No medical number available, will rely on server-side generation")
        }
      }
      
      // Create base patient data
      const basePatientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        medicalNumber: finalMedicalNumber,
        birthDate: module === "neonatal" ? formData.dateOfBirth : undefined
      }
      
      // First create the patient
      const patientResponse = await fetch(`/api/hospitals/${hospitalName}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(basePatientData)
      })
      
      if (!patientResponse.ok) {
        throw new Error(`Failed to create patient: ${patientResponse.status}`)
      }
      
      const newPatient = await patientResponse.json()
      console.log('New patient created:', newPatient)
      
      // Store the new patient ID and medical number for consistency
      if (newPatient.id) {
        localStorage.setItem("patientId", newPatient.id)
        
        // If the server returned a new medical number, prioritize it
        if (newPatient.medicalNumber) {
          console.log("Saving server-assigned medical number:", newPatient.medicalNumber)
          localStorage.setItem("medicalNumber", newPatient.medicalNumber)
          localStorage.setItem("medicalIdSource", "server")
        }
      }
      
      // Then save module-specific data
      if (module === "neonatal" && newPatient.id) {
        // Create the plugin data
        const neonatalData = {
          dateOfBirth: formData.dateOfBirth,
          birthWeight: parseFloat(formData.birthWeight),
          careLevel: formData.careLevel,
          status: formData.status,
          motherId: formData.motherId || undefined,
          // Add any other neonatal-specific fields
          admissionDate: new Date().toISOString()
        }
        
        const pluginResponse = await fetch(`/api/patients/${newPatient.id}/plugin-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pluginName: "neonatal",
            data: neonatalData
          })
        })
        
        if (!pluginResponse.ok) {
          console.error('Failed to save neonatal data', await pluginResponse.text())
          toast.warning('Patient created but failed to save neonatal data')
        }
      }
      
      // Show success message
      toast.success(`Patient ${formData.firstName} ${formData.lastName} created successfully`)
      
      // Navigate to the new patient's page
      router.push(`/${hospitalName}/admin/patients/${newPatient.id}`)
      
    } catch (error) {
      console.error('Error creating patient:', error)
      toast.error('Failed to create patient')
    } finally {
      setIsLoading(false)
    }
  }

  // Go back to patients list
  const handleBack = () => {
    router.push(`/${hospitalName}/admin/patients`)
  }

  // Show new patient form if patientId is 'new'
  if (patientId === "new") {
    // Get the module type from URL query params
    const urlParams = new URLSearchParams(window.location.search)
    const module = urlParams.get("module")
    
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="New Patient Registration"
          description={`Register a new patient${module ? ` for ${module} care` : ""}`}
        >
          <Button variant="outline" className="ml-auto" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Patients
          </Button>
        </PageHeader>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mt-6">
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>
                  Enter the basic patient information below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreatePatient}>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                      <input 
                        type="text" 
                        id="firstName" 
                        className="w-full p-2 border rounded" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                      <input 
                        type="text" 
                        id="lastName" 
                        className="w-full p-2 border rounded" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="medicalNumber" className="text-sm font-medium">Medical ID</label>
                      <MedicalIdGenerator
                        patientId="new"
                        currentMedicalId={patient?.medicalNumber || ''}
                        onUpdate={handleMedicalIdUpdate}
                      />
                    </div>
                    
                    {module === "neonatal" && (
                      <div className="space-y-2 mt-4 pt-4 border-t">
                        <h3 className="font-medium">Neonatal Specific Information</h3>
                        <div className="space-y-2">
                          <label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</label>
                          <input 
                            type="date" 
                            id="dateOfBirth" 
                            className="w-full p-2 border rounded" 
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="birthWeight" className="text-sm font-medium">Birth Weight (g)</label>
                          <input 
                            type="number" 
                            id="birthWeight" 
                            className="w-full p-2 border rounded" 
                            value={formData.birthWeight}
                            onChange={(e) => setFormData({...formData, birthWeight: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="motherId" className="text-sm font-medium">Mother's ID (if available)</label>
                          <input 
                            type="text" 
                            id="motherId" 
                            className="w-full p-2 border rounded"
                            value={formData.motherId}
                            onChange={(e) => setFormData({...formData, motherId: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="mt-6" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Patient...
                        </>
                      ) : (
                        "Register Patient"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="Patient Details"
          description="Loading patient information..."
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
          title="Patient Not Found"
          description="The requested patient could not be found."
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
        title={patient.name || "Patient Details"}
        description="View and manage patient information"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Patients
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Patient Profile</CardTitle>
            <CardDescription>Personal Information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="/placeholder-avatar.jpg" alt={patient.name} />
                <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">{patient.name}</h3>
              {patient.medicalNumber && (
                <Badge variant="outline" className="mt-1">{patient.medicalNumber}</Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Gender</p>
                  <p className="text-sm text-muted-foreground">{patient.gender || "Not specified"}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : "Not specified"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{patient.phoneNumber || "Not specified"}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{patient.email || "Not specified"}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Home className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{patient.address || "Not specified"}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Medical ID</h4>
              <div className="sticky top-6 w-full">
                <MedicalIdGenerator 
                  currentMedicalId={patient.medicalNumber}
                  patientId={patient.id}
                  onUpdate={handleMedicalIdUpdate}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 lg:col-span-3">
          <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="records">Medical Records</TabsTrigger>
              <TabsTrigger value="antenatal">Antenatal</TabsTrigger>
              <TabsTrigger value="neonatal">Neonatal</TabsTrigger>
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
            
            <TabsContent value="antenatal">
              <Card>
                <CardHeader>
                  <CardTitle>Antenatal Care</CardTitle>
                  <CardDescription>
                    Antenatal records and care details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    <Button asChild>
                      <a href={`/${hospitalName}/admin/patients/${patientId}/antenatal`}>View Antenatal Records</a>
                    </Button>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="neonatal">
              <Card>
                <CardHeader>
                  <CardTitle>Neonatal Care</CardTitle>
                  <CardDescription>
                    Neonatal records and care details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    <Button asChild>
                      <a href={`/${hospitalName}/admin/patients/${patientId}/neonatal`}>View Neonatal Records</a>
                    </Button>
                  </p>
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
