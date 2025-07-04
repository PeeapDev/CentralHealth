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
        <CardTitle>Antenatal Booking Visit</CardTitle>
        <CardDescription>
          Record initial pregnancy details and establish baseline information for antenatal care
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <h3 className="text-sm font-medium text-blue-800">Patient Identification</h3>
            <p className="text-sm text-blue-700 mt-1">Booking visit information for {patientData.name}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Last Menstrual Period */}
            <div className="space-y-2">
              <Label htmlFor="lmp">Last Menstrual Period (LMP)</Label>
              <DatePicker 
                date={formData.lmp ? new Date(formData.lmp) : undefined}
                setDate={handleLMPChange}
                className="w-full"
                placeholder="Select LMP date"
              />
              {errors.lmp && <p className="text-sm text-red-500">{errors.lmp}</p>}
              <p className="text-xs text-gray-500">First day of the last menstrual period</p>
            </div>
            
            {/* Expected Due Date (EDD) */}
            <div className="space-y-2">
              <Label htmlFor="edd">Expected Due Date (EDD)</Label>
              <DatePicker 
                date={formData.edd ? new Date(formData.edd) : undefined}
                setDate={(date) => date && setFormData({...formData, edd: date.toISOString()})}
                className="w-full"
                disabled={true} // Calculated from LMP
                placeholder="Expected due date"
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
          
          {/* Additional Information */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">Pregnancy Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trimester">Current Trimester</Label>
                <select 
                  id="trimester"
                  className="w-full border rounded-lg p-2"
                  defaultValue={"first"}
                >
                  <option value="first">First Trimester (1-12 weeks)</option>
                  <option value="second">Second Trimester (13-26 weeks)</option>
                  <option value="third">Third Trimester (27-40 weeks)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gestationalAge">Gestational Age at Booking</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="gestationalAge"
                    type="number"
                    min="1"
                    max="42"
                    placeholder="Weeks"
                    className="w-1/2"
                  />
                  <span className="text-gray-500">weeks</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Care timeline information */}
          <div className="rounded-md border p-4 mt-6">
            <h3 className="font-medium mb-2">Antenatal Care Timeline</h3>
            <p className="text-sm text-gray-600">Based on the estimated due date, the following schedule is recommended:</p>
            
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">First visit (Booking): Today</span>
              </div>
              {formData.edd && (
                <>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                    <span className="text-sm">Second visit: 4 weeks from today</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                    <span className="text-sm">Third visit: 8 weeks from today</span>
                  </div>
                </>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">* A detailed visit schedule will be created after completing all sections</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Complete this section to establish pregnancy timeline</p>
          </div>
          <Button type="submit">Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
