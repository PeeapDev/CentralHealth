"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ClipboardCopy, Info } from "lucide-react"
import { toast } from "sonner"

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams()
  const medicalNumber = searchParams?.get("medicalNumber") || "Not Available"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(medicalNumber)
    toast.success("Medical number copied to clipboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              National Health Service
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm hover:underline">
                Home
              </Link>
              <Link href="/login" className="text-sm hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex-1 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex rounded-full bg-green-100 p-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Registration Successful!</h1>
            <p className="mt-2 text-muted-foreground">
              Your National Health Service account has been created
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Medical Number</CardTitle>
              <CardDescription>
                Keep this number safe - you'll need it when visiting healthcare facilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="font-mono text-xl">{medicalNumber}</div>
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-4 text-sm">
                <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <strong>Important:</strong> Your medical number is your identifier across all
                  National Health Service facilities. Present this number when visiting any hospital
                  to access your centralized medical records.
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 sm:flex-row">
              <Button asChild className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Login to Your Account</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-8 bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="mr-2 font-bold">1.</span>
                <span>Visit any participating hospital and provide your medical number</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">2.</span>
                <span>Healthcare providers will access your centralized medical records</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">3.</span>
                <span>All your medical history will be saved in one secure location</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">4.</span>
                <span>You can request updates to your personal information anytime</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="border-t py-6">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} National Health Service. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
