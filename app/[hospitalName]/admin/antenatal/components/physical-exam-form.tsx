"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PhysicalExamData {
  height: string // in cm
  weight: string // in kg
  bmi: string
  bloodPressure: string // systolic/diastolic
  pulse: string // beats per minute
  temperature: string // celsius
  respiratoryRate?: string
  fetalHeartRate?: string
  fundalHeight?: string
  presentation?: string // cephalic, breech, transverse
  edema?: string // none, mild, moderate, severe
  generalAppearance?: string
  notes?: string
  completed?: boolean
}

interface Patient {
  id: string
  name: string
  medicalNumber?: string
  age?: number
  gender?: string
}

interface PhysicalExamFormProps {
  patientData: Patient
  initialData: PhysicalExamData
  onSave: (data: PhysicalExamData) => void
}

export default function PhysicalExamForm({ patientData, initialData, onSave }: PhysicalExamFormProps) {
  const [formData, setFormData] = useState<PhysicalExamData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Record<string, string>>({})
  
  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (formData.height && formData.weight) {
      const heightInMeters = parseFloat(formData.height) / 100
      const weightInKg = parseFloat(formData.weight)
      
      if (heightInMeters > 0 && weightInKg > 0) {
        const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
        setFormData(prev => ({ ...prev, bmi }))
        
        // Set BMI warning if needed
        if (parseFloat(bmi) < 18.5) {
          setWarnings(prev => ({ ...prev, bmi: "Underweight - Increased risk for complications" }))
        } else if (parseFloat(bmi) >= 30) {
          setWarnings(prev => ({ ...prev, bmi: "Obese - Higher risk for gestational diabetes and hypertension" }))
        } else {
          setWarnings(prev => {
            const newWarnings = { ...prev }
            delete newWarnings.bmi
            return newWarnings
          })
        }
      }
    }
  }, [formData.height, formData.weight])
  
  // Check blood pressure and set warning
  useEffect(() => {
    if (formData.bloodPressure) {
      const [systolic, diastolic] = formData.bloodPressure.split('/').map(Number)
      
      if (systolic >= 140 || diastolic >= 90) {
        setWarnings(prev => ({ 
          ...prev, 
          bloodPressure: "Elevated blood pressure - Potential sign of hypertension or pre-eclampsia" 
        }))
      } else {
        setWarnings(prev => {
          const newWarnings = { ...prev }
          delete newWarnings.bloodPressure
          return newWarnings
        })
      }
    }
  }, [formData.bloodPressure])
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  // Handle select field changes
  const handleSelectChange = (name: string, value: string) => {
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
  
  // Format and validate blood pressure
  const formatBloodPressure = (value: string) => {
    // Ensure blood pressure is in format systolic/diastolic
    const bpParts = value.split('/')
    if (bpParts.length !== 2) {
      return value // Return as-is for now, we'll validate on submit
    }
    
    const [systolic, diastolic] = bpParts.map(Number)
    if (!isNaN(systolic) && !isNaN(diastolic)) {
      return `${systolic}/${diastolic}`
    }
    
    return value
  }
  
  // Handle blood pressure input
  const handleBPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData({
      ...formData,
      bloodPressure: value
    })
    
    // Clear error
    if (errors.bloodPressure) {
      const updatedErrors = { ...errors }
      delete updatedErrors.bloodPressure
      setErrors(updatedErrors)
    }
  }
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!formData.height) newErrors.height = "Height is required"
    if (!formData.weight) newErrors.weight = "Weight is required"
    if (!formData.bloodPressure) {
      newErrors.bloodPressure = "Blood pressure is required"
    } else {
      // Validate blood pressure format
      const bpParts = formData.bloodPressure.split('/')
      if (bpParts.length !== 2) {
        newErrors.bloodPressure = "Blood pressure must be in systolic/diastolic format"
      } else {
        const [systolic, diastolic] = bpParts.map(Number)
        if (isNaN(systolic) || isNaN(diastolic)) {
          newErrors.bloodPressure = "Blood pressure must contain valid numbers"
        }
      }
    }
    if (!formData.pulse) newErrors.pulse = "Pulse is required"
    if (!formData.temperature) newErrors.temperature = "Temperature is required"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Format blood pressure before saving
    const formattedData = {
      ...formData,
      bloodPressure: formatBloodPressure(formData.bloodPressure)
    }
    
    // Form is valid, save data
    onSave(formattedData)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Physical Examination</CardTitle>
        <CardDescription>
          Record physical examination findings and vital signs
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                min="100"
                max="250"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="Height in centimeters"
              />
              {errors.height && <p className="text-sm text-red-500">{errors.height}</p>}
            </div>
            
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                min="30"
                max="200"
                step="0.1"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="Weight in kilograms"
              />
              {errors.weight && <p className="text-sm text-red-500">{errors.weight}</p>}
            </div>
            
            {/* BMI (calculated) */}
            <div className="space-y-2">
              <Label htmlFor="bmi">BMI (calculated)</Label>
              <Input
                id="bmi"
                name="bmi"
                type="text"
                value={formData.bmi}
                disabled
                className="bg-gray-100"
              />
              {warnings.bmi && (
                <p className="text-sm text-amber-600">{warnings.bmi}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Pressure */}
            <div className="space-y-2">
              <Label htmlFor="bloodPressure">Blood Pressure (mmHg)</Label>
              <Input
                id="bloodPressure"
                name="bloodPressure"
                type="text"
                value={formData.bloodPressure}
                onChange={handleBPChange}
                placeholder="120/80"
              />
              {errors.bloodPressure && <p className="text-sm text-red-500">{errors.bloodPressure}</p>}
              {warnings.bloodPressure && (
                <p className="text-sm text-amber-600">{warnings.bloodPressure}</p>
              )}
            </div>
            
            {/* Pulse */}
            <div className="space-y-2">
              <Label htmlFor="pulse">Pulse (bpm)</Label>
              <Input
                id="pulse"
                name="pulse"
                type="number"
                min="40"
                max="200"
                value={formData.pulse}
                onChange={handleInputChange}
                placeholder="Heart rate in beats per minute"
              />
              {errors.pulse && <p className="text-sm text-red-500">{errors.pulse}</p>}
            </div>
            
            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                min="35"
                max="42"
                step="0.1"
                value={formData.temperature}
                onChange={handleInputChange}
                placeholder="Temperature in Celsius"
              />
              {errors.temperature && <p className="text-sm text-red-500">{errors.temperature}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Respiratory Rate */}
            <div className="space-y-2">
              <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
              <Input
                id="respiratoryRate"
                name="respiratoryRate"
                type="number"
                min="8"
                max="40"
                value={formData.respiratoryRate}
                onChange={handleInputChange}
                placeholder="Breaths per minute"
              />
            </div>
            
            {/* Fetal Heart Rate */}
            <div className="space-y-2">
              <Label htmlFor="fetalHeartRate">Fetal Heart Rate (bpm)</Label>
              <Input
                id="fetalHeartRate"
                name="fetalHeartRate"
                type="number"
                min="100"
                max="180"
                value={formData.fetalHeartRate}
                onChange={handleInputChange}
                placeholder="Fetal heart rate if detectable"
              />
              <p className="text-xs text-gray-500">Normal range: 110-160 bpm</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fundal Height */}
            <div className="space-y-2">
              <Label htmlFor="fundalHeight">Fundal Height (cm)</Label>
              <Input
                id="fundalHeight"
                name="fundalHeight"
                type="number"
                min="1" 
                max="50"
                value={formData.fundalHeight}
                onChange={handleInputChange}
                placeholder="Fundal height if measurable"
              />
              <p className="text-xs text-gray-500">Usually corresponds with weeks of gestation</p>
            </div>
            
            {/* Fetal Presentation */}
            <div className="space-y-2">
              <Label htmlFor="presentation">Fetal Presentation</Label>
              <Select 
                onValueChange={(value) => handleSelectChange("presentation", value)} 
                value={formData.presentation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select presentation if determinable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cephalic">Cephalic (Head First)</SelectItem>
                  <SelectItem value="breech">Breech</SelectItem>
                  <SelectItem value="transverse">Transverse</SelectItem>
                  <SelectItem value="unknown">Unknown/Not Determined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Edema Assessment */}
          <div className="space-y-2">
            <Label>Edema Assessment</Label>
            <RadioGroup 
              value={formData.edema} 
              onValueChange={(value) => handleSelectChange("edema", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="edema-none" />
                <Label htmlFor="edema-none">None</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mild" id="edema-mild" />
                <Label htmlFor="edema-mild">Mild</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id="edema-moderate" />
                <Label htmlFor="edema-moderate">Moderate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="severe" id="edema-severe" />
                <Label htmlFor="edema-severe">Severe</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* General Appearance and Notes */}
          <div className="space-y-2">
            <Label htmlFor="generalAppearance">General Appearance & Notes</Label>
            <Textarea
              id="generalAppearance"
              name="generalAppearance"
              value={formData.generalAppearance}
              onChange={handleInputChange}
              placeholder="Document general observations, additional findings or concerns"
              rows={3}
            />
          </div>
          
          {/* Display combined warnings if any */}
          {Object.keys(warnings).length > 0 && (
            <Alert variant="default" className="border-orange-200 bg-orange-50 text-amber-700 dark:border-orange-800 dark:bg-orange-950 dark:text-amber-500">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention Required</AlertTitle>
              <AlertDescription>
                <p>The following observations require attention:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {Object.values(warnings).map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">All vital signs are required to proceed</p>
          <Button type="submit">Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
