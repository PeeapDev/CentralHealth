"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, MailIcon, CheckIcon, XIcon, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function EmailTestPage() {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [checkLoading, setCheckLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const { toast } = useToast()

  const checkEmailConfig = async () => {
    try {
      setCheckLoading(true)
      const response = await fetch("/api/patients/email-check", {
        method: "GET",
      })
      
      const data = await response.json()
      setEmailStatus(data)
      
      if (!data.emailServiceConfigured) {
        toast({
          title: "Email Configuration Missing",
          description: "Email service is not fully configured. Check the environment variables.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check email configuration",
        variant: "destructive",
      })
    } finally {
      setCheckLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a patient's real email address",
        variant: "destructive",
      })
      return
    }
    
    try {
      setTestLoading(true)
      setTestResult(null)
      const response = await fetch("/api/patients/email-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail,
        }),
      })
      
      const data = await response.json()
      setTestResult(data)
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Verification email sent to ${recipientEmail}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send test email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Email Service Verification</CardTitle>
            <CardDescription>
              Verify the email service configuration for patient communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Config Check */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Email Configuration Status</h3>
                <Button 
                  onClick={checkEmailConfig} 
                  disabled={checkLoading}
                  variant="outline"
                  size="sm"
                >
                  {checkLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Configuration"
                  )}
                </Button>
              </div>
              
              {emailStatus && (
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-full ${emailStatus.emailServiceConfigured ? 'bg-green-100' : 'bg-red-100'}`}>
                      {emailStatus.emailServiceConfigured ? (
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <XIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        Email Service: {emailStatus.emailServiceConfigured ? 'Configured' : 'Not Configured'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(emailStatus.config).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${value === '[configured]' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium capitalize">{key}:</span>
                        <span>{typeof value === 'string' ? value : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {emailStatus && !emailStatus.emailServiceConfigured && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Email Configuration Issue</AlertTitle>
                  <AlertDescription>
                    The password reset feature requires email service configuration. 
                    Please set up the following environment variables:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>EMAIL_SERVER_HOST</li>
                      <li>EMAIL_SERVER_PORT</li>
                      <li>EMAIL_SERVER_USER</li>
                      <li>EMAIL_SERVER_PASSWORD</li>
                      <li>EMAIL_FROM</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Test Email Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Verify Email Service</h3>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Patient Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="Enter patient's real email address"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    disabled={testLoading}
                  />
                  <Button 
                    onClick={sendTestEmail} 
                    disabled={testLoading || !recipientEmail}
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying
                      </>
                    ) : (
                      <>
                        <MailIcon className="mr-2 h-4 w-4" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <XIcon className="h-4 w-4" />
                  )}
                  <AlertTitle>{testResult.success ? "Success" : "Failed"}</AlertTitle>
                  <AlertDescription>
                    {testResult.message}
                    {testResult.error && (
                      <div className="mt-2 p-2 bg-red-50 text-red-800 rounded text-xs overflow-auto">
                        <code>{testResult.error}</code>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Instructions */}
            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-medium mb-2">Email Service Configuration</p>
              <p>
                The forgot password functionality requires proper email service configuration to send password reset links.
              </p>
              <p className="mt-2">
                If the email configuration is incomplete, patients will not receive the necessary password reset instructions.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-5 flex justify-between">
            <Link 
              href="/auth/forgot-password" 
              className="flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Forgot Password
            </Link>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
