"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, EyeIcon, EyeOff } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  const [medicalNumber, setMedicalNumber] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill from URL query params if available
  useEffect(() => {
    if (searchParams) {
      const medicalNum = searchParams.get("medicalNumber")
      const code = searchParams.get("code")
      
      if (medicalNum) setMedicalNumber(medicalNum)
      if (code) setResetCode(code)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!medicalNumber || !resetCode || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/patients/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicalNumber,
          resetCode,
          newPassword,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccessMessage("Your password has been reset successfully")
        
        // Clear form fields
        setResetCode("")
        setNewPassword("")
        setConfirmPassword("")
        
        setTimeout(() => {
          router.push(`/auth/login?medicalNumber=${medicalNumber}&passwordReset=true`)
        }, 3000)
      } else {
        throw new Error(data.message || "Failed to reset password")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your reset code and new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage ? (
              <div className="space-y-4 text-center">
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                  {successMessage}
                </div>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to the login page...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medicalNumber">Medical Number</Label>
                  <Input
                    id="medicalNumber"
                    placeholder="e.g. P12345"
                    value={medicalNumber}
                    onChange={(e) => setMedicalNumber(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resetCode">Reset Code</Label>
                  <Input
                    id="resetCode"
                    placeholder="Enter the 6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link 
              href="/auth/login" 
              className="flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
