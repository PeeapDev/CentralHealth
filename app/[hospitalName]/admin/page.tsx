"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Stethoscope,
  Bed,
  Pill,
  TestTube,
  Scan,
  Droplet,
  Truck,
  DollarSign,
  TrendingDown,
  Users,
  UserCheck,
  FlaskConical,
  Activity,
} from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'

interface HospitalDashboardProps {
  params: { hospitalName?: string } | Promise<{ hospitalName?: string }>
}

// Hospital names mapping
const hospitalNames: Record<string, string> = {
  "smart-hospital": "Smart Hospital & Research Center",
  "city-medical": "City Medical Center",
  "general-hospital": "General Hospital",
  // Add default empty case for type safety
  "": "Hospital"
}

export default function HospitalDashboard({ params }: HospitalDashboardProps) {
  // Access params directly since we're in a client component
  const urlParams = useParams()
  
  // Get the hospital slug from the URL params
  const hospitalSlug = ((urlParams?.hospitalName as string) || '') as string
  
  // State for hospital data
  const [hospital, setHospital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch hospital data from API
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/hospitals/${hospitalSlug}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch hospital data')
        }
        
        const data = await response.json()
        setHospital(data)
        console.log('Hospital data:', data)
      } catch (error) {
        console.error('Error fetching hospital:', error)
        setError('Failed to load hospital data')
      } finally {
        setLoading(false)
      }
    }
    
    if (hospitalSlug) {
      fetchHospital()
    }
  }, [hospitalSlug])
  
  // Get hospital name from the data or fallback to the mapping or default
  const hospitalName = hospital?.name || hospitalNames[hospitalSlug] || "Hospital"
  
  // Get enabled modules
  const enabledModules = hospital?.modules || []
  
  // Check if a module is enabled
  const isModuleEnabled = (moduleName: string) => {
    return enabledModules.includes(moduleName.toLowerCase())
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: hospitalName, href: `/${hospitalSlug}/home` },
    { label: "Admin Dashboard" },
  ]

  // Sample data matching the uploaded image
  const incomeData = [
    { name: "Jan", income: 25000, expenses: 18000 },
    { name: "Feb", income: 22000, expenses: 19000 },
    { name: "Mar", income: 35000, expenses: 15000 },
    { name: "Apr", income: 28000, expenses: 22000 },
    { name: "May", income: 32000, expenses: 8000 },
    { name: "Jun", income: 15000, expenses: 5000 },
    { name: "Jul", income: 18000, expenses: 7000 },
    { name: "Aug", income: 20000, expenses: 9000 },
    { name: "Sep", income: 22000, expenses: 11000 },
    { name: "Oct", income: 25000, expenses: 13000 },
    { name: "Nov", income: 28000, expenses: 15000 },
    { name: "Dec", income: 30000, expenses: 17000 },
  ]

  const pieData = [
    { name: "OPD", value: 25, color: "#8B5A2B" },
    { name: "IPD", value: 15, color: "#FFA500" },
    { name: "Pharmacy", value: 20, color: "#FFD700" },
    { name: "Pathology", value: 10, color: "#87CEEB" },
    { name: "Radiology", value: 8, color: "#9370DB" },
    { name: "Blood Bank", value: 7, color: "#20B2AA" },
    { name: "Ambulance", value: 5, color: "#32CD32" },
    { name: "Income", value: 10, color: "#228B22" },
  ]

  const timeSlots = ["6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"]

  const weekDays = [
    { day: "Sun 5/18", color: "bg-blue-400" },
    { day: "Mon 5/19", color: "bg-blue-500" },
    { day: "Tue 5/20", color: "bg-blue-500" },
    { day: "Wed 5/21", color: "bg-blue-500" },
    { day: "Thu 5/22", color: "bg-blue-500" },
    { day: "Fri 5/23", color: "bg-blue-500" },
    { day: "Sat 5/24", color: "bg-green-400" },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <BreadcrumbNav items={breadcrumbItems} />

      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to {hospitalName} Dashboard</h1>
        <p className="text-gray-600">
          Overview of hospital operations, income, and key metrics for{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <p className="text-lg">Loading hospital data...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-red-500">
          <p className="text-lg">{error}</p>
        </div>
      ) : (
        <>
          {/* Income Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {isModuleEnabled('OPD') && (
              <Card className="bg-green-500 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Stethoscope className="h-8 w-8" />
                    <div>
                      <p className="text-sm opacity-90">OPD Income</p>
                      <p className="text-2xl font-bold">$8,028.00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isModuleEnabled('IPD') && (
              <Card className="bg-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Bed className="h-8 w-8" />
                    <div>
                      <p className="text-sm opacity-90">IPD Income</p>
                      <p className="text-2xl font-bold">$2,525.50</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isModuleEnabled('Pharmacy') && (
              <Card className="bg-green-500 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Pill className="h-8 w-8" />
                    <div>
                      <p className="text-sm opacity-90">Pharmacy Income</p>
                      <p className="text-2xl font-bold">$3,263.75</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isModuleEnabled('Pathology') && (
              <Card className="bg-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TestTube className="h-8 w-8" />
                    <div>
                      <p className="text-sm opacity-90">Pathology Income</p>
                      <p className="text-2xl font-bold">$1,575.27</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isModuleEnabled('Radiology') && (
              <Card className="bg-green-500 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Scan className="h-8 w-8" />
                    <div>
                      <p className="text-sm opacity-90">Radiology Income</p>
                      <p className="text-2xl font-bold">$1,885.80</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isModuleEnabled('BloodBank') && (
            <Card className="bg-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Droplet className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">Blood Bank Income</p>
                    <p className="text-2xl font-bold">$1,802.90</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isModuleEnabled('Ambulance') && (
            <Card className="bg-green-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Truck className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">Ambulance Income</p>
                    <p className="text-2xl font-bold">$1,535.25</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isModuleEnabled('Billing') && (
            <Card className="bg-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">General Income</p>
                    <p className="text-2xl font-bold">$1,150.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-red-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingDown className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Expenses</p>
                  <p className="text-2xl font-bold">$201,210.00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Calendar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yearly Income & Expense Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Yearly Income & Expense</CardTitle>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                −
              </Button>
              <Button variant="ghost" size="sm">
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm">Income</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm">Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Income Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Monthly Income Overview</CardTitle>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                −
              </Button>
              <Button variant="ghost" size="sm">
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData.filter(entry => {
                    // Only show pie slices for enabled modules
                    const moduleName = entry.name.toLowerCase();
                    if (moduleName === 'opd') return isModuleEnabled('opd');
                    if (moduleName === 'ipd') return isModuleEnabled('ipd');
                    if (moduleName === 'pharmacy') return isModuleEnabled('pharmacy');
                    if (moduleName === 'pathology') return isModuleEnabled('pathology');
                    if (moduleName === 'radiology') return isModuleEnabled('radiology');
                    if (moduleName === 'blood bank') return isModuleEnabled('bloodbank');
                    if (moduleName === 'ambulance') return isModuleEnabled('ambulance');
                    // Always show income for any hospital
                    return true;
                  })}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.filter(entry => {
                    // Only show pie slices for enabled modules (same filter as above)
                    const moduleName = entry.name.toLowerCase();
                    if (moduleName === 'opd') return isModuleEnabled('opd');
                    if (moduleName === 'ipd') return isModuleEnabled('ipd');
                    if (moduleName === 'pharmacy') return isModuleEnabled('pharmacy');
                    if (moduleName === 'pathology') return isModuleEnabled('pathology');
                    if (moduleName === 'radiology') return isModuleEnabled('radiology');
                    if (moduleName === 'blood bank') return isModuleEnabled('bloodbank');
                    if (moduleName === 'ambulance') return isModuleEnabled('ambulance');
                    return true;
                  }).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Admin is always shown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-500 text-white">
                  <Users className="h-4 w-4 mr-1" />
                  Admin
                </Badge>
              </div>
              <span className="font-semibold">1</span>
            </div>
            
            {/* Show accountant if billing module is enabled */}
            {isModuleEnabled('billing') && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500 text-white">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Accountant
                  </Badge>
                </div>
                <span className="font-semibold">1</span>
              </div>
            )}
            
            {/* Show doctor if OPD or IPD is enabled */}
            {(isModuleEnabled('opd') || isModuleEnabled('ipd')) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500 text-white">
                    <Stethoscope className="h-4 w-4 mr-1" />
                    Doctor
                  </Badge>
                </div>
                <span className="font-semibold">4</span>
              </div>
            )}
            
            {/* Show pharmacist if pharmacy module is enabled */}
            {isModuleEnabled('pharmacy') && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500 text-white">
                    <Pill className="h-4 w-4 mr-1" />
                    Pharmacist
                  </Badge>
                </div>
                <span className="font-semibold">1</span>
              </div>
            )}
            
            {/* Show pathologist if pathology module is enabled */}
            {isModuleEnabled('pathology') && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500 text-white">
                    <FlaskConical className="h-4 w-4 mr-1" />
                    Pathologist
                  </Badge>
                </div>
                <span className="font-semibold">1</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-500 text-white">
                  <Activity className="h-4 w-4 mr-1" />
                  Radiologist
                </Badge>
              </div>
              <span className="font-semibold">1</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Calendar</CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              −
            </Button>
            <Button variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                {"<"}
              </Button>
              <Button variant="ghost" size="sm">
                {">"}
              </Button>
              <Button variant="outline" size="sm">
                Today
              </Button>
            </div>
            <h3 className="text-xl font-semibold">May 18 – 24 2025</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Month
              </Button>
              <Button variant="outline" size="sm">
                Week
              </Button>
              <Button variant="outline" size="sm">
                Day
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-1">
            <div className="p-2 text-sm font-medium">all-day</div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-2 text-sm font-medium text-center">
                {day.day}
              </div>
            ))}

            {timeSlots.map((time, timeIndex) => (
              <div key={timeIndex} className="contents">
                <div className="p-2 text-sm text-gray-600">{time}</div>
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={`${timeIndex}-${dayIndex}`}
                    className={`h-12 border border-gray-200 ${
                      dayIndex === 6 && timeIndex >= 6
                        ? day.color
                        : dayIndex < 5 && timeIndex >= 2 && timeIndex <= 8
                          ? day.color
                          : "bg-white"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
