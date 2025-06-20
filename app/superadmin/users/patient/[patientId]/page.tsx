"use client"

import { useState, useEffect } from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
// Import removed - not needed
import { Loader2, RefreshCw, ArrowLeft, Edit, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDistance } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Name {
  given?: string
  family?: string
  text?: string
  [key: string]: any
}

interface Address {
  line?: string[]
  city?: string
  state?: string
  postalCode?: string
  country?: string
  [key: string]: any
}

interface PatientData {
  id: string
  name: Name
  gender: string
  birthDate: string
  email?: string
  phone?: string
  medicalNumber: string
  mrn?: string
  address?: Address
  createdAt: string
  updatedAt: string
}

function PatientInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      <div className="space-y-4">
        <div className="h-28 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminPatientProfile() {
  // Using type assertion for params
  const params = useParams()
  const patientId = params?.patientId as string
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        setError("Patient ID is missing")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/patients/${patientId}`)
        if (!response.ok) {
          throw new Error(`Error fetching patient: ${response.status}`)
        }
        const data = await response.json()
        setPatient(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching patient:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load patient data"
        setError(errorMessage)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load patient data. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [patientId, toast])

  const handleResetPassword = async () => {
    if (!patient?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Patient doesn't have an email address.",
      })
      return
    }

    setIsResetting(true)
    setResetSuccess(false)

    try {
      const response = await fetch(`/api/superadmin/patients/${patientId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: patient.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reset password")
      }

      setResetSuccess(true)
      toast({
        title: "Password Reset Initiated",
        description: "Patient will receive an email with password reset instructions.",
      })
    } catch (err) {
      console.error("Error resetting password:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset password. Please try again.",
      })
    } finally {
      setIsResetting(false)
      setIsResetDialogOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      console.error("Invalid date format:", dateString)
      return "Invalid date"
    }
  }

  if (!patientId) {
    return <div>Patient ID is missing</div>
  }

  if (loading) {
    return <PatientInfoSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-lg text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  if (!patient) {
    return <div>No patient data found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/superadmin/patients/${patientId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                Reset Password
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Patient Password?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will send a password reset email to {patient.email}. The patient will need to follow the instructions in the email.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetPassword} disabled={isResetting}>
                  {isResetting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isResetting ? "Processing..." : "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>{patient.name?.given} {patient.name?.family}</span>
              <Badge variant="outline">{patient.gender}</Badge>
            </div>
            {resetSuccess && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Reset Email Sent
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Medical Record #: {patient.medicalNumber} | Created: {formatDate(patient.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">Date of Birth</h4>
              <p>{formatDate(patient.birthDate)}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
              <p>{patient.email || 'No email'}</p>
              <p>{patient.phone || 'No phone'}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
              <p>{patient.address?.line?.join(', ') || 'No address'}</p>
              <p>{patient.address?.city}, {patient.address?.state} {patient.address?.postalCode}</p>
            </div>
          </div>

          <Separator className="my-2" />

          <Tabs defaultValue="overview" className="w-full mt-2">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Patient summary information will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Medical records will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="medications">
              <Card>
                <CardHeader>
                  <CardTitle>Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Medication information will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Appointment history will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}