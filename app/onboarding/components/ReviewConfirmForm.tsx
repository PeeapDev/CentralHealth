"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QRCodeSVG } from 'qrcode.react'
import { BadgeCheck, ClipboardCopy } from 'lucide-react'

interface ReviewConfirmFormProps {
  formData: any
  onSubmit: () => void
  onPrevious: () => void
}

export default function ReviewConfirmForm({ formData, onSubmit, onPrevious }: ReviewConfirmFormProps) {
  const [medicalId, setMedicalId] = useState(formData.medicalId || '')
  const [generatingIds, setGeneratingIds] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate medical ID and QR code when component mounts
  useEffect(() => {
    if (!medicalId) {
      generateIdentifiers()
    }
  }, [])

  const generateIdentifiers = () => {
    setGeneratingIds(true)
    
    // Generate a 5-character alphanumeric medical ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    
    setMedicalId(result)
    setTimeout(() => setGeneratingIds(false), 1000)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(medicalId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // QR code content
  const qrCodeValue = `https://platform.com/patient/${medicalId}`

  // Function to format date (YYYY-MM-DD to readable format)
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Review & Confirm</h2>
        <p className="text-muted-foreground">
          Review your information and confirm to complete registration
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Patient details column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium">{formData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-medium">{formData.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-medium">{formData.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-medium">{formatDate(formData.dateOfBirth)}</span>
              </div>
              {formData.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Health Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blood Group:</span>
                <span className="font-medium">{formData.bloodGroup}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Allergies:</span>
                <div className="mt-1">
                  {formData.allergies && formData.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.allergies.map((allergy: string, index: number) => (
                        <span key={index} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">None reported</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Chronic Conditions:</span>
                <div className="mt-1">
                  {formData.chronicConditions && formData.chronicConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.chronicConditions.map((condition: string, index: number) => (
                        <span key={index} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">None reported</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organ Donor:</span>
                <span className="font-medium">{formData.organDonor ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{formData.emergencyContactName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relationship:</span>
                <span className="font-medium">{formData.emergencyContactRelationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-medium">{formData.emergencyContactPhone}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ID card and QR code column */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-primary text-primary-foreground p-4">
              <h3 className="text-lg font-bold">Patient Medical ID Card</h3>
            </div>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center space-y-4 p-2">
                {formData.photo ? (
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={formData.photo} alt="Patient" />
                    <AvatarFallback>
                      {formData.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {formData.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="text-center">
                  <h4 className="font-bold text-lg">{formData.fullName}</h4>
                  <p className="text-sm text-muted-foreground">Blood Group: {formData.bloodGroup}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Medical ID</p>
                    <div className="flex items-center space-x-1">
                      {generatingIds ? (
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <>
                          <p className="font-mono font-bold text-lg">{medicalId}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={copyToClipboard}
                          >
                            {copied ? (
                              <BadgeCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <ClipboardCopy className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  {generatingIds ? (
                    <div className="h-32 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <QRCodeSVG 
                      value={qrCodeValue} 
                      size={128}
                      level="H"
                      includeMargin
                    />
                  )}
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Scan for patient information
                  </p>
                </div>
                
                <div className="border-t border-gray-200 w-full pt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    This card is the property of Central Health System
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex space-x-2">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-yellow-800">Important Information</p>
                <p className="text-xs text-yellow-700">
                  By completing this onboarding process, you'll be issued your unique Medical ID and 
                  QR code that can be used by healthcare providers to access your information in emergencies.
                </p>
                <p className="text-xs text-yellow-700 font-medium mt-2">
                  This profile will be linked to your hospital account and used for all medical services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Back
        </Button>
        <Button onClick={onSubmit}>
          Complete Registration
        </Button>
      </div>
    </div>
  )
}
