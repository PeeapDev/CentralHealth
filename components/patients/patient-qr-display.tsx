'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import QRCode from 'react-qr-code'
import { Card } from '@/components/ui/card'

/**
 * PatientQRDisplay component
 * 
 * Displays a QR code containing the patient's permanent medical ID and basic information
 * Follows CentralHealth policy:
 * - Medical IDs are permanent and immutable
 * - Medical IDs follow NHS-style 5-character alphanumeric format
 * - Each patient receives ONE medical ID for their lifetime
 */
interface PatientQRDisplayProps {
  medicalNumber: string
  firstName?: string
  lastName?: string
  size?: number
  className?: string
}

export function PatientQRDisplay({
  medicalNumber,
  firstName = '',
  lastName = '',
  size = 128,
  className = '',
}: PatientQRDisplayProps) {
  const [qrValue, setQrValue] = useState<string>('')

  useEffect(() => {
    // SECURITY: Verify medical ID format - should be 5 characters per CentralHealth policy
    const isValidMedicalID = medicalNumber && /^[A-Z0-9]{5}$/i.test(medicalNumber)
    
    // Generate QR code value with permanent medical ID and minimal patient info
    // Format: CentralHealth|MRN:XXXXX|FirstName|LastName
    if (isValidMedicalID) {
      const qrData = `CentralHealth|MRN:${medicalNumber}|${firstName}|${lastName}`
      setQrValue(qrData)
    } else {
      // Use a loading placeholder rather than invalid data
      setQrValue(`CentralHealth|MRN:LOADING|${firstName}|${lastName}`)
    }
  }, [medicalNumber, firstName, lastName])

  return (
    <Card className={cn('p-2 bg-white flex items-center justify-center', className)}>
      {qrValue ? (
        <div className="flex flex-col items-center">
          <QRCode
            value={qrValue}
            size={size}
            level="H" // High error correction for medical data
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
          <div className="text-xs font-semibold mt-2">{medicalNumber}</div>
        </div>
      ) : (
        <div 
          className="bg-muted animate-pulse" 
          style={{ width: size, height: size }}
        />
      )}
    </Card>
  )
}
