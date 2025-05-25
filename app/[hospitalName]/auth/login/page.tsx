"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Building2, ArrowLeft } from "lucide-react"

// Demo hospital data
const demoHospitals = [
  {
    slug: "smart-hospital",
    name: "Smart Hospital & Research Center",
    logo: "/placeholder.svg?height=40&width=40",
    adminEmail: "admin@smarthospital.com",
    adminPassword: "admin123",
    adminName: "Dr. John Smith",
    address: "123 Medical Center Dr, New York, NY 10001",
  },
  {
    slug: "city-medical",
    name: "City Medical Center",
    logo: "/placeholder.svg?height=40&width=40",
    adminEmail: "admin@citymedical.com",
    adminPassword: "admin123",
    adminName: "Dr. Sarah Johnson",
    address: "456 Healthcare Ave, Los Angeles, CA 90210",
  },
  {
    slug: "general-hospital",
    name: "General Hospital",
    logo: "/placeholder.svg?height=40&width=40",
    adminEmail: "admin@generalhospital.com",
    adminPassword: "admin123",
    adminName: "Dr. Michael Brown",
    address: "789 Health St, Chicago, IL 60601",
  },
]

export default function HospitalLoginPage() {
  const router = useRouter()
  const params = useParams()
  const hospitalSlug = params.hospitalName as string

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hospital, setHospital] = useState<(typeof demoHospitals)[0] | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    // Find the hospital by slug
    const foundHospital = demoHospitals.find((h) => h.slug === hospitalSlug)
    if (foundHospital) {
      setHospital(foundHospital)
    } else {
      // Hospital not found, redirect to main login
      router.push("/auth/login")
    }
  }, [hospitalSlug, router])

  const handleDemoLogin = () => {
    if (hospital) {
      setFormData({
        email: hospital.adminEmail,
        password: hospital.adminPassword,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (hospital && formData.email === hospital.adminEmail && formData.password === hospital.adminPassword) {
      // Store auth state
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: {
            email: hospital.adminEmail,
            role: "admin",
            hospitalSlug: hospital.slug,
            name: hospital.adminName,
            hospitalName: hospital.name,
          },
          token: "demo-token",
        }),
      )
      router.push(`/${hospital.slug}/admin`)
    } else {
      setError("Invalid credentials for this hospital")
    }

    setIsLoading(false)
  }

  if (!hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Hospital not found</p>
          <Button asChild className="mt-4">
            <Link href="/auth/login">Back to Main Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Hospital Branding */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 mb-6">
            <img src={hospital.logo || "/placeholder.svg"} alt={hospital.name} className="w-10 h-10 rounded-lg" />
            <div className="text-left">
              <div className="font-bold text-xl">{hospital.name}</div>
              <div className="text-sm text-muted-foreground">{hospital.address}</div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Hospital Admin Login</CardTitle>
            <CardDescription>Sign in to access {hospital.name} dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Demo Account</span>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="outline" className="w-full justify-start" onClick={handleDemoLogin}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Hospital Admin</span>
                    <span className="text-muted-foreground">- {hospital.adminEmail}</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Back to Main Login */}
            <div className="mt-6 text-center">
              <Button variant="ghost" asChild className="text-sm">
                <Link href="/auth/login" className="inline-flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Main Login</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
