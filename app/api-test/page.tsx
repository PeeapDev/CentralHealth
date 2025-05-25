"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Copy, Play, User, Users, Calendar, Activity, Building2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ApiTestPage() {
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)

  useEffect(() => {
    testApiStatus()
    loadCurrentToken()
  }, [])

  const loadCurrentToken = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      setCurrentToken(token)
    }
  }

  const testApiStatus = async () => {
    try {
      setError(null)
      const response = await fetch("/api/test")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`)
      }

      const data = await response.json()
      setApiStatus(data)
    } catch (error) {
      console.error("API test failed:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    }
  }

  const testEndpoint = async (endpoint: string, method = "GET", body?: any) => {
    setLoading(endpoint)
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      }

      if (currentToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${currentToken}`,
        }
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`/api/v1${endpoint}`, options)

      let data
      try {
        data = await response.json()
      } catch {
        data = { error: "Invalid JSON response", status: response.status }
      }

      setTestResults((prev) => ({
        ...prev,
        [endpoint]: { success: response.ok, data, status: response.status },
      }))

      if (response.ok) {
        toast.success(`${method} ${endpoint} - Success`)
      } else {
        toast.error(`${method} ${endpoint} - Failed (${response.status})`)
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [endpoint]: { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      }))
      toast.error(`${method} ${endpoint} - Error`)
    } finally {
      setLoading(null)
    }
  }

  const loginWithDemo = async (role: string, hospitalSlug?: string) => {
    try {
      if (!apiStatus?.demoTokens?.tokens) {
        toast.error("Demo tokens not available")
        return
      }

      let token: string
      if (role === "superadmin") {
        token = apiStatus.demoTokens.tokens.superadmin
      } else if (role === "admin") {
        token = apiStatus.demoTokens.tokens.smartHospitalAdmin
      } else if (role === "doctor") {
        token = apiStatus.demoTokens.tokens.doctor1
      } else {
        toast.error("Invalid role")
        return
      }

      // Store token
      localStorage.setItem("auth_token", token)
      setCurrentToken(token)

      // Mock user data based on role
      const mockUser = {
        id: `user_${role}_1`,
        firstName: role === "superadmin" ? "Super" : role === "admin" ? "Admin" : "Dr. John",
        lastName: role === "superadmin" ? "Admin" : role === "admin" ? "User" : "Smith",
        email:
          role === "superadmin"
            ? "superadmin@system.com"
            : role === "admin"
              ? "admin@smarthospital.com"
              : "dr.smith@smarthospital.com",
        role: role,
        hospital:
          role !== "superadmin"
            ? {
                id: hospitalSlug || "smart-hospital",
                name: "Smart Hospital & Research Center",
                slug: hospitalSlug || "smart-hospital",
              }
            : null,
      }

      setCurrentUser(mockUser)
      toast.success(`Logged in as ${role}`)
    } catch (error) {
      toast.error("Login failed")
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast.success("Token copied to clipboard")
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    setCurrentToken(null)
    setCurrentUser(null)
    toast.success("Logged out")
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>API Error:</strong> {error}
            <br />
            <Button onClick={testApiStatus} className="mt-2" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">API Testing Dashboard</h1>
        <p className="text-muted-foreground">Test all Hospital Management System APIs</p>
        {currentToken && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Authenticated
            </Badge>
            <Button onClick={logout} size="sm" variant="outline">
              Logout
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="status">API Status</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
        </TabsList>

        {/* API Status */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                API Status & Documentation
              </CardTitle>
              <CardDescription>View all available endpoints and demo credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {apiStatus.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{apiStatus.timestamp}</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Available Endpoints</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {Object.entries(apiStatus.endpoints || {}).map(([category, endpoints]: [string, any]) => (
                            <div key={category}>
                              <h4 className="font-medium capitalize">{category}</h4>
                              <ul className="ml-4 space-y-1 text-muted-foreground">
                                {Object.entries(endpoints).map(([name, endpoint]: [string, any]) => (
                                  <li key={name} className="font-mono text-xs">
                                    {endpoint}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Demo Tokens</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {apiStatus.demoTokens &&
                            Object.entries(apiStatus.demoTokens.tokens || {}).map(([role, token]: [string, any]) => (
                              <div key={role} className="flex items-center gap-2">
                                <Badge variant="outline">{role}</Badge>
                                <Button size="sm" variant="ghost" onClick={() => copyToken(token)} className="h-6 px-2">
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading API status...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication */}
        <TabsContent value="auth">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Quick Login
                </CardTitle>
                <CardDescription>Login with demo accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => loginWithDemo("superadmin")} className="w-full">
                  Login as Super Admin
                </Button>
                <Button onClick={() => loginWithDemo("admin")} variant="outline" className="w-full">
                  Login as Hospital Admin
                </Button>
                <Button onClick={() => loginWithDemo("doctor")} variant="outline" className="w-full">
                  Login as Doctor
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
              </CardHeader>
              <CardContent>
                {currentUser ? (
                  <div className="space-y-2">
                    <p>
                      <strong>Name:</strong> {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong> {currentUser.email}
                    </p>
                    <p>
                      <strong>Role:</strong> <Badge>{currentUser.role}</Badge>
                    </p>
                    {currentUser.hospital && (
                      <p>
                        <strong>Hospital:</strong> {currentUser.hospital.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Not logged in</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patients */}
        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patients API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => testEndpoint("/patients")} disabled={loading === "/patients"}>
                  <Play className="h-4 w-4 mr-2" />
                  GET Patients
                </Button>
                <Button
                  onClick={() =>
                    testEndpoint("/patients", "POST", {
                      firstName: "John",
                      lastName: "Doe",
                      email: "john.doe@example.com",
                      phone: "+1234567890",
                      dateOfBirth: "1990-01-01",
                      gender: "male",
                    })
                  }
                  variant="outline"
                  disabled={loading === "/patients"}
                >
                  <Play className="h-4 w-4 mr-2" />
                  POST Create Patient
                </Button>
              </div>

              {testResults["/patients"] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(testResults["/patients"], null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointments API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => testEndpoint("/appointments")} disabled={loading === "/appointments"}>
                  <Play className="h-4 w-4 mr-2" />
                  GET Appointments
                </Button>
                <Button
                  onClick={() =>
                    testEndpoint("/appointments", "POST", {
                      patientId: "P001",
                      doctorId: "D001",
                      appointmentDate: "2024-05-25T10:00:00Z",
                      duration: 30,
                      reason: "Regular checkup",
                    })
                  }
                  variant="outline"
                  disabled={loading === "/appointments"}
                >
                  <Play className="h-4 w-4 mr-2" />
                  POST Create Appointment
                </Button>
              </div>

              {testResults["/appointments"] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(testResults["/appointments"], null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Dashboard API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => testEndpoint("/dashboard/stats")} disabled={loading === "/dashboard/stats"}>
                <Play className="h-4 w-4 mr-2" />
                GET Dashboard Stats
              </Button>

              {testResults["/dashboard/stats"] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Dashboard Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(testResults["/dashboard/stats"], null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hospitals */}
        <TabsContent value="hospitals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Hospitals API (Super Admin Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => testEndpoint("/hospitals")} disabled={loading === "/hospitals"}>
                  <Play className="h-4 w-4 mr-2" />
                  GET Hospitals
                </Button>
                <Button
                  onClick={() =>
                    testEndpoint("/hospitals", "POST", {
                      name: "Test Hospital",
                      slug: "test-hospital",
                      contact: {
                        email: "admin@testhospital.com",
                        phone: "+1234567890",
                      },
                    })
                  }
                  variant="outline"
                  disabled={loading === "/hospitals"}
                >
                  <Play className="h-4 w-4 mr-2" />
                  POST Create Hospital
                </Button>
              </div>

              {testResults["/hospitals"] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(testResults["/hospitals"], null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
