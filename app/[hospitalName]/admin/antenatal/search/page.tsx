"use client"

import React from "react"
import { useRouter, useParams } from "next/navigation"
import { PatientSearchWidget } from "@/components/patient-search-widget"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface ProcessedPatient {
  id: string
  medicalNumber?: string
  name: string
  email?: string
  photo?: string
  phone?: string
}

export default function AntenatalPatientSearch() {
  const router = useRouter()
  const params = useParams()
  const hospitalName = params.hospitalName as string
  
  // Handle patient selection
  const handlePatientSelect = (patient: ProcessedPatient) => {
    console.log("Selected patient for antenatal registration:", patient)
    
    // Store selected patient info in localStorage for the registration flow
    localStorage.setItem("antenatalSelectedPatient", JSON.stringify(patient))
    
    // Navigate to the registration flow with the patient ID
    router.push(`/${hospitalName}/admin/antenatal/register/${patient.id}`)
  }
  
  // Handle back button
  const handleBack = () => {
    router.push(`/${hospitalName}/admin/antenatal`)
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" onClick={handleBack} className="mr-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Antenatal
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">Find Patient for Antenatal Registration</h1>
        <p className="text-gray-600 mb-8">
          Search for an existing patient by name, phone number, or medical ID to begin the antenatal registration process.
          Once you select a patient, you'll proceed to the antenatal booking visit form.
        </p>
        
        <div className="max-w-3xl mx-auto">
          {/* Full width patient search widget */}
          <PatientSearchWidget 
            onSelect={handlePatientSelect}
            placeholder="Search for a patient by name, phone number or medical ID" 
            className="w-full"
            hospitalId={hospitalName}
            showCameraButton={true}
          />
          
          <div className="mt-16 text-center text-gray-500">
            <p>Select a patient from the search results to continue to antenatal registration</p>
          </div>
        </div>
      </div>
    </div>
  )
}
