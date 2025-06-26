"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [medicalNumber, setMedicalNumber] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()

  const [devModeResetUrl, setDevModeResetUrl] = useState("") 
  const [devModeEmailInfo, setDevModeEmailInfo] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous dev mode data
    setDevModeResetUrl("")
    setDevModeEmailInfo(null)
    
    // Normalize email to lowercase and trim
    const normalizedEmail = email.trim().toLowerCase()
    
    // Validate that at least one field is filled
    if (!medicalNumber && !normalizedEmail) {
      toast({
        title: "Error",
        description: "Please enter your medical number or email",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      setSuccessMessage("")
      
      // Log the request attempt with a request ID for tracing
      const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2)
      console.log(`[${requestId}] Password reset requested:`, { 
        hasMedicalNumber: !!medicalNumber, 
        hasEmail: !!normalizedEmail,
        emailMasked: normalizedEmail ? `${normalizedEmail.substring(0, 3)}****${normalizedEmail.substring(normalizedEmail.indexOf('@'))}` : ''
      });
      
      const response = await fetch("/api/patients/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId
        },
        body: JSON.stringify({
          medicalNumber,
          email: normalizedEmail,
        }),
      })
      
      const data = await response.json()
      console.log(`[${requestId}] Password reset response:`, { 
        status: response.status,
        success: data.success,
        hasDebugInfo: !!data.debug
      });
      
      // In all cases where the response is OK, we'll treat it as success
      // This is to handle both real success and our special dev mode success cases
      if (response.ok) {
        // Show primary success message to the user
        setSuccessMessage(data.message || "Password reset instructions have been sent")
        
        // Handle development mode debug info with special UI
        if (data.debug) {
          console.log(`[${requestId}] Reset debug info:`, data.debug)
          
          if (data.debug.resetUrl) {
            // Store the reset URL for dev mode UI
            setDevModeResetUrl(data.debug.resetUrl)
            
            // If we have email content in dev mode, show it
            if (data.debug.emailDestination) {
              setDevModeEmailInfo({
                to: data.debug.emailDestination,
                emailSent: data.debug.emailSent,
                htmlPreview: data.debug.htmlPreview
              })
            }
            
            // Special handling for dev mode with no patient email
            const isNoEmailCase = data.debug.noEmailAvailable;
            
            // Show the reset URL in a toast for easy testing
            toast({
              title: isNoEmailCase
                ? "DEV MODE: No Email Available"
                : (data.debug.emailSent 
                  ? "Password Reset Link (Dev Mode)" 
                  : "Password Reset Link (Email Not Sent)"),
              description: (
                <div className="break-all">
                  <p className="mb-2">
                    {isNoEmailCase 
                      ? "No email found for this patient, but you can use this direct link in development mode:" 
                      : (data.debug.emailSent 
                        ? "Email would be sent to: " + data.debug.emailDestination 
                        : "Email delivery FAILED but you can still use this link:")}
                  </p>
                  <a 
                    href={data.debug.resetUrl} 
                    className="text-blue-500 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {data.debug.resetUrl}
                  </a>
                </div>
              ),
              duration: 30000,
            })
          }
        }
      } else if (data.message === "No patient found with the provided information" && process.env.NODE_ENV !== "production") {
        // Special handling for dev mode when no patient is found
        toast({
          title: "No Patient Found",
          description: "No patient was found with the provided email or medical number. Please check your input.",
          duration: 5000
        });
      } else {
        // Only throw an error in non-development mode or for other types of errors
        if (process.env.NODE_ENV === "production") {
          throw new Error(data.message || "Something went wrong");
        } else {
          // In dev mode, just show a toast with the error
          console.error(`[${requestId}] Password reset error:`, data.message || "Something went wrong");
          toast({
            title: "Development Mode Error",
            description: data.message || "Something went wrong, but you're in development mode so we're not failing completely.",
            variant: "destructive",
            duration: 5000
          });
        }
      }
    } catch (error: any) {
      console.error("Password reset error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
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
            <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              Enter your medical number or email to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage ? (
              <div className="space-y-4 text-center">
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">
                    {devModeResetUrl && !devModeEmailInfo?.emailSent 
                      ? "Email delivery could not be completed, but a reset link is available below"
                      : "Password reset instructions have been sent to your email"}
                  </AlertDescription>
                </Alert>
                
                {/* Development mode direct reset link */}
                {devModeResetUrl && (
                  <div className="space-y-3 mt-4 p-3 border border-blue-200 rounded-md bg-blue-50">
                    <p className="text-sm font-medium text-blue-800">
                      Development Mode: Direct Password Reset
                    </p>
                    <div className="flex flex-col space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {devModeEmailInfo?.to && (
                          <span>Email {devModeEmailInfo.emailSent ? "would be sent" : "attempted"} to: <strong>{devModeEmailInfo.to}</strong></span>
                        )}
                      </p>
                      <a 
                        href={devModeResetUrl}
                        className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Reset Password
                      </a>
                      <p className="text-xs text-blue-600 break-all">
                        {devModeResetUrl}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Standard email instructions */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Please check your email for instructions on how to reset your password.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> If you do not receive an email, please contact hospital administration.
                  </p>
                </div>
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
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  or
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
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
                      Sending instructions...
                    </>
                  ) : (
                    "Send Reset Instructions"
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
