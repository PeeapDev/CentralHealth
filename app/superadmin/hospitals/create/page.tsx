"use client"
import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Building, MapPin, Phone, Users, CreditCard, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function CreateHospitalPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [formData, setFormData] = useState({
    hospitalName: "",
    hospitalSlug: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    package: "",
    modules: [] as string[],
    maxUsers: "",
    maxPatients: "",
    hasBranches: false,
    numberOfBranches: 1,
    branchDetails: "",
  })

  const availableModules = [
    { id: "billing", name: "Billing Management" },
    { id: "appointment", name: "Appointment Scheduling" },
    { id: "opd", name: "OPD Management" },
    { id: "ipd", name: "IPD Management" },
    { id: "pharmacy", name: "Pharmacy" },
    { id: "pathology", name: "Pathology" },
    { id: "radiology", name: "Radiology" },
    { id: "bloodbank", name: "Blood Bank" },
    { id: "ambulance", name: "Ambulance" },
    { id: "hr", name: "Human Resources" },
    { id: "finance", name: "Finance" },
    { id: "messaging", name: "Messaging" },
  ]

  const packages = [
    { id: "basic", name: "Basic Package", price: "$99/month" },
    { id: "standard", name: "Standard Package", price: "$199/month" },
    { id: "premium", name: "Premium Package", price: "$299/month" },
    { id: "enterprise", name: "Enterprise Package", price: "$499/month" },
  ]

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      hospitalName: value,
      hospitalSlug: generateSlug(value),
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleModuleToggle = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter((id) => id !== moduleId)
        : [...prev.modules, moduleId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (
        !formData.hospitalName ||
        !formData.hospitalSlug ||
        !formData.adminEmail ||
        !formData.adminPassword ||
        !formData.package
      ) {
        toast.error("Please fill in all required fields including package selection")
        setIsLoading(false)
        return
      }

      // Create new hospital object
      const newHospital = {
        id: Date.now(),
        name: formData.hospitalName,
        slug: formData.hospitalSlug,
        status: "Active",
        admin: formData.adminName,
        email: formData.adminEmail,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        package: formData.package.charAt(0).toUpperCase() + formData.package.slice(1),
        branches: formData.hasBranches ? formData.numberOfBranches : 1,
        logo: logoPreview || "/placeholder.svg?height=40&width=40",
        createdAt: new Date().toISOString().split("T")[0],
        lastLogin: "Never",
      }

      // Store hospital data in localStorage
      const hospitalData = {
        ...formData,
        logo: logoPreview,
        createdAt: newHospital.createdAt,
        id: newHospital.id,
      }
      localStorage.setItem(`hospital_${formData.hospitalSlug}`, JSON.stringify(hospitalData))

      // Store in hospitals list
      const existingHospitals = JSON.parse(localStorage.getItem("hospitals") || "[]")
      existingHospitals.push(newHospital)
      localStorage.setItem("hospitals", JSON.stringify(existingHospitals))

      toast.success(`Hospital "${formData.hospitalName}" created successfully!`)
      toast.info(`Admin can login at: /${formData.hospitalSlug}/auth/login`)
      toast.info(`Admin credentials: ${formData.adminEmail} / ${formData.adminPassword}`)

      // Redirect back to hospitals list
      router.push("/superadmin/hospitals")
    } catch (error) {
      toast.error("Failed to create hospital. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Create New Hospital"
        description="Set up a new hospital instance with administrator credentials"
        breadcrumbs={[
          { label: "Super Admin" },
          { label: "Hospitals", href: "/superadmin/hospitals" },
          { label: "Create New Hospital" },
        ]}
      />

      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hospitals</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hospital Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Hospital Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name *</Label>
                <Input
                  id="hospitalName"
                  value={formData.hospitalName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter hospital name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalSlug">Hospital URL Slug *</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    mydomain.com/
                  </span>
                  <Input
                    id="hospitalSlug"
                    value={formData.hospitalSlug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hospitalSlug: e.target.value }))}
                    className="rounded-l-none"
                    placeholder="hospital-slug"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Hospital will be accessible at: mydomain.com/{formData.hospitalSlug}/admin
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the hospital"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Hospital Logo</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="cursor-pointer"
                  />
                </div>
                {logoPreview && (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Address Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Enter street address"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="ZIP Code"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="hospital@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://hospital.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Hospital Administrator</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminName: e.target.value }))}
                  placeholder="Dr. John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@hospital.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminPhone">Admin Phone</Label>
                <Input
                  id="adminPhone"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminPhone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminPassword: e.target.value }))}
                  placeholder="Enter secure password"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package & Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Package & Modules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="package">Select Package *</Label>
              <Select
                value={formData.package}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, package: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Available Modules</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableModules.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={module.id}
                      checked={formData.modules.includes(module.id)}
                      onCheckedChange={() => handleModuleToggle(module.id)}
                    />
                    <Label htmlFor={module.id} className="text-sm font-normal">
                      {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasBranches"
                checked={formData.hasBranches}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasBranches: checked as boolean }))}
              />
              <Label htmlFor="hasBranches">This hospital has multiple branches</Label>
            </div>

            {formData.hasBranches && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="numberOfBranches">Number of Branches *</Label>
                  <Input
                    id="numberOfBranches"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfBranches}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, numberOfBranches: Number.parseInt(e.target.value) || 1 }))
                    }
                    placeholder="Enter number of branches"
                    required={formData.hasBranches}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchDetails">Branch Details</Label>
                  <Textarea
                    id="branchDetails"
                    value={formData.branchDetails}
                    onChange={(e) => setFormData((prev) => ({ ...prev, branchDetails: e.target.value }))}
                    placeholder="Provide details about each branch (locations, specialties, etc.)"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Maximum Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxUsers: e.target.value }))}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPatients">Maximum Patients</Label>
                <Input
                  id="maxPatients"
                  type="number"
                  value={formData.maxPatients}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxPatients: e.target.value }))}
                  placeholder="10000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Hospital..." : "Create Hospital"}
          </Button>
        </div>
      </form>
    </div>
  )
}
