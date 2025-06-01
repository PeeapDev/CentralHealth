"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, CheckCircle, Pause, Ban, Users, UserCheck, UserX } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

export default function SuperadminDashboard() {
  const router = useRouter()

  // Completely disable client-side redirect checks to prevent loops
  // Instead, we'll rely on server-side middleware for authentication
  // This removes all client-side redirects that could cause loops
  
  useEffect(() => {
    // Log that we're on the superadmin page for debugging
    console.log('Superadmin dashboard loaded. If you see this, login was successful.')
    
    // Check for token but DON'T redirect - just log it
    const hasToken = document.cookie.includes('token')
    console.log('Token present:', hasToken)
  }, [])

  const stats = [
    {
      title: "Total hospitals",
      value: "12",
      icon: Building2,
      color: "bg-blue-100 text-blue-600",
      cardColor: "bg-blue-50",
    },
    {
      title: "Active hospitals",
      value: "10",
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      cardColor: "bg-green-50",
    },
    {
      title: "Inactive hospitals",
      value: "2",
      icon: Pause,
      color: "bg-gray-100 text-gray-600",
      cardColor: "bg-gray-50",
    },
    {
      title: "Licence Expired",
      value: "4",
      icon: Ban,
      color: "bg-red-100 text-red-600",
      cardColor: "bg-red-50",
    },
  ]

  const patientStats = [
    {
      title: "Total Patients",
      value: "24,847",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      cardColor: "bg-purple-50",
    },
    {
      title: "Total Male",
      value: "12,423",
      icon: UserCheck,
      color: "bg-cyan-100 text-cyan-600",
      cardColor: "bg-cyan-50",
    },
    {
      title: "Total Female",
      value: "12,424",
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
      <div className="flex items-center space-x-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src="/placeholder.svg?height=64&width=64" />
          <AvatarFallback className="bg-yellow-400 text-white text-xl">SA</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, Super Admin!</h1>
          <p className="text-gray-600">Welcome to the dashboard of Hospital Management System</p>
        </div>
      </div>

      {/* Hospital Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
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
        ))}
      </div>

      {/* Patient Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {patientStats.map((stat, index) => (
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
        ))}
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
