"use client"

import { formatDate } from "@/lib/utils"
import Image from "next/image"
import { PatientFormData } from "./multi-step-form"
import { QRCodeSVG } from "qrcode.react"

interface HealthCardProps {
  formData: PatientFormData
}

export function HealthCard({
  formData
}: HealthCardProps) {
  const { firstName, lastName, dateOfBirth, gender, medicalNumber, patientImage } = formData;
  const fullName = `${firstName} ${lastName}`;
  const age = calculateAge(dateOfBirth);
  
  function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
  
  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-lg shadow-lg">
      {/* Card with white background and colored accents */}
      <div className="relative bg-white rounded-lg overflow-hidden" style={{ height: "240px" }}>
        {/* Blue header bar */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-blue-600 rounded-t-lg"></div>
        
        {/* Green corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-bl-full z-0"></div>
        
        {/* Blue accent bottom */}
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-600 rounded-tr-full z-0"></div>
        
        {/* Ministry logo and name */}
        <div className="absolute top-4 left-4 flex items-center z-10">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-blue-700 mr-3">
            <span className="text-xs text-blue-800 font-bold">SL</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Ministry of Health</h2>
            <h2 className="text-white font-bold text-lg leading-tight">and Sanitation</h2>
          </div>
        </div>
        
        {/* Patient photo */}
        <div className="absolute left-6 top-20 z-10">
          <div className="w-20 h-20 bg-gray-200 rounded-full border-4 border-blue-600 overflow-hidden">
            {patientImage ? (
              <img src={patientImage} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-500 text-xl font-bold">{firstName[0]}{lastName[0]}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Patient name */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-28 text-center z-10">
          <h1 className="text-2xl font-bold text-gray-800">{fullName}</h1>
        </div>
        
        {/* QR code */}
        <div className="absolute right-8 top-32 z-10">
          <div className="w-24 h-24">
            {medicalNumber ? (
              <QRCodeSVG 
                value={`https://health.gov.sl/patient/${medicalNumber}`} 
                size={96} 
                includeMargin={false} 
                level="M"
              />
            ) : (
              <div className="w-full h-full border border-gray-300 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">Pending</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Patient details */}
        <div className="absolute left-8 top-44 z-10">
          <div className="space-y-1">
            <p className="text-sm"><span className="font-bold">Age:</span> {age}</p>
            <p className="text-sm"><span className="font-bold">exp:</span> {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'})}</p>
            <p className="text-sm"><span className="font-bold">Insurance:</span> {formData.insuranceNumber || '20783'}</p>
          </div>
        </div>
        
        {/* ID Number */}
        <div className="absolute bottom-4 left-8 z-10">
          <p className="font-bold">ID: {medicalNumber || '123-456-7890'}</p>
        </div>
        
        {/* Website */}
        <div className="absolute bottom-4 right-8 text-blue-700 z-10">
          <p className="text-sm">www.mohs.gov.sl</p>
        </div>
      </div>
    </div>
  )
}
