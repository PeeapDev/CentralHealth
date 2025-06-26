"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { storePatientCredentials, isPatientLoggedIn } from "@/lib/patient-auth"

export default function PatientLoginPage() {
  const router = useRouter()
  const [medicalNumber, setMedicalNumber] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Check if already logged in
  useEffect(() => {
    if (isPatientLoggedIn()) {
      // User is already logged in, redirect to patient dashboard
      router.push("/patient")
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!medicalNumber) {
        toast.error("Please enter your medical number")
        setLoading(false)
        return
      }

      // Use our centralized auth utility to store credentials consistently
      const stored = storePatientCredentials(medicalNumber, email)
      
      if (stored) {
        toast.success("Login successful")
        
        // Redirect to the patient dashboard
        router.push("/patient")
      } else {
        toast.error("Failed to store credentials. Please try again.")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Patient Login</CardTitle>
          <CardDescription>
            Enter your medical number to access your dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicalNumber">Medical Number</Label>
              <Input
                id="medicalNumber"
                placeholder="Enter your medical number"
                value={medicalNumber}
                onChange={(e) => setMedicalNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login to Dashboard"}
            </Button>
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
