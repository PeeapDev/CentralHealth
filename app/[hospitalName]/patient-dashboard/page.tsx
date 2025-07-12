import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientReferralsClient } from "@/components/patient-referrals-client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { jwtDecode } from "jwt-decode"

interface PatientDashboardProps {
  params: { hospitalName: string }
}

interface PatientJWT {
  id: string;
  name: string;
  mrn: string; // Using mrn as the standard field for medical ID
  email?: string;
}

export default async function PatientDashboard({ params }: PatientDashboardProps) {
  const { hospitalName } = params
  const displayHospitalName = hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  
  // Get patient info from JWT token
  const cookieStore = cookies()
  const token = cookieStore.get("patientToken")?.value
  
  if (!token) {
    // Redirect to login if no token
    redirect(`/${hospitalName}/patient-login`)
  }
  
  let patient: PatientJWT | null = null
  
  try {
    patient = jwtDecode<PatientJWT>(token)
    
    // Ensure we have the mrn field (standard medical ID field)
    if (!patient.mrn) {
      console.error("Patient token missing mrn field")
    }
  } catch (error) {
    console.error("Error decoding patient token:", error)
    redirect(`/${hospitalName}/patient-login`)
  }
  
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${displayHospitalName} Patient Portal`}
        description="View your medical information and manage your care"
        breadcrumbs={[{ label: displayHospitalName }, { label: "Patient Dashboard" }]}
      />
      
      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{patient?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Medical ID</p>
              <p>{patient?.mrn || "Unknown"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Patient Referrals */}
      <PatientReferralsClient 
        patientId={patient?.id} 
        mrn={patient?.mrn} 
      />
      
      {/* Additional patient dashboard content can be added here */}
    </div>
  )
}
