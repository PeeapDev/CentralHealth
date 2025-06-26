"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { addDays, addWeeks, format, differenceInDays, parseISO } from "date-fns"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, CalendarDays, Send } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VisitSchedule {
  visitNumber: number
  week: number
  scheduledDate: string
  purpose: string
  notification: boolean
  completed?: boolean
}

interface VisitPlanData {
  nextVisitDate: string
  visitSchedule: VisitSchedule[]
  visitFrequency?: string
  notificationType?: string
  additionalNotes?: string
  completed?: boolean
}

interface Patient {
  id: string
  name: string
  medicalNumber?: string
  age?: number
  gender?: string
  phone?: string // Added phone property to fix TypeScript errors
}

interface VisitPlanFormProps {
  patientData: Patient
  initialData: VisitPlanData
  onSave: (data: VisitPlanData) => void
}

export default function VisitPlanForm({ patientData, initialData, onSave }: VisitPlanFormProps) {
  const [formData, setFormData] = useState<VisitPlanData>(initialData || {
    nextVisitDate: "",
    visitSchedule: [],
    visitFrequency: "standard",
    notificationType: "sms",
    additionalNotes: ""
  })
  const [activeTab, setActiveTab] = useState("schedule")
  const [edd, setEDD] = useState<Date | null>(null)
  const [currentGestationalAge, setCurrentGestationalAge] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Try to get EDD from local storage on component mount
  useEffect(() => {
    try {
      const bookingData = localStorage.getItem("antenatalBookingVisit")
      if (bookingData) {
        const parsed = JSON.parse(bookingData)
        if (parsed && parsed.edd) {
          setEDD(new Date(parsed.edd))
          
          // Calculate current gestational age if EDD is available
          const today = new Date()
          const eddDate = new Date(parsed.edd)
          
          // EDD is 40 weeks from start of pregnancy
          // So we calculate days from today to EDD, then subtract from 280 days (40 weeks)
          const daysToEDD = differenceInDays(eddDate, today)
          const gestationalAgeDays = 280 - daysToEDD
          const gestationalAgeWeeks = Math.floor(gestationalAgeDays / 7)
          
          setCurrentGestationalAge(gestationalAgeWeeks)
        }
      }
    } catch (error) {
      console.error("Error loading EDD from local storage:", error)
    }
  }, [])
  
  // Generate visit schedule based on current gestational age and EDD
  const generateVisitSchedule = () => {
    if (!edd) {
      setErrors({ general: "Expected Due Date not found. Please complete the booking visit first." })
      return
    }

    const today = new Date()
    const endDate = new Date(edd)
    const visitSchedule: VisitSchedule[] = []
    
    // Standard WHO recommended schedule with additional visits for high-risk pregnancies
    const scheduleWeeks = formData.visitFrequency === "high-risk" 
      ? [16, 20, 24, 28, 30, 32, 34, 36, 37, 38, 39, 40]  // High-risk schedule
      : [16, 20, 26, 30, 34, 36, 38, 40]                  // Standard schedule
    
    // Filter out past weeks based on current gestational age
    const remainingWeeks = scheduleWeeks.filter(week => week > currentGestationalAge)
    
    // Calculate dates for each visit
    let visitNumber = 1
    remainingWeeks.forEach(week => {
      // Calculate date for this gestational week
      // EDD is at week 40, so calculate backwards
      const weeksFromEDD = 40 - week
      const visitDate = addDays(endDate, -7 * weeksFromEDD)
      
      // Only add future visits
      if (visitDate > today) {
        visitSchedule.push({
          visitNumber: visitNumber++,
          week,
          scheduledDate: visitDate.toISOString(),
          purpose: getPurposeForWeek(week),
          notification: true
        })
      }
    })
    
    // Update form data with the new schedule
    setFormData({
      ...formData,
      visitSchedule,
      nextVisitDate: visitSchedule.length > 0 ? visitSchedule[0].scheduledDate : ""
    })
    
    // Clear any errors
    setErrors({})
  }
  
  // Determine purpose of visit based on gestational week
  const getPurposeForWeek = (week: number): string => {
    if (week < 20) return "Early Antenatal Assessment"
    if (week === 20) return "Anomaly Scan & Assessment"
    if (week >= 36) return "Birth Preparation & Monitoring"
    return "Routine Antenatal Check"
  }
  
  // Handle next visit date selection
  const handleNextVisitDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        nextVisitDate: date.toISOString()
      })
    }
  }
  
  // Handle visit schedule item date change
  const handleScheduledDateChange = (index: number, date: Date | undefined) => {
    if (date) {
      const updatedSchedule = [...formData.visitSchedule]
      updatedSchedule[index] = {
        ...updatedSchedule[index],
        scheduledDate: date.toISOString()
      }
      
      setFormData({
        ...formData,
        visitSchedule: updatedSchedule
      })
    }
  }
  
  // Toggle notification for a visit
  const handleNotificationToggle = (index: number) => {
    const updatedSchedule = [...formData.visitSchedule]
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      notification: !updatedSchedule[index].notification
    }
    
    setFormData({
      ...formData,
      visitSchedule: updatedSchedule
    })
  }
  
  // Handle frequency selection
  const handleFrequencyChange = (value: string) => {
    setFormData({
      ...formData,
      visitFrequency: value
    })
  }
  
  // Handle notification type selection
  const handleNotificationTypeChange = (value: string) => {
    setFormData({
      ...formData,
      notificationType: value
    })
  }
  
  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      additionalNotes: e.target.value
    })
  }
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.nextVisitDate) {
      setErrors({ nextVisitDate: "Next visit date is required" })
      return
    }
    
    if (formData.visitSchedule.length === 0) {
      setErrors({ general: "Please generate a visit schedule" })
      return
    }
    
    // Submit the form
    onSave(formData)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Antenatal Visit Plan</CardTitle>
        <CardDescription>
          Schedule and manage antenatal care visits throughout the pregnancy
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Visit Schedule
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Send className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="space-y-6">
            <TabsContent value="schedule" className="space-y-6 mt-0">
              {/* Generate Schedule Controls */}
              <div className="flex flex-col md:flex-row md:items-end gap-4 p-4 border rounded-md bg-muted/20">
                <div className="space-y-2">
                  <Label htmlFor="visitFrequency">Visit Frequency</Label>
                  <Select
                    onValueChange={handleFrequencyChange}
                    value={formData.visitFrequency}
                  >
                    <SelectTrigger id="visitFrequency" className="w-48">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (8 visits)</SelectItem>
                      <SelectItem value="high-risk">High-risk (12 visits)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Based on WHO recommendations
                  </p>
                </div>
                
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Current Gestational Age: {currentGestationalAge} weeks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Expected Due Date: {edd ? format(edd, 'PPP') : 'Not Set'}
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  onClick={generateVisitSchedule}
                  className="md:self-end"
                >
                  Generate Schedule
                </Button>
              </div>
              
              {/* Error message if EDD not found */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}
              
              {/* Next Visit */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Next Appointment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nextVisitDate">Next Visit Date</Label>
                    {/* Removed id prop as it's not in DatePickerProps interface */}
                    <DatePicker 
                      date={formData.nextVisitDate ? new Date(formData.nextVisitDate) : undefined}
                      setDate={handleNextVisitDateChange}
                      className="w-full"
                      placeholder="Select next visit date"
                    />
                    {errors.nextVisitDate && <p className="text-sm text-red-500">{errors.nextVisitDate}</p>}
                  </div>
                  
                  {formData.visitSchedule.length > 0 && (
                    <div className="space-y-2 p-4 border rounded-md bg-muted/20">
                      <h4 className="font-medium">Next Scheduled Appointment:</h4>
                      <div className="text-sm">
                        <p>
                          <span className="font-semibold">Date:</span>{' '}
                          {format(new Date(formData.visitSchedule[0].scheduledDate), 'PPP')}
                        </p>
                        <p>
                          <span className="font-semibold">Week:</span>{' '}
                          {formData.visitSchedule[0].week} of pregnancy
                        </p>
                        <p>
                          <span className="font-semibold">Purpose:</span>{' '}
                          {formData.visitSchedule[0].purpose}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Visit Schedule Table */}
              {formData.visitSchedule.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Full Visit Schedule</h3>
                    <Badge variant="secondary">
                      {formData.visitSchedule.length} visits planned
                    </Badge>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Week</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="hidden md:table-cell">Purpose</TableHead>
                          <TableHead className="text-right">Notify</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.visitSchedule.map((visit, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{visit.visitNumber}</TableCell>
                            <TableCell>{visit.week}</TableCell>
                            <TableCell>
                              <DatePicker 
                                date={new Date(visit.scheduledDate)}
                                setDate={(date) => handleScheduledDateChange(index, date)}
                                className="w-full"
                                placeholder="Select date"
                              />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{visit.purpose}</TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={visit.notification}
                                onCheckedChange={() => handleNotificationToggle(index)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6 mt-0">
              {/* Notification Settings */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Reminder Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure how the patient will receive appointment reminders
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="notificationType">Notification Method</Label>
                    <Select
                      onValueChange={handleNotificationTypeChange}
                      value={formData.notificationType}
                    >
                      <SelectTrigger id="notificationType">
                        <SelectValue placeholder="Select notification method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS Text Message</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="both">Both SMS & Email</SelectItem>
                        <SelectItem value="none">No Notifications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Contact Information</Label>
                    <div className="p-3 border rounded-md bg-muted">
                      <p className="text-sm">
                        <span className="font-semibold">Name:</span> {patientData.name}
                      </p>
                      {patientData.phone && (
                        <p className="text-sm">
                          <span className="font-semibold">Phone:</span> {patientData.phone}
                        </p>
                      )}
                      {!patientData.phone && formData.notificationType?.includes('sms') && (
                        <p className="text-xs text-red-500">
                          No phone number on file. Please update patient details.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleNotesChange}
                    placeholder="Any special instructions or notes for upcoming visits"
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {formData.visitSchedule.length} visits scheduled
          </p>
          <Button type="submit">Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
