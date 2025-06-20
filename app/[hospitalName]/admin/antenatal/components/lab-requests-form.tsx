"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"

interface LabRequestsData {
  bloodGroup: string
  hemoglobin: string
  hivStatus: string
  hepatitis: string
  urinalysis: string
  bloodSugar?: string
  ultrasound?: string
  ultrasoundDate?: string
  additionalTests?: string[]
  completed?: boolean
}

interface Patient {
  id: string
  name: string
  medicalNumber?: string
  age?: number
  gender?: string
}

interface LabRequestsFormProps {
  patientData: Patient
  initialData: LabRequestsData
  onSave: (data: LabRequestsData) => void
}

export default function LabRequestsForm({ patientData, initialData, onSave }: LabRequestsFormProps) {
  const [formData, setFormData] = useState<LabRequestsData>(initialData || {
    bloodGroup: "",
    hemoglobin: "",
    hivStatus: "",
    hepatitis: "",
    urinalysis: "",
    bloodSugar: "",
    ultrasound: "",
    additionalTests: []
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // List of additional tests that can be ordered
  const additionalTestOptions = [
    { id: "cbc", label: "Complete Blood Count (CBC)" },
    { id: "sicklecell", label: "Sickle Cell Screen" },
    { id: "thyroid", label: "Thyroid Function" },
    { id: "glucose", label: "Glucose Tolerance Test" },
    { id: "rubella", label: "Rubella Immunity" },
    { id: "vdrl", label: "VDRL (Syphilis)" },
    { id: "pap", label: "Pap Smear" }
  ]
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear error
    if (errors[name]) {
      const updatedErrors = { ...errors }
      delete updatedErrors[name]
      setErrors(updatedErrors)
    }
  }
  
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear error
    if (errors[name]) {
      const updatedErrors = { ...errors }
      delete updatedErrors[name]
      setErrors(updatedErrors)
    }
  }
  
  // Handle ultrasound date selection
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        ultrasoundDate: date.toISOString()
      })
    }
  }
  
  // Handle additional test checkbox selection
  const handleTestSelection = (testId: string) => {
    const currentTests = formData.additionalTests || []
    
    if (currentTests.includes(testId)) {
      // Remove test
      setFormData({
        ...formData,
        additionalTests: currentTests.filter(id => id !== testId)
      })
    } else {
      // Add test
      setFormData({
        ...formData,
        additionalTests: [...currentTests, testId]
      })
    }
  }
  
  // Check if a test is selected
  const isTestSelected = (testId: string): boolean => {
    return (formData.additionalTests || []).includes(testId)
  }
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required"
    if (!formData.hemoglobin) newErrors.hemoglobin = "Hemoglobin is required"
    if (!formData.hivStatus) newErrors.hivStatus = "HIV status is required"
    if (!formData.hepatitis) newErrors.hepatitis = "Hepatitis status is required"
    if (!formData.urinalysis) newErrors.urinalysis = "Urinalysis is required"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate requesting tests
    setTimeout(() => {
      onSave(formData)
      setIsSubmitting(false)
    }, 1000)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laboratory Tests & Imaging</CardTitle>
        <CardDescription>
          Request and record essential antenatal laboratory tests and ultrasound
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Group */}
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group & Rh Factor</Label>
              <Select
                onValueChange={(value) => handleSelectChange("bloodGroup", value)}
                value={formData.bloodGroup}
              >
                <SelectTrigger id="bloodGroup">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="unknown">Unknown (Request Test)</SelectItem>
                </SelectContent>
              </Select>
              {errors.bloodGroup && <p className="text-sm text-red-500">{errors.bloodGroup}</p>}
              {formData.bloodGroup === "O-" && (
                <p className="text-xs text-amber-600">
                  Note: O- patients can only receive O- blood donations
                </p>
              )}
              {formData.bloodGroup?.includes("-") && (
                <p className="text-xs text-amber-600">
                  Rh negative - may require Anti-D prophylaxis
                </p>
              )}
            </div>
            
            {/* Hemoglobin */}
            <div className="space-y-2">
              <Label htmlFor="hemoglobin">Hemoglobin (g/dL)</Label>
              <Select
                onValueChange={(value) => handleSelectChange("hemoglobin", value)}
                value={formData.hemoglobin}
              >
                <SelectTrigger id="hemoglobin">
                  <SelectValue placeholder="Hemoglobin result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal Range (&gt;11 g/dL)</SelectItem>
                  <SelectItem value="mild-anemia">Mild Anemia (9-11 g/dL)</SelectItem>
                  <SelectItem value="moderate-anemia">Moderate Anemia (7-9 g/dL)</SelectItem>
                  <SelectItem value="severe-anemia">Severe Anemia (&lt;7 g/dL)</SelectItem>
                  <SelectItem value="request">Request Test</SelectItem>
                </SelectContent>
              </Select>
              {errors.hemoglobin && <p className="text-sm text-red-500">{errors.hemoglobin}</p>}
              {(formData.hemoglobin === "moderate-anemia" || formData.hemoglobin === "severe-anemia") && (
                <p className="text-xs text-red-600">
                  Requires immediate attention - consider iron supplementation
                </p>
              )}
            </div>
            
            {/* Blood Sugar */}
            <div className="space-y-2">
              <Label htmlFor="bloodSugar">Blood Sugar</Label>
              <Select
                onValueChange={(value) => handleSelectChange("bloodSugar", value)}
                value={formData.bloodSugar}
              >
                <SelectTrigger id="bloodSugar">
                  <SelectValue placeholder="Blood sugar result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                  <SelectItem value="gdm">Gestational Diabetes (GDM)</SelectItem>
                  <SelectItem value="request">Request Test</SelectItem>
                  <SelectItem value="not-required">Not Required</SelectItem>
                </SelectContent>
              </Select>
              {formData.bloodSugar === "elevated" && (
                <p className="text-xs text-amber-600">
                  Schedule follow-up glucose tolerance test
                </p>
              )}
              {formData.bloodSugar === "gdm" && (
                <p className="text-xs text-red-600">
                  Requires diabetes management plan
                </p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* HIV Status */}
            <div className="space-y-2">
              <Label htmlFor="hivStatus">HIV Status</Label>
              <Select
                onValueChange={(value) => handleSelectChange("hivStatus", value)}
                value={formData.hivStatus}
              >
                <SelectTrigger id="hivStatus">
                  <SelectValue placeholder="HIV status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="request">Request Test</SelectItem>
                  <SelectItem value="declined">Declined Testing</SelectItem>
                </SelectContent>
              </Select>
              {errors.hivStatus && <p className="text-sm text-red-500">{errors.hivStatus}</p>}
              {formData.hivStatus === "positive" && (
                <p className="text-xs text-red-600">
                  Requires PMTCT program enrollment
                </p>
              )}
              {formData.hivStatus === "declined" && (
                <p className="text-xs text-amber-600">
                  Document counseling provided
                </p>
              )}
            </div>
            
            {/* Hepatitis */}
            <div className="space-y-2">
              <Label htmlFor="hepatitis">Hepatitis B Status</Label>
              <Select
                onValueChange={(value) => handleSelectChange("hepatitis", value)}
                value={formData.hepatitis}
              >
                <SelectTrigger id="hepatitis">
                  <SelectValue placeholder="Hepatitis B status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="request">Request Test</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              {errors.hepatitis && <p className="text-sm text-red-500">{errors.hepatitis}</p>}
              {formData.hepatitis === "positive" && (
                <p className="text-xs text-red-600">
                  Requires specialist consultation
                </p>
              )}
            </div>
            
            {/* Urinalysis */}
            <div className="space-y-2">
              <Label htmlFor="urinalysis">Urinalysis</Label>
              <Select
                onValueChange={(value) => handleSelectChange("urinalysis", value)}
                value={formData.urinalysis}
              >
                <SelectTrigger id="urinalysis">
                  <SelectValue placeholder="Urinalysis result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="protein">Proteinuria</SelectItem>
                  <SelectItem value="glucose">Glucosuria</SelectItem>
                  <SelectItem value="infection">Signs of Infection</SelectItem>
                  <SelectItem value="request">Request Test</SelectItem>
                </SelectContent>
              </Select>
              {errors.urinalysis && <p className="text-sm text-red-500">{errors.urinalysis}</p>}
              {formData.urinalysis === "protein" && (
                <p className="text-xs text-amber-600">
                  Monitor for pre-eclampsia
                </p>
              )}
              {formData.urinalysis === "infection" && (
                <p className="text-xs text-red-600">
                  Request urine culture and sensitivity
                </p>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Ultrasound Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Ultrasound Scan</Label>
              {formData.ultrasound && (
                <Badge variant="outline" className={
                  formData.ultrasound === "completed" 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }>
                  {formData.ultrasound === "completed" ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  {formData.ultrasound === "completed" ? "Completed" : "Scheduled"}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ultrasound">Ultrasound Status</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("ultrasound", value)}
                  value={formData.ultrasound}
                >
                  <SelectTrigger id="ultrasound">
                    <SelectValue placeholder="Select ultrasound status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-required">Not Required Yet</SelectItem>
                    <SelectItem value="scheduled">Schedule for First Trimester</SelectItem>
                    <SelectItem value="scheduled-anomaly">Schedule for Anomaly Scan (18-22 weeks)</SelectItem>
                    <SelectItem value="scheduled-growth">Schedule for Growth Scan (Third Trimester)</SelectItem>
                    <SelectItem value="completed">Already Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(formData.ultrasound === "scheduled" || 
                formData.ultrasound === "scheduled-anomaly" || 
                formData.ultrasound === "scheduled-growth") && (
                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <DatePicker 
                    date={formData.ultrasoundDate ? new Date(formData.ultrasoundDate) : undefined}
                    setDate={handleDateChange}
                    className="w-full"
                  />
                </div>
              )}
              
              {formData.ultrasound === "completed" && (
                <div className="space-y-2">
                  <Label>Date Performed</Label>
                  <DatePicker 
                    date={formData.ultrasoundDate ? new Date(formData.ultrasoundDate) : undefined}
                    setDate={handleDateChange}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Additional Tests */}
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium">Additional Tests</Label>
              <p className="text-sm text-gray-500 mt-1">
                Select additional tests to request based on patient history and risk factors
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionalTestOptions.map((test) => (
                <div key={test.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={test.id}
                    checked={isTestSelected(test.id)}
                    onCheckedChange={() => handleTestSelection(test.id)}
                  />
                  <label
                    htmlFor={test.id}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {test.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Requesting Tests..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
