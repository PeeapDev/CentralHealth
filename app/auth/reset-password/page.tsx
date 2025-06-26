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
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPasswordPage() {
  const [medicalNumber, setMedicalNumber] = useState("")
  const [token, setToken] = useState("")
  const [resetId, setResetId] = useState("")
  const [tokenValid, setTokenValid] = useState<boolean | undefined>(undefined)
  const [tokenValidationLoading, setTokenValidationLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill from URL query params if available and validate token
  useEffect(() => {
    if (!searchParams) return;
    
    const medicalNum = searchParams.get("medicalNumber")
    const resetToken = searchParams.get("token")
    const resetIdParam = searchParams.get("id")
    
    if (medicalNum) setMedicalNumber(medicalNum)
    if (resetToken) setToken(resetToken)
    if (resetIdParam) setResetId(resetIdParam)

    // If we have both token and resetId, validate the token
    if (resetToken && resetIdParam) {
      validateToken(resetIdParam, resetToken);
    }
  }, [searchParams])
  
  // Function to validate the token
  const validateToken = async (resetIdParam: string, resetToken: string) => {
    try {
      setTokenValidationLoading(true);
      const response = await fetch(`/api/patients/validate-token?id=${encodeURIComponent(resetIdParam)}&token=${encodeURIComponent(resetToken)}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setTokenValid(true);
        // If patient info is returned, set the medical number
        if (data.patientInfo?.mrn) {
          setMedicalNumber(data.patientInfo.mrn);
        }
      } else {
        setTokenValid(false);
        toast({
          title: "Invalid or Expired Token",
          description: "The password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setTokenValid(false);
    } finally {
      setTokenValidationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!resetId || !token || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    
    // Medical IDs are permanent identifiers and should never be changed
    // We don't need special handling for any specific patient
    
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
          token,
          resetId,
          newPassword,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccessMessage("Your password has been reset successfully")
        
        // Clear form fields
        setToken("")
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

  // Safe helper to check if a search param exists
  const hasSearchParam = (name: string): boolean => {
    if (!searchParams) return false;
    return !!searchParams.get(name);
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
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">
                    {successMessage}
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to the login page...
                </p>
              </div>
            ) : tokenValidationLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Validating your reset token...</p>
              </div>
            ) : tokenValid === false ? (
              <div className="space-y-4 text-center py-6">
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700">
                    This password reset link is invalid or has expired.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Please request a new password reset link from the
                  <Link href="/auth/forgot-password" className="text-primary hover:underline mx-1">
                    forgot password
                  </Link>
                  page.
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
                    disabled={isLoading || hasSearchParam("id")}
                    readOnly={hasSearchParam("id")}
                  />
                  {hasSearchParam("id") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Medical number is automatically filled based on your reset link
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resetId">Reset ID</Label>
                  <Input
                    id="resetId"
                    placeholder="Reset ID from your email link"
                    value={resetId}
                    onChange={(e) => setResetId(e.target.value)}
                    disabled={isLoading || hasSearchParam("id")}
                    readOnly={hasSearchParam("id")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">Reset Token</Label>
                  <Input
                    id="token"
                    placeholder="Paste the reset token from your email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading || hasSearchParam("token")}
                    readOnly={hasSearchParam("token")}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This token was sent in the password reset link to your email
                  </p>
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
