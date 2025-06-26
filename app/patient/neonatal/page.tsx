"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { useToast } from "@/components/ui/use-toast"
import { shouldShowMaternalCare, DEFAULT_SPECIALIZED_CARE_SETTINGS } from "@/lib/specialized-care-utils"
import { format, addDays } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { PatientSearchWidget } from "@/components/patient-search-widget"

interface BabyData {
  birthDate: Date
  name: string
  birthWeight: number
  currentWeight: number
  length: number
  headCircumference: number
  apgarScore: number
  gestationalAgeAtBirth: number
  checkups: Array<{
    date: Date
    time: string
    doctor: string
    type: string
    concerns?: string
  }>
  vaccinations: Array<{
    name: string
    description: string
    dueDate: Date
    completed: boolean
  }>
}

export default function NeonatalCarePage() {
  const { profile, isLoading } = usePatientProfile()
  const { toast } = useToast()
  const router = useRouter()
  const [showPage, setShowPage] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [babyData, setBabyData] = useState<BabyData>({
    birthDate: new Date(),
    name: "",
    birthWeight: 0,
    currentWeight: 0,
    length: 0,
    headCircumference: 0,
    apgarScore: 0,
    gestationalAgeAtBirth: 0,
    checkups: [],
    vaccinations: []
  })

  useEffect(() => {
    const checkAccess = async () => {
      let settings = DEFAULT_SPECIALIZED_CARE_SETTINGS
      try {
        const storedSettings = localStorage.getItem('specializedCareSettings')
        if (storedSettings) settings = JSON.parse(storedSettings)
      } catch (err) {
        console.error("Error loading settings:", err)
      }

      // Safely extract medical history data with proper null checks
      const medicalHistory = profile?.medicalHistory || {}
      const isPregnant = medicalHistory.isPregnant ?? false
      const recentBirth = medicalHistory.recentBirth ?? false
      
      const shouldShow = shouldShowMaternalCare(
        profile?.dateOfBirth,
        profile?.gender,
        settings,
        isPregnant,
        recentBirth
      )
      
      if (!shouldShow) {
        toast({
          title: "Access Restricted",
          description: "You don't have access to neonatal care dashboard",
          variant: "destructive"
        })
        router.push('/patient')
      } else {
        setShowPage(true)
        // Fetch baby data from the API
        fetchNeonatalData()
      }
    }

    if (profile) checkAccess()
  }, [profile, router, toast])
  
  // Function to fetch neonatal data from API
  const fetchNeonatalData = async () => {
    try {
      setIsLoadingData(true)
      // Use hospital ID from user profile if available
      const hospitalId = profile?.hospitalCode || localStorage.getItem('hospitalId')
      
      if (!hospitalId) {
        toast({
          title: "Error",
          description: "Hospital ID not found",
          variant: "destructive"
        })
        return
      }
      
      const response = await fetch(`/api/neonatal?hospitalId=${hospitalId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data && Array.isArray(data) && data.length > 0) {
          // Find the baby record for this patient (could be filtered by relation)
          const babyRecord = data[0] // Using first record as example
          
          setBabyData({
            birthDate: new Date(babyRecord.birthDate),
            name: babyRecord.name || "",
            birthWeight: babyRecord.birthWeight || 0,
            currentWeight: babyRecord.currentWeight || babyRecord.birthWeight || 0,
            length: babyRecord.length || 0,
            headCircumference: babyRecord.headCircumference || 0,
            apgarScore: babyRecord.apgarScore || 0,
            gestationalAgeAtBirth: babyRecord.gestationalAgeAtBirth || 0,
            checkups: Array.isArray(babyRecord.checkups) ? babyRecord.checkups : [],
            vaccinations: Array.isArray(babyRecord.vaccinations) ? babyRecord.vaccinations : []
          })
        }
      } else {
        console.error("Failed to fetch neonatal data:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching neonatal data:", error)
      toast({
        title: "Error",
        description: "Failed to load neonatal data",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  if (isLoading || !showPage || isLoadingData) {
    return (
      <DashboardLayout currentPage="neonatal" breadcrumbs={[{ label: "Neonatal Care" }]}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg font-medium">Loading neonatal dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Calculate baby's age
  const ageInDays = Math.floor((new Date().getTime() - babyData.birthDate.getTime()) / (1000 * 60 * 60 * 24))
  const ageDisplay = ageInDays < 7 ? `${ageInDays} day${ageInDays !== 1 ? 's' : ''}` :
                    ageInDays < 30 ? `${Math.floor(ageInDays/7)} week${Math.floor(ageInDays/7) !== 1 ? 's' : ''}` :
                    `${Math.floor(ageInDays/30)} month${Math.floor(ageInDays/30) !== 1 ? 's' : ''}`

  // Sample growth data for chart
  const growthData = Array.from({ length: 8 }, (_, i) => ({
    date: format(addDays(babyData.birthDate, i * 7), 'MM/dd'),
    weight: babyData.birthWeight + (i * 0.2)
  }))

  return (
    <DashboardLayout currentPage="neonatal" breadcrumbs={[{ label: "Neonatal Care" }]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Neonatal Care</h1>
        
        {/* Baby Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>{babyData.name || "Baby"}</CardTitle>
            <CardDescription>
              Born on {format(babyData.birthDate, 'PPP')} • {ageDisplay} old
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Birth Weight</p>
              <p className="text-xl font-semibold">{babyData.birthWeight} kg</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Current Weight</p>
              <p className="text-xl font-semibold">{babyData.currentWeight} kg</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Length</p>
              <p className="text-xl font-semibold">{babyData.length} cm</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Head Circumference</p>
              <p className="text-xl font-semibold">{babyData.headCircumference} cm</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overview content */}
          </TabsContent>

          <TabsContent value="growth">
            <Card>
              <CardHeader>
                <CardTitle>Weight Chart</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records">
            {/* Medical records content */}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}