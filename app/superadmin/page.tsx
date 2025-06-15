"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, CheckCircle, Pause, Ban, Users, UserCheck, UserX, RefreshCw, Loader2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { toast } from "sonner"

// Type definitions for data
interface Hospital {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    status?: string;
    licenseExpiry?: string;
    [key: string]: any;
  };
  branding?: any;
}

interface HospitalStats {
  total: number;
  active: number;
  inactive: number;
  licenseExpired: number;
}

interface PatientStats {
  total: number;
  male: number;
  female: number;
  other: number;
}

export default function SuperadminDashboard() {
  const router = useRouter()
  
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [hospitalStats, setHospitalStats] = useState<HospitalStats>({
    total: 0,
    active: 0,
    inactive: 0,
    licenseExpired: 0
  })
  const [patientStats, setPatientStats] = useState<PatientStats>({
    total: 0,
    male: 0,
    female: 0,
    other: 0
  })

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch hospital data
      const hospitalResponse = await fetch('/api/hospitals', {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache'
        }
      })
      
      // Fetch patient statistics
      const patientsResponse = await fetch('/api/patients/stats', {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache'
        }
      }).catch(error => {
        console.warn('Patient stats endpoint not available, falling back to regular patients endpoint')
        return fetch('/api/patients', {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache'
          }
        })
      })
      
      // Process hospital data
      if (hospitalResponse.ok) {
        const hospitalData = await hospitalResponse.json()
        const hospitals: Hospital[] = hospitalData.hospitals || []
        
        // Calculate hospital statistics
        const today = new Date()
        
        const stats: HospitalStats = {
          total: hospitals.length,
          active: 0,
          inactive: 0,
          licenseExpired: 0
        }
        
        hospitals.forEach(hospital => {
          // Check if active based on settings.status
          if (hospital.settings && hospital.settings.status === 'Active') {
            stats.active++
          } else {
            stats.inactive++
          }
          
          // Check license expiry if available
          if (hospital.settings && hospital.settings.licenseExpiry) {
            const expiryDate = new Date(hospital.settings.licenseExpiry)
            if (expiryDate < today) {
              stats.licenseExpired++
            }
          }
        })
        
        setHospitalStats(stats)
      }
      
      // Process patient data
      if (patientsResponse.ok) {
        const patientData = await patientsResponse.json()
        
        // If we have pre-calculated stats from the API
        if (patientData.stats) {
          setPatientStats({
            total: patientData.stats.total || 0,
            male: patientData.stats.male || 0,
            female: patientData.stats.female || 0,
            other: patientData.stats.other || 0
          })
        } 
        // Otherwise calculate from patient list
        else if (patientData.patients && Array.isArray(patientData.patients)) {
          const patients = patientData.patients
          
          const stats: PatientStats = {
            total: patients.length,
            male: 0,
            female: 0,
            other: 0
          }
          
          // Count genders
          patients.forEach((patient: any) => {
            if (patient.gender) {
              const gender = patient.gender.toLowerCase()
              if (gender === 'male') {
                stats.male++
              } else if (gender === 'female') {
                stats.female++
              } else {
                stats.other++
              }
            }
          })
          
          setPatientStats(stats)
        }
      }
      
      toast.success('Dashboard data refreshed')
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  // Convert our stats objects to array format for the UI
  const hospitalStatsArray = [
    {
      title: "Total hospitals",
      value: hospitalStats.total.toString(),
      icon: Building2,
      color: "bg-blue-100 text-blue-600",
      cardColor: "bg-blue-50",
    },
    {
      title: "Active hospitals",
      value: hospitalStats.active.toString(),
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      cardColor: "bg-green-50",
    },
    {
      title: "Inactive hospitals",
      value: hospitalStats.inactive.toString(),
      icon: Pause,
      color: "bg-gray-100 text-gray-600",
      cardColor: "bg-gray-50",
    },
    {
      title: "License Expired",
      value: hospitalStats.licenseExpired.toString(),
      icon: Ban,
      color: "bg-red-100 text-red-600",
      cardColor: "bg-red-50",
    },
  ]

  const patientStatsArray = [
    {
      title: "Total Patients",
      value: patientStats.total.toLocaleString(),
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      cardColor: "bg-purple-50",
    },
    {
      title: "Male Patients",
      value: patientStats.male.toLocaleString(),
      icon: UserCheck,
      color: "bg-cyan-100 text-cyan-600",
      cardColor: "bg-cyan-50",
    },
    {
      title: "Female Patients",
      value: patientStats.female.toLocaleString(),
      icon: UserX,
      color: "bg-pink-100 text-pink-600",
      cardColor: "bg-pink-50",
    },
  ]

  const subscriptionData = [
    {
      period: "Sat 24 May, 2025",
      monthlySubscription: "$ 0.00",
      yearlySubscription: "$ 1.50K",
      totalIncome: "$ 1.50K",
    },
    {
      period: "May, 2025",
      monthlySubscription: "$ 100.00",
      yearlySubscription: "$ 2.50K",
      totalIncome: "$ 2.60K",
    },
    {
      period: "2025",
      monthlySubscription: "$ 300.00",
      yearlySubscription: "$ 222.62K",
      totalIncome: "$ 222.92K",
    },
  ]

  // Sierra Leone health issues data by region
  const healthIssuesData = [
    { region: "Western Area", malaria: 2840, hypertension: 1920, diabetes: 680, respiratory: 1240 },
    { region: "Northern Province", malaria: 3200, hypertension: 1450, diabetes: 420, respiratory: 980 },
    { region: "Southern Province", malaria: 2650, hypertension: 1680, diabetes: 520, respiratory: 1100 },
    { region: "Eastern Province", malaria: 2980, hypertension: 1380, diabetes: 380, respiratory: 890 },
  ]

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/placeholder.svg?height=64&width=64" />
            <AvatarFallback className="bg-yellow-400 text-white text-xl">SA</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, Super Admin!</h1>
            <p className="text-gray-600">Welcome to the dashboard of Hospital Management System</p>
          </div>
        </div>
        <Button 
          onClick={fetchDashboardData}
          variant="outline"
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </>
          )}
        </Button>
      </div>

      {/* Hospital Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {loading ? (
          // Show skeleton loaders when loading
          Array(4).fill(0).map((_, index) => (
            <Card key={index} className="border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-200 animate-pulse">
                    <div className="h-8 w-8"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Show actual data when loaded
          hospitalStatsArray.map((stat, index) => (
            <Card key={index} className={`${stat.cardColor} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Patient Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {loading ? (
          // Show skeleton loaders when loading
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-200 animate-pulse">
                    <div className="h-8 w-8"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Show actual data when loaded
          patientStatsArray.map((stat, index) => (
            <Card key={index} className={`${stat.cardColor} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2025 Income / Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Income</span>
              </div>
              <div className="h-64 flex items-end justify-between space-x-2">
                {["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                  (month, index) => (
                    <div key={month} className="flex flex-col items-center space-y-2">
                      <div
                        className={`w-8 rounded-t ${index === 2 || index === 4 ? "bg-blue-500 h-32" : "bg-blue-200 h-16"}`}
                      ></div>
                      <span className="text-xs text-gray-500 transform -rotate-45">{month}</span>
                    </div>
                  ),
                )}
              </div>
              <div className="text-center text-sm text-gray-500">Months</div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">May, 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="20"
                    strokeDasharray="83.78 251.33"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="20"
                    strokeDasharray="167.55 251.33"
                    strokeDashoffset="-83.78"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">66.7%</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Monthly Subscription</span>
                <span className="text-sm font-semibold ml-auto">33.3%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                <span className="text-sm">Yearly Subscription</span>
                <span className="text-sm font-semibold ml-auto">66.7%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Issues by Region Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Health Issues by Region - Sierra Leone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthIssuesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="malaria" fill="#ef4444" name="Malaria" />
                <Bar dataKey="hypertension" fill="#3b82f6" name="Hypertension" />
                <Bar dataKey="diabetes" fill="#10b981" name="Diabetes" />
                <Bar dataKey="respiratory" fill="#f59e0b" name="Respiratory Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Data */}
      <div className="grid gap-6 md:grid-cols-3">
        {subscriptionData.map((data, index) => (
          <Card key={index} className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">{data.period}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <span className="text-sm text-gray-600">Monthly Subscription: </span>
                <span className="font-semibold">{data.monthlySubscription}</span>
              </div>
              <div className="border-b border-gray-200 pb-2">
                <span className="text-sm text-gray-600">Yearly Subscription : </span>
                <span className="font-semibold">{data.yearlySubscription}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Income : </span>
                <span className="font-semibold">{data.totalIncome}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
