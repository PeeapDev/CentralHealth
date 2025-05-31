"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function ForgotPasswordPage() {
  const [medicalNumber, setMedicalNumber] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that at least one field is filled
    if (!medicalNumber && !email) {
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
      
      const response = await fetch("/api/patients/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicalNumber,
          email,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccessMessage(data.message || "Password reset instructions have been sent")
        
        // In development, show debug info if available
        if (data.debug) {
          console.log("DEBUG - Reset code:", data.debug.resetCode)
          toast({
            title: "Development Mode",
            description: `Reset code: ${data.debug.resetCode}`,
            duration: 10000,
          })
        }
      } else {
        throw new Error(data.message || "Something went wrong")
      }
    } catch (error: any) {
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
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                  {successMessage}
                </div>
                <p className="text-sm text-muted-foreground">
                  Please check your email for instructions on how to reset your password.
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
                    placeholder="e.g. patient@example.com"
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
