"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react"

interface ComplicationsData {
  riskFactors: string[]
  riskLevel: "low" | "medium" | "high"
  referToSpecialist?: boolean
  specialistDetails?: string
  managementPlan?: string
  emergencyContact?: string
  additionalNotes?: string
  completed?: boolean
}

interface Patient {
  id: string
  name: string
  medicalNumber?: string
  age?: number
  gender?: string
}

interface ComplicationsFormProps {
  patientData: Patient
  initialData: ComplicationsData
  onSave: (data: ComplicationsData) => void
}

export default function ComplicationsForm({ patientData, initialData, onSave }: ComplicationsFormProps) {
  const [formData, setFormData] = useState<ComplicationsData>(initialData || {
    riskFactors: [],
    riskLevel: "low",
    referToSpecialist: false,
    specialistDetails: "",
    managementPlan: "",
    emergencyContact: "",
    additionalNotes: ""
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Risk factor options
  const maternalRiskFactors = [
    { id: "age-under-18", label: "Maternal Age < 18" },
    { id: "age-over-35", label: "Maternal Age > 35" },
    { id: "bmi-under-18", label: "Low BMI < 18.5" },
    { id: "bmi-over-30", label: "Obesity (BMI > 30)" },
    { id: "hypertension", label: "Chronic Hypertension" },
    { id: "diabetes", label: "Pre-existing Diabetes" },
    { id: "cardiac", label: "Cardiac Disease" }
  ]
  
  const obstetricalRiskFactors = [
    { id: "multiple-pregnancy", label: "Multiple Pregnancy" },
    { id: "previous-cesarean", label: "Previous Cesarean Section" },
    { id: "preeclampsia", label: "History of Preeclampsia" },
    { id: "previous-preterm", label: "Previous Preterm Birth" },
    { id: "previous-stillbirth", label: "Previous Stillbirth" },
    { id: "placenta-previa", label: "Placenta Previa" },
    { id: "gestational-diabetes", label: "Gestational Diabetes" }
  ]
  
  const currentRiskFactors = [
    { id: "anemia", label: "Anemia (Hb < 10g/dl)" },
    { id: "bleeding", label: "Vaginal Bleeding" },
    { id: "abnormal-growth", label: "Abnormal Fetal Growth" },
    { id: "abnormal-presentation", label: "Abnormal Presentation" },
    { id: "decreased-movements", label: "Decreased Fetal Movements" },
    { id: "infection", label: "Infection" },
    { id: "hiv-positive", label: "HIV Positive" }
  ]
  
  // Auto-calculate risk level based on risk factors selected
  useEffect(() => {
    const highRiskFactors = [
      "multiple-pregnancy", "preeclampsia", "placenta-previa",
      "bleeding", "abnormal-growth", "abnormal-presentation",
      "previous-stillbirth", "hiv-positive", "cardiac"
    ]
    
    const mediumRiskFactors = [
      "age-over-35", "age-under-18", "bmi-over-30", "bmi-under-18",
      "hypertension", "diabetes", "previous-cesarean", "previous-preterm",
      "gestational-diabetes", "anemia", "decreased-movements", "infection"
    ]
    
    // Count how many high and medium risk factors
    let highCount = 0
    let mediumCount = 0
    
    formData.riskFactors.forEach(factor => {
      if (highRiskFactors.includes(factor)) highCount++
      else if (mediumRiskFactors.includes(factor)) mediumCount++
    })
    
    // Determine risk level
    let calculatedRiskLevel: "low" | "medium" | "high" = "low"
    
    if (highCount > 0) {
      calculatedRiskLevel = "high"
    } else if (mediumCount > 1) {
      calculatedRiskLevel = "medium"
    } else if (mediumCount === 1) {
      calculatedRiskLevel = "medium"
    }
    
    // Update risk level if it changed
    if (formData.riskLevel !== calculatedRiskLevel) {
      setFormData(prev => ({
        ...prev,
        riskLevel: calculatedRiskLevel,
        // For high risk, automatically suggest specialist referral
        referToSpecialist: calculatedRiskLevel === "high" ? true : prev.referToSpecialist
      }))
    }
  }, [formData.riskFactors])
  
  // Handle risk factor checkbox selection
  const handleRiskFactorChange = (factorId: string) => {
    const currentFactors = [...formData.riskFactors]
    
    if (currentFactors.includes(factorId)) {
      // Remove factor
      setFormData({
        ...formData,
        riskFactors: currentFactors.filter(id => id !== factorId)
      })
    } else {
      // Add factor
      setFormData({
        ...formData,
        riskFactors: [...currentFactors, factorId]
      })
    }
  }
  
  // Check if a risk factor is selected
  const isRiskFactorSelected = (factorId: string): boolean => {
    return formData.riskFactors.includes(factorId)
  }
  
  // Handle risk level change
  const handleRiskLevelChange = (level: "low" | "medium" | "high") => {
    setFormData({
      ...formData,
      riskLevel: level
    })
  }
  
  // Handle referral checkbox
  const handleReferralChange = (checked: boolean) => {
    setFormData({
      ...formData,
      referToSpecialist: checked
    })
  }
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // For validation
    const newErrors: Record<string, string> = {}
    
    // High risk needs management plan
    if (formData.riskLevel === "high" && !formData.managementPlan) {
      newErrors.managementPlan = "Management plan is required for high risk patients"
    }
    
    // If referring to specialist, need details
    if (formData.referToSpecialist && !formData.specialistDetails) {
      newErrors.specialistDetails = "Specialist details are required if referring"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Submit the form
    onSave(formData)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
        <CardDescription>
          Identify risk factors and determine appropriate level of care
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Current Risk Level */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Risk Level Assessment</h3>
            <Badge className={
              formData.riskLevel === "low" 
                ? "bg-green-100 text-green-800 border-green-200" 
                : formData.riskLevel === "medium"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-red-100 text-red-800 border-red-200"
            }>
              {formData.riskLevel === "low" && <CheckCircle className="h-3 w-3 mr-1" />}
              {formData.riskLevel === "medium" && <AlertTriangle className="h-3 w-3 mr-1" />}
              {formData.riskLevel === "high" && <AlertCircle className="h-3 w-3 mr-1" />}
              {formData.riskLevel.charAt(0).toUpperCase() + formData.riskLevel.slice(1)} Risk
            </Badge>
          </div>
          
          <RadioGroup 
            value={formData.riskLevel} 
            onValueChange={(value: "low" | "medium" | "high") => handleRiskLevelChange(value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="low" id="risk-low" />
              <Label htmlFor="risk-low">Low Risk</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="risk-medium" />
              <Label htmlFor="risk-medium">Medium Risk</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="risk-high" />
              <Label htmlFor="risk-high">High Risk</Label>
            </div>
          </RadioGroup>
          
          {formData.riskLevel === "high" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>High Risk Pregnancy</AlertTitle>
              <AlertDescription>
                This patient requires specialized care and closer monitoring. 
                Consider specialist referral and more frequent visits.
              </AlertDescription>
            </Alert>
          )}
          
          {formData.riskLevel === "medium" && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Medium Risk Factors Detected</AlertTitle>
              <AlertDescription>
                This patient has some risk factors that require additional monitoring.
                Consider more frequent visits than standard schedule.
              </AlertDescription>
            </Alert>
          )}
          
          <Separator />
          
          {/* Maternal Risk Factors */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Maternal Risk Factors</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select any pre-existing maternal conditions that may affect the pregnancy
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {maternalRiskFactors.map((factor) => (
                <div key={factor.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={factor.id}
                    checked={isRiskFactorSelected(factor.id)}
                    onCheckedChange={() => handleRiskFactorChange(factor.id)}
                  />
                  <label
                    htmlFor={factor.id}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {factor.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Obstetrical Risk Factors */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Obstetrical Risk Factors</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select any previous pregnancy complications or current obstetrical issues
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {obstetricalRiskFactors.map((factor) => (
                <div key={factor.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={factor.id}
                    checked={isRiskFactorSelected(factor.id)}
                    onCheckedChange={() => handleRiskFactorChange(factor.id)}
                  />
                  <label
                    htmlFor={factor.id}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {factor.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Current Pregnancy Risk Factors */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Current Pregnancy Findings</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select any current findings that may indicate risk
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentRiskFactors.map((factor) => (
                <div key={factor.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={factor.id}
                    checked={isRiskFactorSelected(factor.id)}
                    onCheckedChange={() => handleRiskFactorChange(factor.id)}
                  />
                  <label
                    htmlFor={factor.id}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {factor.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Specialist Referral */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="referToSpecialist"
                checked={formData.referToSpecialist}
                onCheckedChange={handleReferralChange}
              />
              <Label htmlFor="referToSpecialist" className="text-base font-medium">
                Refer to Specialist / Consultant
              </Label>
            </div>
            
            {formData.referToSpecialist && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="specialistDetails">Specialist Details</Label>
                <Textarea
                  id="specialistDetails"
                  name="specialistDetails"
                  value={formData.specialistDetails}
                  onChange={handleInputChange}
                  placeholder="Specialist name, department, reason for referral, and any specific instructions"
                  rows={2}
                />
                {errors.specialistDetails && (
                  <p className="text-sm text-red-500">{errors.specialistDetails}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Management Plan */}
          <div className="space-y-2">
            <Label htmlFor="managementPlan">Management Plan</Label>
            <Textarea
              id="managementPlan"
              name="managementPlan"
              value={formData.managementPlan}
              onChange={handleInputChange}
              placeholder="Describe the management plan for identified risks"
              rows={3}
            />
            {errors.managementPlan && (
              <p className="text-sm text-red-500">{errors.managementPlan}</p>
            )}
          </div>
          
          {/* Emergency Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact Information</Label>
            <Textarea
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              placeholder="Emergency contact details and instructions for the patient"
              rows={2}
            />
          </div>
          
          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              placeholder="Any additional information or observations"
              rows={2}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">Save & Complete</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
