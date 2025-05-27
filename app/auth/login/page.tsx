"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, Eye, EyeOff, Building2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  })

  // Demo accounts - only superadmin now
  const demoAccounts = [
    {
      role: "superadmin",
      email: "superadmin@medicore.com",
      password: "super123",
      redirect: "/superadmin",
    },
  ]

  // Demo hospitals for hospital admin login
  const demoHospitals = [
    {
      name: "Smart Hospital & Research Center",
      slug: "smart-hospital",
      adminEmail: "admin@smarthospital.com",
      adminPassword: "admin123",
      adminName: "Dr. John Smith",
    },
    {
      name: "City Medical Center",
      slug: "city-medical",
      adminEmail: "admin@citymedical.com",
      adminPassword: "admin123",
      adminName: "Dr. Sarah Johnson",
    },
    {
      name: "General Hospital",
      slug: "general-hospital",
      adminEmail: "admin@generalhospital.com",
      adminPassword: "admin123",
      adminName: "Dr. Michael Brown",
    },
  ]

  const handleDemoLogin = (account: (typeof demoAccounts)[0]) => {
    setFormData({
      email: account.email,
      password: account.password,
      role: account.role,
    })
  }

  const handleHospitalDemoLogin = (hospital: (typeof demoHospitals)[0]) => {
    // Redirect to hospital's login page instead of instant login
    router.push(`/${hospital.slug}/auth/login`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log('Attempting login with:', { email: formData.email, role: formData.role });
      
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.error || error.detail || "Login failed");
        return;
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      // Automatically redirects to superadmin dashboard via middleware
      if (data.user.role === 'superadmin') {
        console.log('Redirecting to superadmin dashboard');
        // Force navigation to superadmin dashboard
        window.location.href = '/superadmin';
      } else {
        // For non-superadmin roles
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl">MediCore</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Administrator</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Demo Accounts</span>
                </div>
              </div>

              {/* Super Admin Demo */}
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-2">Super Administrator</div>
                {demoAccounts.map((account, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDemoLogin(account)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="capitalize">{account.role}</span>
                      <span className="text-muted-foreground">- {account.email}</span>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Removed Demo Hospitals Section */}
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
