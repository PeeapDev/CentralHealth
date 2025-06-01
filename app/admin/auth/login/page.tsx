"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Eye, EyeOff } from "lucide-react"

export default function AdminLoginPage() {
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

    // Handle staff login
    try {
      console.log('Attempting staff login with:', { email: formData.email, role: formData.role });
      
      // Get the current origin to ensure we're using the correct port
      const origin = window.location.origin;
      console.log('Current origin:', origin);
      
      // Use the full URL with origin to ensure correct port
      const response = await fetch(`${origin}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      // First check the response type to help debug the issue
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (!response.ok) {
        try {
          // Try to parse as JSON, but handle case where it's not JSON
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          
          let errorObj;
          try {
            errorObj = JSON.parse(errorText);
            setError(errorObj.error || errorObj.detail || "Login failed");
          } catch (jsonError) {
            console.error('Error parsing error response as JSON:', jsonError);
            setError("Server returned an invalid response. Please try again.");
          }
        } catch (err) {
          console.error('Error reading response:', err);
          setError("Could not read server response. Please try again.");
        }
        return;
      }

      // Handle the success response carefully
      let data;
      try {
        const responseText = await response.text();
        console.log('Response text preview:', responseText.substring(0, 100));
        
        data = JSON.parse(responseText);
        console.log('Login successful:', data);  
      } catch (jsonError) {
        console.error('Error parsing success response as JSON:', jsonError);
        setError("Failed to parse server response. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Set auth token
      if (data.access_token) {
        console.log('Setting auth token cookie...');
        const maxAge = 7 * 24 * 60 * 60;
        
        // Clear any existing token first
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        
        // Set new token cookie
        document.cookie = `token=${data.access_token}; path=/; max-age=${maxAge}; SameSite=Lax;`;
        
        // Set loading state to show user something is happening
        setIsLoading(true);
        
        if (formData.role === 'superadmin') {
          console.log('Redirecting to superadmin dashboard...');
          // Use a form submission redirect for the most reliable navigation
          const form = document.createElement('form');
          form.method = 'GET';
          form.action = '/superadmin';
          document.body.appendChild(form);
          form.submit();
        } else {
          console.log('Redirecting to hospital admin dashboard...');
          // Hospital admin redirect using the same reliable method
          const form = document.createElement('form');
          form.method = 'GET';
          form.action = '/' + data.user.hospital.subdomain + '/admin/dashboard';
          document.body.appendChild(form);
          form.submit();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Central Health - Admin</h1>
          <p className="text-gray-500">Sierra Leone's National Health System</p>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the administrative area</CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">Super Administrator</SelectItem>
                      <SelectItem value="admin">Hospital Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Quick login buttons for demo accounts */}
                <div className="pt-2">
                  <p className="text-sm font-medium text-center mb-2">Quick Access (Demo)</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {demoAccounts.map((account, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin(account)}
                      >
                        {account.role}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              
              <div className="text-center text-sm">
                <p className="text-muted-foreground">Access hospital administration</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {demoHospitals.map((hospital, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleHospitalDemoLogin(hospital)}
                    >
                      {hospital.name}
                    </Button>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:underline">
                Go to Patient Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
