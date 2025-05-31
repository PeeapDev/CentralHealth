"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function PatientRegistrationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    prefix: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    birthDate: "",
    phone: "",
    address: "",
    sendCredentials: false
  })
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }
  
  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd')
      setFormData({ ...formData, birthDate: dateString })
      if (errors.birthDate) {
        setErrors({ ...errors, birthDate: "" })
      }
    }
  }
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    // Clear error when user selects
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }
  
  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked })
  }
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Required fields
    if (!formData.firstName) newErrors.firstName = "First name is required"
    if (!formData.lastName) newErrors.lastName = "Last name is required"
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match"
    }
    if (!formData.gender) newErrors.gender = "Gender is required"
    if (!formData.birthDate) {
      newErrors.birthDate = "Date of birth is required"
    } else {
      // Check that birthDate is not in the future
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      if (birthDate > today) {
        newErrors.birthDate = "Date of birth cannot be in the future"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch("/api/patients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to register patient")
      }
      
      // Show success message
      toast.success("Patient registered successfully")
      
      // If sendCredentials is true, we would trigger an email here
      if (formData.sendCredentials) {
        // This would integrate with your email service
        toast.info("Login credentials will be sent to the patient's email")
      }
      
      // Navigate to the patient list
      router.push("/superadmin/users/patient")
      
    } catch (error: any) {
      console.error("Error registering patient:", error)
      toast.error(error.message || "Failed to register patient")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container py-6">
      <PageHeader
        title="Register New Patient"
        description="Add a new patient to the centralized registry"
      />
      
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient List
        </Button>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Patient Registration Form</CardTitle>
          <CardDescription>
            Enter patient details to create a new medical record in the centralized registry
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Title</Label>
                  <Select 
                    value={formData.prefix} 
                    onValueChange={(value) => handleSelectChange("prefix", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Prof">Prof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleSelectChange("gender", value)}
                  >
                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Date of Birth <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="birthDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.birthDate && "text-muted-foreground",
                          errors.birthDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.birthDate ? format(new Date(formData.birthDate), "PPP") : <span>Select date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.birthDate ? new Date(formData.birthDate) : undefined}
                        onSelect={handleDateChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.birthDate && (
                    <p className="text-sm text-red-500">{errors.birthDate}</p>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, Country"
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Information</h3>
              <p className="text-sm text-muted-foreground">
                Create login credentials for the patient portal
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sendCredentials"
                  checked={formData.sendCredentials}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange("sendCredentials", checked === true)
                  }
                />
                <label
                  htmlFor="sendCredentials"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send login credentials to patient's email
                </label>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Patient"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
