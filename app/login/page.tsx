"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { FcGoogle } from "react-icons/fc"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"patient" | "staff">("patient")
  const isPatientLogin = activeTab === "patient"
  const [medicalNumber, setMedicalNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Handle patient login
    if (isPatientLogin) {
      try {
        if (!medicalNumber) {
          toast.error("Please enter your medical number")
          setLoading(false)
          return
        }

        // For testing purposes, we'll store the medical number in localStorage
        localStorage.setItem("medicalNumber", medicalNumber)
        
        // Store a patient name for display purposes
        localStorage.setItem("patientName", email ? email.split('@')[0] : "Test Patient")

        toast.success("Patient login successful")

        // Redirect to the patient dashboard
        setTimeout(() => {
          router.push("/patient/dashboard")
        }, 500)
        return
      } catch (error) {
        console.error("Patient login error:", error)
        toast.error("Patient login failed")
        setLoading(false)
        return
      }
    }

    try {
      // For superadmin login (debug purposes)
      if (email === 'superadmin@medicore.com' && password === 'super123') {
        toast.success("Superadmin login successful")
        
        // Store token in cookie for proper authentication
        document.cookie = `token=superadmin_token; path=/; max-age=86400; SameSite=Strict`;
        
        // Direct access with window.location to ensure full page reload and proper styling
        window.location.href = "/superadmin";
        return;
      }
      
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: 'no-store'
      })

      const data = await response.json()

      if (response.ok && data.access_token) {
        // Store token in cookie for proper authentication
        document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;
        localStorage.setItem('user_role', data.user?.role || 'user');
        localStorage.setItem('user_email', email);
        
        toast.success("Login successful")
        
        // Add a delay to ensure cookie is set before navigation
        setTimeout(() => {
          if (data.user?.role === 'superadmin') {
            router.push("/superadmin")
          } else if (data.user?.hospitalId) {
            router.push(`/${data.user.hospitalId}/admin`)
          } else {
            router.push("/dashboard")
          }
          router.refresh()
        }, 500)
      } else {
        toast.error(data.error || "Login failed")
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Hospital Portal Login</h1>
          <p className="text-sm text-muted-foreground">
            Please choose your login method
          </p>
        </div>
        
        <div className="flex items-center space-x-4 border-b">
          <button
            onClick={() => setActiveTab("patient")}
            className={`pb-2 text-sm font-medium ${isPatientLogin
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"}`}
          >
            Patient Login
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`pb-2 text-sm font-medium ${!isPatientLogin
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"}`}
          >
            Staff Login
          </button>
        </div>
        {isPatientLogin && (
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-1 gap-4 mb-6">
              <LoginLink className="w-full" authUrlParams={{provider: "google"}}>
                <Button 
                  type="button"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center py-5 text-base"
                >
                  <FcGoogle className="mr-2 h-6 w-6 bg-white rounded-full p-1" />
                  Sign in with Google
                </Button>
              </LoginLink>
              
              <RegisterLink className="w-full" authUrlParams={{provider: "google"}}>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center border-2 py-5 text-base"
                >
                  <FcGoogle className="mr-2 h-6 w-6" />
                  Register with Google
                </Button>
              </RegisterLink>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or use medical number
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isPatientLogin ? (
            <>
              <div className="space-y-2">
                <Input
                  placeholder="Medical Number"
                  value={medicalNumber}
                  onChange={(e) => setMedicalNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-sm text-blue-600 cursor-pointer hover:underline mt-2" onClick={() => {
                // Direct superadmin access for testing
                document.cookie = `token=superadmin_token; path=/; max-age=86400; SameSite=Strict`;
                localStorage.setItem('user_role', 'superadmin');
                localStorage.setItem('user_email', 'superadmin@medicore.com');
                window.location.href = '/superadmin';
              }}>
                Quick Superadmin Access (Development Only)
              </div>
            </>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}
