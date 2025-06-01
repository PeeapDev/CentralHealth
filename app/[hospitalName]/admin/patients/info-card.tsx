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

// Import FHIRPatient interface from the types folder
import { FHIRPatient } from "../../types/patient";

interface PatientInfoCardProps {
  patient: FHIRPatient;
  onClose: () => void;
}

function PatientInfoCard({ patient, onClose }: PatientInfoCardProps) {
  // Helper function to extract name
  const getPatientName = (): string => {
    if (!patient.name) return "Unknown";
    
    try {
      // Parse JSON if it's a string
      const nameData = typeof patient.name === 'string' 
        ? JSON.parse(patient.name) 
        : patient.name;
      
      // Handle array of names or single name object
      const nameObj = Array.isArray(nameData) ? nameData[0] : nameData;
      
      // Use text if available
      if (nameObj.text) return nameObj.text;
      
      // Otherwise construct from parts
      const given = nameObj.given ? nameObj.given.join(' ') : '';
      const family = nameObj.family || '';
      
      return `${given} ${family}`.trim() || "Unknown";
    } catch (e) {
      return typeof patient.name === 'string' ? patient.name : "Unknown";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{getPatientName()}</CardTitle>
          <CardDescription>
            Patient Information and Medical Records
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Patient ID</h3>
            <p className="text-sm">{patient.id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Medical Number</h3>
            <p className="text-sm">{patient.medicalNumber || "Not assigned"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Gender</h3>
            <p className="text-sm">{patient.gender || "Not specified"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Date of Birth</h3>
            <p className="text-sm">{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : "Not specified"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Email</h3>
            <p className="text-sm">{patient.email || "Not specified"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Phone</h3>
            <p className="text-sm">{patient.phoneNumber || "Not specified"}</p>
          </div>
        </div>
        
        {!patient.medicalNumber && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Medical ID Required</AlertTitle>
            <AlertDescription>
              This patient doesn't have a Medical ID assigned yet. Visit the patient details page to assign a new Medical ID.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href={`/register?id=${patient.id}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Record
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
