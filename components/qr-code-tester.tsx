'use client'

import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MedicalIDFormatter } from '@/utils/medical-id'

// This component is used for testing QR code generation following CentralHealth policy
export function QRCodeTester() {
  const [qrValue, setQrValue] = useState<string>('CentralHealth|MRN:')
  const [medicalID, setMedicalID] = useState<string>('')
  const [patientName, setPatientName] = useState<string>('')
  
  // Handle generating a compliant QR code
  const handleGenerateQR = () => {
    // Medical IDs must follow NHS-style 5-character alphanumeric format per CentralHealth policy
    const formattedMedicalID = MedicalIDFormatter.formatMedicalID(medicalID) || ''
    const formattedQR = `CentralHealth|MRN:${formattedMedicalID}|${patientName}`
    setQrValue(formattedQR)
  }

  // Reset the form
  const handleReset = () => {
    setMedicalID('')
    setPatientName('')
    setQrValue('CentralHealth|MRN:')
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
          <CardDescription>
            Generate QR codes for testing purposes. Follows CentralHealth policy for medical ID format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="medicalID" className="text-sm font-medium">
              Medical ID (5 characters)
            </label>
            <Input
              id="medicalID"
              value={medicalID}
              onChange={(e) => setMedicalID(e.target.value)}
              placeholder="Enter a 5-character medical ID"
              maxLength={5}
            />
            <p className="text-xs text-muted-foreground">
              Medical IDs must follow NHS-style 5-character alphanumeric format
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="patientName" className="text-sm font-medium">
              Patient Name
            </label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleGenerateQR} className="flex-1">
              Generate QR
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Generated QR Code</CardTitle>
          <CardDescription>
            This QR code contains the medical ID and patient information.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCode value={qrValue} size={200} />
          </div>
          <div className="text-sm text-center">
            <p className="font-mono break-all">
              {qrValue}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QRCodeTester
