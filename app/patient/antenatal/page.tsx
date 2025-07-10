"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { useToast } from "@/components/ui/use-toast"
// Specialized care imports removed
import { format } from "date-fns"

// Define proper interfaces for TypeScript
interface Appointment {
  type: string
  doctor: string
  date: string | Date
  location: string
  time: string
}

interface PregnancyData {
  gestationalAge: number
  dueDate: Date
  lastMenstrualPeriod: Date
  upcomingAppointments: Appointment[]
}

export default function AntenatalCarePage() {
  const { profile, isLoading } = usePatientProfile()
  const { toast } = useToast()
  const router = useRouter()
  const [showPage, setShowPage] = useState(false)
  const [pregnancyData, setPregnancyData] = useState<PregnancyData>({
    gestationalAge: 0,
    dueDate: new Date(),
    lastMenstrualPeriod: new Date(),
    upcomingAppointments: []
  })

  useEffect(() => {
    // Check if user should have access to this page
    let settings = DEFAULT_SPECIALIZED_CARE_SETTINGS
    try {
      const storedSettings = localStorage.getItem('specializedCareSettings')
      if (storedSettings) {
        settings = JSON.parse(storedSettings)
      }
    } catch (err) {
      console.error("Error loading settings:", err)
    }
    
    // Initialize with sample data - in production, this would come from an API
    const sampleAppointments: Appointment[] = [
      {
        type: "Regular Checkup",
        doctor: "Sarah Johnson",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: "Main Hospital, Floor 3",
        time: "10:30 AM"
      },
      {
        type: "Ultrasound",
        doctor: "Michael Chen",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: "Imaging Center",
        time: "2:15 PM"
      }
    ];
    
    setPregnancyData(prev => ({
      ...prev,
      upcomingAppointments: sampleAppointments
    }));

    let isPregnant = false
    let recentBirth = false
    let gestationalAge = 0
    let dueDate = new Date()
    let lastMenstrualPeriod = new Date()
    
    // Parse medical history if it exists
    if (profile && 'medicalHistory' in profile) {
      try {
        const medHistory = typeof profile.medicalHistory === 'string' 
          ? JSON.parse(profile.medicalHistory)
          : profile.medicalHistory || {}
          
        isPregnant = !!medHistory.isPregnant
        recentBirth = !!medHistory.recentBirth
        gestationalAge = medHistory.gestationalAge || 0
        dueDate = medHistory.dueDate ? new Date(medHistory.dueDate) : new Date()
        lastMenstrualPeriod = medHistory.lastMenstrualPeriod ? new Date(medHistory.lastMenstrualPeriod) : new Date()
        
        setPregnancyData({
          gestationalAge,
          dueDate,
          lastMenstrualPeriod,
          upcomingAppointments: medHistory.upcomingAppointments || []
        })
      } catch (err) {
        console.error("Error parsing medical history:", err)
      }
    }

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
        description: "You don't have access to the antenatal care dashboard. Please check your settings.",
        variant: "destructive"
      })
      router.push('/patient')
    } else {
      setShowPage(true)
    }
  }, [profile, router, toast])

  if (isLoading || !showPage) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Calculate weeks remaining
  const today = new Date()
  const dueDate = pregnancyData.dueDate
  const totalPregnancyWeeks = 40
  const weeksRemaining = Math.max(0, Math.round(
    (dueDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)
  ))
  const progress = Math.min(100, Math.max(0, 
    ((totalPregnancyWeeks - weeksRemaining) / totalPregnancyWeeks) * 100
  ))

  return (
    <DashboardLayout currentPage="antenatal" breadcrumbs={[{ label: "Antenatal Care" }]}>
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Antenatal Care</h1>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pregnancy Timeline</CardTitle>
                  <CardDescription>Current progress and important dates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Progress: Week {totalPregnancyWeeks - weeksRemaining} of {totalPregnancyWeeks}</p>
                      <Progress value={progress} className="h-2 mt-2" />
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-1">Due Date</p>
                      <p className="text-lg">{format(pregnancyData.dueDate, 'PPP')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{weeksRemaining} weeks remaining</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-1">Last Menstrual Period</p>
                      <p className="text-lg">{format(pregnancyData.lastMenstrualPeriod, 'PPP')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Next Appointments</CardTitle>
                  <CardDescription>Upcoming checkups and visits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pregnancyData.upcomingAppointments && pregnancyData.upcomingAppointments.length > 0 ? (
                      pregnancyData.upcomingAppointments.map((appointment, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <p className="font-medium">{appointment.type}</p>
                            <p className="text-sm text-muted-foreground">{appointment.doctor}</p>
                          </div>
                          <p className="text-sm">{format(new Date(appointment.date), 'PPP')}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No upcoming appointments</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Pregnancy Calendar</CardTitle>
                <CardDescription>Important dates and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar 
                    mode="single"
                    selected={pregnancyData.dueDate}
                    disabled={{ before: new Date() }}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appointments" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Appointments</CardTitle>
                <CardDescription>Your upcoming antenatal visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pregnancyData.upcomingAppointments && pregnancyData.upcomingAppointments.length > 0 ? (
                    pregnancyData.upcomingAppointments.map((appointment, index) => (
                      <div key={index} className="flex flex-col p-4 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium text-lg">{appointment.type}</p>
                          <p className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                            {format(new Date(appointment.date), 'PPP')}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Dr. {appointment.doctor}</p>
                        <div className="text-sm">
                          <p>{appointment.location}</p>
                          <p>{appointment.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No upcoming appointments scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="monitoring" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Monitoring</CardTitle>
                <CardDescription>Track pregnancy health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium mb-1">Blood Pressure</p>
                      <p className="text-2xl font-semibold">120/80</p>
                      <p className="text-xs text-muted-foreground">Last checked: {format(new Date(), 'PP')}</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium mb-1">Weight</p>
                      <p className="text-2xl font-semibold">65 kg</p>
                      <p className="text-xs text-muted-foreground">Last checked: {format(new Date(), 'PP')}</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium mb-1">Fetal Heart Rate</p>
                      <p className="text-2xl font-semibold">140 bpm</p>
                      <p className="text-xs text-muted-foreground">Last checked: {format(new Date(), 'PP')}</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm font-medium mb-1">Fundal Height</p>
                      <p className="text-2xl font-semibold">{pregnancyData.gestationalAge} cm</p>
                      <p className="text-xs text-muted-foreground">Last checked: {format(new Date(), 'PP')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
