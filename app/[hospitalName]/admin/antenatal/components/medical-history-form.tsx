"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface MedicalHistoryData {
  previousPregnancies: string
  complications: string
  chronicConditions: string
  allergies: string
  medications: string
  surgicalHistory: string
  completed?: boolean
}

interface Patient {
  id: string
  name: string
  medicalNumber?: string
  age?: number
  gender?: string
}

interface MedicalHistoryFormProps {
  patientData: Patient
  initialData: MedicalHistoryData
  onSave: (data: MedicalHistoryData) => void
}

export default function MedicalHistoryForm({ patientData, initialData, onSave }: MedicalHistoryFormProps) {
  const [formData, setFormData] = useState<MedicalHistoryData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Common pregnancy complications for checkbox selection
  const commonPregnancyComplications = [
    { id: "gestationalDiabetes", label: "Gestational Diabetes" },
    { id: "preeclampsia", label: "Preeclampsia" },
    { id: "eclampsia", label: "Eclampsia" },
    { id: "placenta-previa", label: "Placenta Previa" },
    { id: "placental-abruption", label: "Placental Abruption" },
    { id: "prematureBirth", label: "Premature Birth" },
    { id: "lowBirthWeight", label: "Low Birth Weight" },
    { id: "miscarriage", label: "Miscarriage" },
    { id: "ectopic", label: "Ectopic Pregnancy" }
  ]

  // Common chronic conditions for checkbox selection
  const commonChronicConditions = [
    { id: "hypertension", label: "Hypertension" },
    { id: "diabetes", label: "Diabetes" },
    { id: "asthma", label: "Asthma" },
    { id: "thyroid", label: "Thyroid Disease" },
    { id: "cardiac", label: "Cardiac Disease" },
    { id: "renal", label: "Renal Disease" },
    { id: "epilepsy", label: "Epilepsy" },
    { id: "sickleCell", label: "Sickle Cell" },
    { id: "hiv", label: "HIV/AIDS" }
  ]
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear error for this field
    if (errors[name]) {
      const updatedErrors = { ...errors }
      delete updatedErrors[name]
      setErrors(updatedErrors)
    }
  }

  // Handle checkbox selection for complications
  const handleComplicationCheck = (complication: string) => {
    let currentComplications = formData.complications.split(',').map(c => c.trim()).filter(c => c !== "")
    
    if (currentComplications.includes(complication)) {
      // Remove the complication
      currentComplications = currentComplications.filter(c => c !== complication)
    } else {
      // Add the complication
      currentComplications.push(complication)
    }
    
    // Update the formData
    setFormData({
      ...formData,
      complications: currentComplications.join(', ')
    })
  }

  // Handle checkbox selection for chronic conditions
  const handleConditionCheck = (condition: string) => {
    let currentConditions = formData.chronicConditions.split(',').map(c => c.trim()).filter(c => c !== "")
    
    if (currentConditions.includes(condition)) {
      // Remove the condition
      currentConditions = currentConditions.filter(c => c !== condition)
    } else {
      // Add the condition
      currentConditions.push(condition)
    }
    
    // Update the formData
    setFormData({
      ...formData,
      chronicConditions: currentConditions.join(', ')
    })
  }
  
  // Check if a complication is selected
  const isComplicationSelected = (complication: string): boolean => {
    const currentComplications = formData.complications.split(',').map(c => c.trim())
    return currentComplications.includes(complication)
  }

  // Check if a condition is selected
  const isConditionSelected = (condition: string): boolean => {
    const currentConditions = formData.chronicConditions.split(',').map(c => c.trim())
    return currentConditions.includes(condition)
  }
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation - all fields should at least be initialized
    // In a real app, you might have more specific validation rules
    
    // Save data
    onSave(formData)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical History</CardTitle>
        <CardDescription>
          Record the patient's pregnancy and medical history
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Previous Pregnancies */}
          <div className="space-y-2">
            <Label htmlFor="previousPregnancies">Previous Pregnancies Details</Label>
            <Textarea
              id="previousPregnancies"
              name="previousPregnancies"
              value={formData.previousPregnancies}
              onChange={handleInputChange}
              placeholder="Details about previous pregnancies, outcomes, and any complications"
              rows={4}
            />
            {errors.previousPregnancies && (
              <p className="text-sm text-red-500">{errors.previousPregnancies}</p>
            )}
          </div>

          <Separator />
          
          {/* Previous Pregnancy Complications */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">Previous Pregnancy Complications</Label>
              <p className="text-sm text-gray-500 mb-3">
                Select any complications experienced in previous pregnancies
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {commonPregnancyComplications.map((complication) => (
                <div key={complication.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`complication-${complication.id}`}
                    checked={isComplicationSelected(complication.label)}
                    onCheckedChange={() => handleComplicationCheck(complication.label)}
                  />
                  <label
                    htmlFor={`complication-${complication.id}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {complication.label}
                  </label>
                </div>
              ))}
            </div>

            <Textarea
              name="complications"
              value={formData.complications}
              onChange={handleInputChange}
              placeholder="Additional details about complications"
              className="mt-2"
            />
          </div>

          <Separator />
          
          {/* Chronic Medical Conditions */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">Chronic Medical Conditions</Label>
              <p className="text-sm text-gray-500 mb-3">
                Select any pre-existing medical conditions
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {commonChronicConditions.map((condition) => (
                <div key={condition.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`condition-${condition.id}`}
                    checked={isConditionSelected(condition.label)}
                    onCheckedChange={() => handleConditionCheck(condition.label)}
                  />
                  <label
                    htmlFor={`condition-${condition.id}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {condition.label}
                  </label>
                </div>
              ))}
            </div>

            <Textarea
              name="chronicConditions"
              value={formData.chronicConditions}
              onChange={handleInputChange}
              placeholder="Additional details about chronic conditions"
              className="mt-2"
            />
          </div>
          
          <Separator />

          {/* Allergies */}
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleInputChange}
              placeholder="List any known allergies to medications, food, or other substances"
              rows={2}
            />
          </div>
          
          {/* Current Medications */}
          <div className="space-y-2">
            <Label htmlFor="medications">Current Medications</Label>
            <Textarea
              id="medications"
              name="medications"
              value={formData.medications}
              onChange={handleInputChange}
              placeholder="List any current medications, vitamins, or supplements"
              rows={2}
            />
          </div>
          
          {/* Surgical History */}
          <div className="space-y-2">
            <Label htmlFor="surgicalHistory">Surgical History</Label>
            <Textarea
              id="surgicalHistory"
              name="surgicalHistory"
              value={formData.surgicalHistory}
              onChange={handleInputChange}
              placeholder="Details of previous surgeries including C-sections"
              rows={2}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
