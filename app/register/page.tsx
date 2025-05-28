"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
]

export default function PatientRegistrationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<Date>()

  const [formData, setFormData] = useState({
    prefix: "none",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    emergencyContact: "",
    emergencyPhone: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setDate(date)
    if (date) {
      setFormData((prev) => ({
        ...prev,
        birthDate: format(date, "yyyy-MM-dd"),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email", "gender", "birthDate"]
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/patients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Patient registration successful!")
        // Show the medical number to the patient
        toast.info(`Your medical number is: ${data.medicalNumber}`, {
          duration: 10000, // Show for 10 seconds
        })
        // Redirect to success page
        router.push(`/register/success?medicalNumber=${data.medicalNumber}`)
      } else {
        toast.error(data.error || "Failed to register patient")
      }
    } catch (error) {
      console.error("Error registering patient:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              National Health Service
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm hover:underline">
                Home
              </Link>
              <Link href="/login" className="text-sm hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex-1 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">National Patient Registration</h1>
            <p className="mt-2 text-muted-foreground">
              Register once for access to all participating healthcare facilities
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Patient Registration Form</CardTitle>
              <CardDescription>
                Please fill in all required fields marked with an asterisk (*)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleSelectChange("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Date of Birth <span className="text-red-500">*</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleDateChange}
                          initialFocus
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Enter street address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="Enter state or province"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      placeholder="Enter postal code"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="Enter country"
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    name="emergencyContact"
                    placeholder="Enter emergency contact name"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    placeholder="Enter emergency contact phone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                        Registering...
                      </>
                    ) : (
                      "Register as a Patient"
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    By registering, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Already registered?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </div>
            </CardFooter>
          </Card>

          <div className="mt-8 bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Why Register with the National Health Service?</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Create a single medical record accessible by all participating hospitals</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Receive a unique medical number for streamlined healthcare access</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Ensure your medical history is available to authorized healthcare providers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Reduce paperwork when visiting different healthcare facilities</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="border-t py-6">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} National Health Service. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
