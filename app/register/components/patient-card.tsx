"use client"

import { PatientFormData } from "./multi-step-form"
import { Button } from "@/components/ui/button"
import { Download, Printer, QrCode, Mail, Check, Loader2, User, Calendar, MapPin, Activity } from "lucide-react"
import { useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useReactToPrint } from "react-to-print"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { toast } from "sonner"
import Image from "next/image"
import QRCode from "react-qr-code"

interface PatientCardProps {
  formData: PatientFormData
  medicalNumber: string
}

export function PatientCard({ formData, medicalNumber }: PatientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Handle printing the card
  const handlePrint = useReactToPrint({
    documentTitle: `Medical Card - ${formData.firstName} ${formData.lastName}`,
    contentRef: cardRef,
  })

  // Handle downloading the card as PDF
  const handleDownload = async () => {
    if (!cardRef.current) return

    setIsGeneratingPDF(true)

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85, 55] // Credit card size
      })

      // Add the image to the PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, 85, 55)

      // Save the PDF
      pdf.save(`${formData.firstName}_${formData.lastName}_MedicalCard.pdf`)
      toast.success("Medical card downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Send medical card to patient's email
  const handleSendEmail = async () => {
    if (!formData.email) {
      toast.error("No email address provided")
      return
    }

    setIsEmailSending(true)

    try {
      // First generate the PDF
      if (!cardRef.current) throw new Error("Card reference not found")

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)

      // Send the card data to the backend
      const response = await fetch('/api/patients/send-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          medicalNumber,
          cardImage: imgData
        })
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSent(true)
        toast.success("Medical card sent to your email")
      } else {
        toast.error(data.error || "Failed to send medical card")
      }
    } catch (error: any) {
      console.error("Error sending card by email:", error)
      toast.error("Failed to send medical card")
    } finally {
      setIsEmailSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Registration Complete!</h2>
        <p className="text-muted-foreground">
          Your medical card has been generated. You can print it, download it as a PDF, or have it sent to your email.
        </p>
      </div>

      {/* Medical Card */}
      <div ref={cardRef} className="bg-white border-2 border-blue-600 rounded-lg shadow-lg relative" style={{width: '340px', height: '210px', overflow: 'hidden'}}>
        {/* Credit card style header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-2 rounded-t-lg flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg">MEDICAL ID CARD</div>
            <div className="text-xs text-blue-100">Access My Health Record</div>
          </div>
          <div className="text-white font-bold text-xl mr-2">MyIHR</div>
        </div>

        {/* Blue sidebar */}
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-blue-600 flex flex-col items-center justify-between py-4">
          <div className="text-white font-bold whitespace-nowrap" style={{transform: 'rotate(90deg) translateY(10px)'}}>
            SIERRA LEONE
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-white rounded-full p-1">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="bg-white rounded-full p-1">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Main card content */}
        <div className="mt-2 p-3 pr-10">
          <div className="text-xs mb-1 text-gray-500">View User Profile:</div>
          <div className="text-xs font-medium mb-2 text-blue-600">www.myihr.com/{medicalNumber.substring(0, 4)}</div>
          
          <div className="flex space-x-3">
            {/* QR Code */}
            <div className="bg-white p-1 border border-gray-200 rounded">
              <div className="w-16 h-16 bg-white flex items-center justify-center">
                <QRCode
                  size={64}
                  value={JSON.stringify({
                    id: medicalNumber,
                    name: `${formData.firstName} ${formData.lastName}`,
                    dob: formData.dateOfBirth
                  })}
                  viewBox="0 0 64 64"
                />
              </div>
            </div>
            
            {/* Patient Details */}
            <div className="flex-1 space-y-1">
              <div className="text-sm font-bold">{formData.firstName} {formData.lastName}</div>
              <div className="text-xs">DOB: {formData.dateOfBirth}</div>
              <div className="text-xs">ID: {medicalNumber}</div>
              <div className="text-xs">{formData.addressLine}, {formData.city}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          onClick={handlePrint}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Card
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          onClick={handleDownload}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          onClick={handleSendEmail}
          disabled={isEmailSending || emailSent}
        >
          {isEmailSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : emailSent ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              Email Sent
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send to Email
            </>
          )}
        </Button>
        
        <Button
          variant="default"
          size="sm"
          className="flex items-center mt-4 w-full max-w-xs"
          onClick={() => window.location.href = '/patient/dashboard'}
        >
          <QrCode className="mr-2 h-4 w-4" />
          Go to My Dashboard
        </Button>
      </div>
    </div>
  )
}
