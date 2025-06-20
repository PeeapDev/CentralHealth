"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// Import only the icons we need from lucide-react
import { Calendar, UserPlus, Clock, Baby } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NeonatalPatientList } from "@/components/neonatal/neonatal-patient-list"
import { StatsCard } from "@/components/ui/stats-card"
import Link from "next/link"

// Define the expected shape of neonatal patient data
interface NeonatalPatient {
  id: string;
  name: string;
  dateOfBirth?: string;
  ageInDays?: number;
  birthWeight?: number;
  careLevel?: string;
  status?: string;
  dischargeStatus?: string;
  imageUrl?: string;
  motherId?: string;
  gestationalAgeAtBirth?: number;
  apgarScore?: number | null;
}

interface NeonatalPageProps {
  params: {
    hospitalName: string
  }
}

export default function NeonatalPage({ params }: NeonatalPageProps) {
  const hospitalName = params.hospitalName
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    newAdmissions: 0,
    criticalCases: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        console.log(`Fetching neonatal patients for hospital: ${hospitalName}`)
        
        // Fetch neonatal patients
        const response = await fetch(`/api/hospitals/${hospitalName}/neonatal/patients`, {
          credentials: 'include'
        })
        
        // Log the raw response status
        console.log(`API response status: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          // Get the text first so we can debug any JSON parsing issues
          const responseText = await response.text()
          
          try {
            // Try to parse the JSON
            const data = JSON.parse(responseText)
            console.log('Neonatal API response:', data)
            
            // Safely set patients with validation
            if (Array.isArray(data.patients)) {
              // Ensure each patient has required fields for rendering
              const validPatients = data.patients.map((patient: any) => ({
                id: patient.id || 'unknown',
                name: patient.name || 'Unknown Patient',
                medicalNumber: patient.medicalNumber,
                dateOfBirth: patient.dateOfBirth || new Date().toISOString(),
                ageInDays: patient.ageInDays || 0,
                birthWeight: patient.birthWeight || 0,
                careLevel: patient.careLevel || 'normal',
                status: patient.status || 'active',
                dischargeStatus: patient.dischargeStatus || 'not-ready',
                imageUrl: patient.imageUrl || undefined,
                motherId: patient.motherId || undefined,
                gestationalAgeAtBirth: patient.gestationalAgeAtBirth || 0,
                apgarScore: patient.apgarScore || null
              }));
              
              setPatients(validPatients);
              console.log(`Successfully loaded ${validPatients.length} patients`);
            } else {
              console.error('API response does not contain patients array:', data)
              setPatients([])
            }
            
            // Handle both the old and new API response formats
            if (data.stats) {
              // New structure with nested stats object
              setStats({
                totalPatients: data.stats.totalPatients || 0,
                activePatients: data.stats.activePatients || 0,
                newAdmissions: data.stats.newAdmissions || 0,
                criticalCases: data.stats.criticalCases || 0
              })
              console.log('Using new stats structure:', data.stats)
            } else {
              // Legacy format with stats at the root level
              setStats({
                totalPatients: data.totalPatients || 0,
                activePatients: data.activePatients || 0,
                newAdmissions: data.newAdmissions || 0,
                criticalCases: data.criticalCases || 0
              })
              console.log('Using legacy stats structure')
            }
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError)
            console.log('Raw response:', responseText)
            setPatients([])
          }
        } else {
          // Log more details about the error
          console.error(`Failed to fetch neonatal patients: ${response.status} ${response.statusText}`)
          try {
            const errorData = await response.text()
            console.error('Error response body:', errorData)
          } catch (e) {
            console.error('Could not read error response body')
          }
        }
      } catch (error) {
        console.error("Error fetching neonatal data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [hospitalName])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Neonatal Care Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage neonatal patients and their care records
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Neonates"
          value={stats.totalPatients}
          icon={<Baby className="h-6 w-6" />}
          description="Total neonatal patients"
          loading={isLoading}
        />
        <StatsCard
          title="Active Cases"
          value={stats.activePatients}
          icon={<UserPlus className="h-6 w-6" />}
          description="Currently under care"
          loading={isLoading}
        />
        <StatsCard
          title="New Admissions"
          value={stats.newAdmissions}
          icon={<Calendar className="h-6 w-6" />}
          description="Last 7 days"
          loading={isLoading}
        />
        <StatsCard
          title="Critical Cases"
          value={stats.criticalCases}
          icon={<Clock className="h-6 w-6" />}
          description="Requiring special attention"
          loading={isLoading}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="critical">Critical Cases</TabsTrigger>
          <TabsTrigger value="discharged">Ready for Discharge</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Neonatal Patient Records</CardTitle>
                <Button
                  onClick={() => router.push(`/${hospitalName}/admin/patients/new?module=neonatal`)}
                >
                  Register New Patient
                </Button>
              </div>
              <CardDescription>
                Complete list of all registered neonatal patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NeonatalPatientList 
                patients={patients} 
                isLoading={isLoading}
                hospitalName={hospitalName}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tabs would show filtered content */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Neonatal Patients</CardTitle>
              <CardDescription>
                Patients currently under active neonatal care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NeonatalPatientList 
                patients={patients.filter(p => p.status === "active")} 
                isLoading={isLoading}
                hospitalName={hospitalName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critical">
          <Card>
            <CardHeader>
              <CardTitle>Critical Neonatal Cases</CardTitle>
              <CardDescription>
                High-risk neonatal patients requiring urgent attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NeonatalPatientList 
                patients={patients.filter(p => p.careLevel === "critical")} 
                isLoading={isLoading}
                hospitalName={hospitalName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discharged">
          <Card>
            <CardHeader>
              <CardTitle>Ready for Discharge</CardTitle>
              <CardDescription>
                Patients ready to be discharged from neonatal care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NeonatalPatientList 
                patients={patients.filter(p => p.dischargeStatus === "ready")} 
                isLoading={isLoading}
                hospitalName={hospitalName}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
