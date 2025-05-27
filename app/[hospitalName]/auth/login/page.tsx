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

// Hospital data will be fetched from the server

// Define the hospital type
type Hospital = {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  logo?: string;
  address?: string;
  admin_email?: string;
  settings?: any;
}

export default function HospitalLoginPage() {
  const router = useRouter()
  const params = useParams()
  const hospitalSlug = params?.hospitalName as string || ''

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    // Fetch hospital data from the API
    const fetchHospital = async () => {
      try {
        const response = await fetch(`/api/hospitals/${hospitalSlug}`);
        if (!response.ok) {
          throw new Error('Hospital not found');
        }
        
        const data = await response.json();
        console.log('Fetched hospital data:', data);
        
        // Store the complete hospital data
        setHospital({
          id: data.id,
          name: data.name,
          subdomain: data.subdomain,
          description: data.description,
          logo: data.logo || '/placeholder.svg?height=40&width=40',
          address: data.address,
          admin_email: data.admin_email || '',
          settings: data.settings || {},
        });
        
        // Pre-populate the email field with the admin email
        setFormData(prevState => ({
          ...prevState,
          email: data.admin_email || ''
        }));
      } catch (error) {
        console.error('Error fetching hospital:', error);
        // Hospital not found, redirect to main login
        router.push('/auth/login');
      }
    };

    if (hospitalSlug) {
      fetchHospital();
    } else {
      router.push('/auth/login');
    }
  }, [hospitalSlug, router]);

  // Need to add a demo login button to fill credentials 
  const handleDemoFill = () => {
    if (hospital) {
      // Use the admin_email directly from the hospital object
      setFormData({
        email: hospital.admin_email || '',
        password: '', // Let the user input the password
      });
      
      console.log('Pre-filled with admin email:', hospital.admin_email);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Call the real authentication API with the hospital ID
      const loginData = {
        email: formData.email,
        password: formData.password,
        hospitalId: hospital?.id,
      };
      
      console.log('Attempting hospital login with:', JSON.stringify(loginData, null, 2));
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Login successful - store the token in local storage and cookies
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: {
            email: formData.email,
            role: data.user.role,
            hospitalId: hospital?.id,
            hospitalSlug: hospital?.subdomain,
            name: data.user.name || 'Hospital Admin',
            hospitalName: hospital?.name,
          },
          token: data.access_token,
        }),
      )
      router.push(`/${hospital?.subdomain}/admin`)
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
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
              {hospital.admin_email && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">Admin Login:</span> {hospital.admin_email}
                </div>
              )}
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Demo Account</span>
              </div>
            </div>

            <div className="mt-4">
              {hospital && (
                <div className="flex items-center space-x-2 mb-6 p-3 bg-secondary/20 rounded-lg" onClick={handleDemoFill}>
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Hospital Admin</span>
                  <span className="text-muted-foreground">- {hospital.admin_email}</span>
                </div>
              )}
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
