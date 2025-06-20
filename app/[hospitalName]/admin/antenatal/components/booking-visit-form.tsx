"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { addDays } from 'date-fns'

interface BookingVisitData {
  lmp: string
  edd: string
  gravida: string
  para: string
  completed?: boolean
}

interface Patient {
  id: string
  name: string
  medicalNumber?: string
  age?: number
  gender?: string
}

interface BookingVisitFormProps {
  patientData: Patient
  initialData: BookingVisitData
  onSave: (data: BookingVisitData) => void
}

export default function BookingVisitForm({ patientData, initialData, onSave }: BookingVisitFormProps) {
  const [formData, setFormData] = useState<BookingVisitData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Calculate Expected Due Date from Last Menstrual Period
  const calculateEDD = (lmpDate: Date | null) => {
    if (!lmpDate) return null
    // EDD = LMP + 280 days (40 weeks)
    return addDays(lmpDate, 280)
  }
  
  // Handle LMP date change and automatically calculate EDD
  const handleLMPChange = (date: Date | undefined) => {
    if (date) {
      const eddDate = calculateEDD(date)
      setFormData({
        ...formData,
        lmp: date.toISOString(),
        edd: eddDate ? eddDate.toISOString() : ""
      })
      
      // Clear any errors for these fields
      const updatedErrors = { ...errors }
      delete updatedErrors.lmp
      delete updatedErrors.edd
      setErrors(updatedErrors)
    }
  }
  
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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    if (!formData.lmp) newErrors.lmp = "Last Menstrual Period is required"
    if (!formData.edd) newErrors.edd = "Expected Due Date is required" 
    if (!formData.gravida) newErrors.gravida = "Gravida is required"
    if (!formData.para) newErrors.para = "Para is required"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Form is valid, save data
    onSave(formData)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Visit</CardTitle>
        <CardDescription>
          Record initial pregnancy information and calculate Expected Due Date
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Last Menstrual Period */}
            <div className="space-y-2">
              <Label htmlFor="lmp">Last Menstrual Period (LMP)</Label>
              <DatePicker 
                id="lmp"
                date={formData.lmp ? new Date(formData.lmp) : undefined}
                setDate={handleLMPChange}
                className="w-full"
              />
              {errors.lmp && <p className="text-sm text-red-500">{errors.lmp}</p>}
              <p className="text-xs text-gray-500">First day of the last menstrual period</p>
            </div>
            
            {/* Expected Due Date (EDD) */}
            <div className="space-y-2">
              <Label htmlFor="edd">Expected Due Date (EDD)</Label>
              <DatePicker 
                id="edd"
                date={formData.edd ? new Date(formData.edd) : undefined}
                setDate={(date) => date && setFormData({...formData, edd: date.toISOString()})}
                className="w-full"
                disabled // Calculated from LMP
              />
              {errors.edd && <p className="text-sm text-red-500">{errors.edd}</p>}
              <p className="text-xs text-gray-500">Automatically calculated from LMP (LMP + 40 weeks)</p>
            </div>
            
            {/* Gravida (Number of pregnancies) */}
            <div className="space-y-2">
              <Label htmlFor="gravida">Gravida</Label>
              <Input
                id="gravida"
                name="gravida"
                type="number"
                min="1"
                value={formData.gravida}
                onChange={handleInputChange}
                placeholder="Number of pregnancies including current"
              />
              {errors.gravida && <p className="text-sm text-red-500">{errors.gravida}</p>}
            </div>
            
            {/* Para (Number of births) */}
            <div className="space-y-2">
              <Label htmlFor="para">Para</Label>
              <Input
                id="para"
                name="para"
                type="number"
                min="0"
                value={formData.para}
                onChange={handleInputChange}
                placeholder="Number of previous births"
              />
              {errors.para && <p className="text-sm text-red-500">{errors.para}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">All fields are required to proceed</p>
          <Button type="submit">Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
