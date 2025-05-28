"use client"

import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

function PatientInfoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>National Patient Registry</CardTitle>
        <CardDescription>
          Important information about the centralized patient system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Patient Registration Notice</AlertTitle>
          <AlertDescription>
            Hospitals cannot create new patient records directly. All patients must register through 
            the National Health Service central portal to receive their unique medical number.
          </AlertDescription>
        </Alert>
        
        <div className="text-sm">
          <p className="mb-2">The centralized patient system ensures:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Each patient has a single nationwide medical record</li>
            <li>Patient data is accessible across all healthcare facilities</li>
            <li>Consistent patient identification throughout the healthcare system</li>
            <li>Complete medical history available to authorized providers</li>
          </ul>
        </div>
        
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href="/register" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Patient Registration Portal
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Export both as named and default export for compatibility
export { PatientInfoCard }
export default PatientInfoCard
