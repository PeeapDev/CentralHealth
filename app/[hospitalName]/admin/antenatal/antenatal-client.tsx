"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, UserPlus, BarChart3, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCard } from "@/components/ui/stats-card"
import Link from "next/link"
import { AntenatalPatientList } from "@/components/antenatal/antenatal-patient-list"

interface AntenatalPatient {
  id: string
  name: string
  age: number
  gestationalAge: number
  nextAppointment: string | null
  riskLevel: "low" | "medium" | "high"
  status: "active" | "completed" | "referred" | "transferred"
  trimester: 1 | 2 | 3
  imageUrl?: string
  expectedDueDate?: string | null
}

interface AntenatalClientProps {
  hospitalName: string
}

export default function AntenatalClient({ hospitalName }: AntenatalClientProps) {
  const router = useRouter()
  const [patients, setPatients] = useState<AntenatalPatient[]>([])
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    newRegistrations: 0,
    upcomingAppointments: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        // Fetch antenatal patients
        const response = await fetch(`/api/hospitals/${hospitalName}/antenatal/patients`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const responseText = await response.text();
          try {
            // Try to parse the JSON
            const data = JSON.parse(responseText);
            console.log('Antenatal API response:', data);
            
            // Update stats with the nested structure
            if (data.stats) {
              setStats({
                totalPatients: data.stats.totalPatients || 0,
                activePatients: data.stats.activePatients || 0,
                newRegistrations: data.stats.newRegistrations || 0,
                upcomingAppointments: data.stats.upcomingAppointments || 0
              });
            }
            
            // Safely set patients with validation
            if (Array.isArray(data.patients)) {
              // Ensure each patient has required fields for rendering
              const validPatients = data.patients.map((patient: any) => ({
                id: patient.id || 'unknown',
                name: patient.name || 'Unknown Patient',
                medicalNumber: patient.medicalNumber || undefined,
                age: patient.age || 0,
                gestationalAge: patient.gestationalAge || 0,
                nextAppointment: patient.nextAppointment || null,
                // Ensure riskLevel is one of the allowed values in the type definition
                riskLevel: ((): "low" | "medium" | "high" => {
                  const riskValue = patient.riskLevel?.toLowerCase() || '';
                  if (riskValue === "medium" || riskValue === "high") return riskValue;
                  return "low"; // Default value
                })(),
                // Ensure status is one of the allowed values in the type definition
                status: ((): "active" | "completed" | "referred" | "transferred" => {
                  const statusValue = patient.status?.toLowerCase() || '';
                  if (["completed", "referred", "transferred"].includes(statusValue)) {
                    return statusValue as "completed" | "referred" | "transferred";
                  }
                  return "active"; // Default value
                })(),
                // Ensure trimester is one of the allowed values (1, 2, or 3)
                trimester: ((): 1 | 2 | 3 => {
                  const trimesterValue = parseInt(String(patient.trimester || 1), 10);
                  if (trimesterValue === 2) return 2;
                  if (trimesterValue === 3) return 3;
                  return 1; // Default to first trimester if invalid
                })(),
                imageUrl: patient.imageUrl || undefined,
                expectedDueDate: patient.expectedDueDate || null
              }));
              
              setPatients(validPatients);
              console.log(`Successfully loaded ${validPatients.length} antenatal patients`);
            } else {
              console.error('API response does not contain patients array:', data)
              setPatients([]);
            }
            
            // Set stats
            setStats({
              totalPatients: data.totalPatients || 0,
              activePatients: data.activePatients || 0,
              newRegistrations: data.newRegistrations || 0,
              upcomingAppointments: data.upcomingAppointments || 0
            });
          } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            console.debug("Raw response:", responseText);
            setPatients([]);
          }
        } else {
          console.error("Failed to fetch antenatal patients", response.status);
        }
      } catch (error) {
        console.error("Error fetching antenatal data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [hospitalName])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Antenatal Care Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage antenatal patients and their care records
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="h-6 w-6" />}
          description="Registered for antenatal care"
          loading={isLoading}
        />
        <StatsCard
          title="Active Patients"
          value={stats.activePatients}
          icon={<UserPlus className="h-6 w-6" />}
          description="Currently under observation"
          loading={isLoading}
        />
        <StatsCard
          title="New Registrations"
          value={stats.newRegistrations}
          icon={<Calendar className="h-6 w-6" />}
          description="Last 30 days"
          loading={isLoading}
        />
        <StatsCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          icon={<Clock className="h-6 w-6" />}
          description="Next 7 days"
          loading={isLoading}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk</TabsTrigger>
          <TabsTrigger value="third-trimester">Third Trimester</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Antenatal Patient Records</CardTitle>
                <Button
                  onClick={() => router.push(`/${hospitalName}/admin/antenatal/search`)}
                >
                  Register New Patient
                </Button>
              </div>
              <CardDescription>
                Complete list of all registered antenatal patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AntenatalPatientList 
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
              <CardTitle>Active Antenatal Patients</CardTitle>
              <CardDescription>
                Patients currently under active antenatal care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AntenatalPatientList 
                patients={patients.filter(p => p.status === "active")} 
                isLoading={isLoading}
                hospitalName={hospitalName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-risk">
          <Card>
            <CardHeader>
              <CardTitle>High-Risk Pregnancies</CardTitle>
              <CardDescription>
                Patients identified as high-risk cases requiring special attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AntenatalPatientList 
                patients={patients.filter(p => p.riskLevel === "high")} 
                isLoading={isLoading}
                hospitalName={hospitalName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="third-trimester">
          <Card>
            <CardHeader>
              <CardTitle>Third Trimester Patients</CardTitle>
              <CardDescription>
                Patients in their third trimester of pregnancy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AntenatalPatientList 
                patients={patients.filter(p => p.trimester === 3)} 
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
