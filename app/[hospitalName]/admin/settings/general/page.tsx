"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Building, Phone, MapPin, Globe, Mail, Check, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface GeneralSettingsProps {
  params: Promise<{ hospitalName: string }> | { hospitalName: string }
}

interface HospitalSettings {
  name: string
  description: string
  admin_email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  zip: string
  website: string
  logo: string
  branches: Branch[]
}

interface Branch {
  name: string
  address: string
  phone: string
  email: string
}

export default function GeneralSettingsPage({ params }: GeneralSettingsProps) {
  // Extract hospitalName using React.use for Promise params
  const { hospitalName } = params instanceof Promise ? React.use(params) : params
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const [hospital, setHospital] = useState<HospitalSettings | null>(null)
  const [formData, setFormData] = useState<HospitalSettings>({
    name: "",
    description: "",
    admin_email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    website: "",
    logo: "",
    branches: []
  })
  
  // Fetch hospital data
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const response = await fetch(`/api/hospitals/${hospitalName}`)
        if (response.ok) {
          const data = await response.json()
          setHospital(data)
          
          // Set form data from hospital data
          setFormData({
            name: data.name || "",
            description: data.description || "",
            admin_email: data.admin_email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            zip: data.zip || "",
            website: data.website || "",
            logo: data.logo || "",
            branches: data.branches || []
          })
        }
      } catch (error) {
        console.error("Error fetching hospital data:", error)
        toast.error("Failed to load hospital data")
      }
    }
    
    fetchHospital()
  }, [hospitalName])
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP, or SVG)")
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB")
      return
    }
    
    setLogoLoading(true)
    try {
      // Convert image to base64
      const base64 = await convertToBase64(file)
      
      // Create form data
      const formData = new FormData()
      formData.append('logo', base64)
      
      // Send to API
      const response = await fetch(`/api/hospitals/${hospitalName}/logo`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({ ...prev, logo: result.logo }))
        toast.success("Hospital logo updated successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update hospital logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("An error occurred while uploading the logo")
    } finally {
      setLogoLoading(false)
    }
  }
  
  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }
  
  // Add a new branch
  const addBranch = () => {
    setFormData(prev => ({
      ...prev,
      branches: [...prev.branches, { name: "", address: "", phone: "", email: "" }]
    }))
  }
  
  // Update branch information
  const updateBranch = (index: number, field: keyof Branch, value: string) => {
    setFormData(prev => {
      const newBranches = [...prev.branches]
      newBranches[index] = { ...newBranches[index], [field]: value }
      return { ...prev, branches: newBranches }
    })
  }
  
  // Remove a branch
  const removeBranch = (index: number) => {
    setFormData(prev => {
      const newBranches = prev.branches.filter((_, i) => i !== index)
      return { ...prev, branches: newBranches }
    })
  }
  
  // Save settings
  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/hospitals/${hospitalName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success("Hospital settings updated successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update hospital settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("An error occurred while saving settings")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="General Settings"
        description="Manage your hospital general information and branches"
        breadcrumbs={[
          { label: "Home", href: `/${hospitalName}/admin` },
          { label: "Settings", href: `/${hospitalName}/admin/settings` },
          { label: "General" }
        ]}
      />
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          {/* Hospital Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Hospital Logo</CardTitle>
              <CardDescription>Upload your hospital logo (recommended size: 200x200 pixels)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative h-32 w-32 rounded-md border-2 border-dashed border-gray-300 p-2 flex items-center justify-center">
                  {logoLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  ) : formData.logo ? (
                    <img 
                      src={formData.logo} 
                      alt="Hospital Logo" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Building className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      <span>Upload New Logo</span>
                    </div>
                    <input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={logoLoading}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground">Supported formats: JPEG, PNG, GIF, WEBP, SVG. Max size: 2MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your hospital's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter hospital name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin Email</Label>
                  <Input
                    id="admin_email"
                    name="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of your hospital"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourhospital.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (123) 456-7890"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Update your hospital's address details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip">Postal/ZIP Code</Label>
                  <Input
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="branches" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hospital Branches</CardTitle>
                <CardDescription>Manage multiple locations for your hospital</CardDescription>
              </div>
              <Button onClick={addBranch}>Add Branch</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.branches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No branches added yet. Click "Add Branch" to create your first branch.</p>
                </div>
              ) : (
                formData.branches.map((branch, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Branch #{index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeBranch(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Branch Name</Label>
                        <Input
                          value={branch.name}
                          onChange={(e) => updateBranch(index, "name", e.target.value)}
                          placeholder="Branch Name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-gray-400" />
                          <Input
                            value={branch.email}
                            onChange={(e) => updateBranch(index, "email", e.target.value)}
                            placeholder="branch@example.com"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                        <Input
                          value={branch.address}
                          onChange={(e) => updateBranch(index, "address", e.target.value)}
                          placeholder="Branch Address"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        <Input
                          value={branch.phone}
                          onChange={(e) => updateBranch(index, "phone", e.target.value)}
                          placeholder="+1 (123) 456-7890"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
