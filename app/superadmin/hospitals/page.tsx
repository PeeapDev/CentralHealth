"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Building2, Plus, Search, Eye, Edit, Trash2, Users, Save, X } from "lucide-react"
import { toast } from "sonner"

// Hospital type definition
type Hospital = {
  id: number
  name: string
  slug: string
  status: string
  admin: string
  email: string
  phone: string
  address: string
  package: string
  branches: number
  logo: string
  createdAt: string
  lastLogin: string
  description?: string
  website?: string
  modules?: string[]
}

// Sample hospital data
const initialHospitals: Hospital[] = [
  {
    id: 1,
    name: "Smart Hospital & Research Center",
    slug: "smart-hospital",
    status: "Active",
    admin: "Dr. John Smith",
    email: "admin@smarthospital.com",
    phone: "+1 (555) 123-4567",
    address: "123 Medical Center Dr, New York, NY 10001",
    package: "Premium",
    branches: 3,
    logo: "/placeholder.svg?height=40&width=40",
    createdAt: "2024-01-15",
    lastLogin: "2024-05-24",
    description: "Leading research hospital",
    website: "https://smarthospital.com",
    modules: ["billing", "appointment", "opd", "ipd"],
  },
  {
    id: 2,
    name: "City Medical Center",
    slug: "city-medical",
    status: "Active",
    admin: "Dr. Sarah Johnson",
    email: "admin@citymedical.com",
    phone: "+1 (555) 987-6543",
    address: "456 Healthcare Ave, Los Angeles, CA 90210",
    package: "Standard",
    branches: 1,
    logo: "/placeholder.svg?height=40&width=40",
    createdAt: "2024-02-20",
    lastLogin: "2024-05-23",
    description: "Community healthcare center",
    website: "https://citymedical.com",
    modules: ["billing", "appointment", "pharmacy"],
  },
  {
    id: 3,
    name: "General Hospital",
    slug: "general-hospital",
    status: "Inactive",
    admin: "Dr. Michael Brown",
    email: "admin@generalhospital.com",
    phone: "+1 (555) 456-7890",
    address: "789 Health St, Chicago, IL 60601",
    package: "Basic",
    branches: 2,
    logo: "/placeholder.svg?height=40&width=40",
    createdAt: "2024-03-10",
    lastLogin: "2024-05-20",
    description: "General medical services",
    website: "https://generalhospital.com",
    modules: ["billing", "appointment"],
  },
]

export default function AllHospitalsPage() {
  const router = useRouter()
  const [hospitals, setHospitals] = useState<Hospital[]>(initialHospitals)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)

  // Load hospitals from localStorage on component mount
  useEffect(() => {
    const storedHospitals = localStorage.getItem("hospitals_list")
    if (storedHospitals) {
      try {
        const parsed = JSON.parse(storedHospitals)
        setHospitals(parsed)
      } catch (error) {
        console.error("Error parsing stored hospitals:", error)
        setHospitals(initialHospitals)
      }
    }
  }, [])

  // Save hospitals to localStorage whenever hospitals change
  useEffect(() => {
    localStorage.setItem("hospitals_list", JSON.stringify(hospitals))
  }, [hospitals])

  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "Inactive":
        return <Badge className="bg-red-500 text-white">Inactive</Badge>
      case "Suspended":
        return <Badge className="bg-yellow-500 text-white">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPackageBadge = (packageType: string) => {
    switch (packageType) {
      case "Premium":
        return <Badge className="bg-purple-500 text-white">Premium</Badge>
      case "Standard":
        return <Badge className="bg-blue-500 text-white">Standard</Badge>
      case "Basic":
        return <Badge className="bg-gray-500 text-white">Basic</Badge>
      default:
        return <Badge variant="outline">{packageType}</Badge>
    }
  }

  // CREATE - Add new hospital (FIXED VERSION)
  const handleCreateHospital = (hospitalData: Partial<Hospital>) => {
    console.log("Creating hospital with data:", hospitalData) // Debug log

    const newHospital: Hospital = {
      id: Date.now(),
      name: hospitalData.name || "",
      slug: hospitalData.slug || "",
      status: "Active",
      admin: hospitalData.admin || "",
      email: hospitalData.email || "",
      phone: hospitalData.phone || "",
      address: hospitalData.address || "",
      package: hospitalData.package || "Basic",
      branches: hospitalData.branches || 1,
      logo: "/placeholder.svg?height=40&width=40",
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Never",
      description: hospitalData.description || "",
      website: hospitalData.website || "",
      modules: hospitalData.modules || [],
    }

    console.log("New hospital object:", newHospital) // Debug log

    setHospitals((prev) => {
      const updated = [...prev, newHospital]
      console.log("Updated hospitals list:", updated) // Debug log
      return updated
    })

    // Also store individual hospital data for login
    localStorage.setItem(
      `hospital_${newHospital.slug}`,
      JSON.stringify({
        ...newHospital,
        adminPassword: "admin123", // Default password for demo
      }),
    )

    toast.success(`Hospital "${newHospital.name}" created successfully!`)
    toast.info(`Login URL: /${newHospital.slug}/auth/login`)
    toast.info(`Admin credentials: ${newHospital.email} / admin123`)

    setIsCreateDialogOpen(false)
  }

  // READ - View hospital details
  const handleViewHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital)
    setIsViewDialogOpen(true)
  }

  // UPDATE - Edit hospital
  const handleEditHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital)
    setIsEditDialogOpen(true)
  }

  const handleUpdateHospital = (hospitalData: Partial<Hospital>) => {
    if (!selectedHospital) return

    const updatedHospital: Hospital = {
      ...selectedHospital,
      ...hospitalData,
      id: selectedHospital.id, // Keep original ID
      createdAt: selectedHospital.createdAt, // Keep original creation date
    }

    setHospitals((prev) => prev.map((h) => (h.id === selectedHospital.id ? updatedHospital : h)))

    toast.success(`Hospital "${updatedHospital.name}" updated successfully!`)
    setIsEditDialogOpen(false)
    setSelectedHospital(null)
  }

  // DELETE - Remove hospital
  const handleDeleteHospital = (hospitalId: number) => {
    const hospital = hospitals.find((h) => h.id === hospitalId)
    if (!hospital) return

    setHospitals((prev) => prev.filter((h) => h.id !== hospitalId))
    toast.success(`Hospital "${hospital.name}" deleted successfully!`)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="All Hospitals"
        description="Manage all hospital instances and their administrators"
        breadcrumbs={[{ label: "Home" }, { label: "Subscription" }, { label: "All Hospitals" }]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Hospital Management</span>
            </CardTitle>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Hospital
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Hospital</DialogTitle>
                  <DialogDescription>Add a new hospital instance with administrator credentials</DialogDescription>
                </DialogHeader>
                <HospitalForm
                  mode="create"
                  onSubmit={handleCreateHospital}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search hospitals, admins, or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Total: {hospitals.length}
            </Button>
          </div>

          {/* Hospitals Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital Details</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={hospital.logo || "/placeholder.svg"}
                          alt={hospital.name}
                          className="w-8 h-8 rounded"
                        />
                        <div>
                          <div className="font-medium">{hospital.name}</div>
                          <div className="text-sm text-gray-500">/{hospital.slug}</div>
                          <div className="text-sm text-gray-500">{hospital.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{hospital.admin}</div>
                        <div className="text-sm text-gray-500">{hospital.email}</div>
                        <div className="text-sm text-gray-500">{hospital.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(hospital.status)}</TableCell>
                    <TableCell>{getPackageBadge(hospital.package)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {hospital.branches} Branch{hospital.branches > 1 ? "es" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{hospital.createdAt}</TableCell>
                    <TableCell className="text-sm">{hospital.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* VIEW Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewHospital(hospital)}
                          title="View Hospital Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* EDIT Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditHospital(hospital)}
                          title="Edit Hospital"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* DELETE Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              title="Delete Hospital"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the hospital "{hospital.name}
                                " and remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteHospital(hospital.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Hospital
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredHospitals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hospitals found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW Hospital Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hospital Details</DialogTitle>
            <DialogDescription>View complete hospital information</DialogDescription>
          </DialogHeader>
          {selectedHospital && <HospitalView hospital={selectedHospital} />}
        </DialogContent>
      </Dialog>

      {/* EDIT Hospital Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
            <DialogDescription>Update hospital information and settings</DialogDescription>
          </DialogHeader>
          {selectedHospital && (
            <HospitalForm
              mode="edit"
              hospital={selectedHospital}
              onSubmit={handleUpdateHospital}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedHospital(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Hospital Form Component (CREATE & UPDATE)
function HospitalForm({
  mode,
  hospital,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit"
  hospital?: Hospital
  onSubmit: (data: Partial<Hospital>) => void
  onCancel: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: hospital?.name || "",
    slug: hospital?.slug || "",
    admin: hospital?.admin || "",
    email: hospital?.email || "",
    phone: hospital?.phone || "",
    address: hospital?.address || "",
    package: hospital?.package || "Basic",
    status: hospital?.status || "Active",
    branches: hospital?.branches || 1,
    description: hospital?.description || "",
    website: hospital?.website || "",
    modules: hospital?.modules || [],
  })

  const packages = ["Basic", "Standard", "Premium", "Enterprise"]
  const statuses = ["Active", "Inactive", "Suspended"]
  const availableModules = [
    "billing",
    "appointment",
    "opd",
    "ipd",
    "pharmacy",
    "pathology",
    "radiology",
    "bloodbank",
    "ambulance",
    "hr",
    "finance",
    "messaging",
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
      name: value,
      slug: mode === "create" ? generateSlug(value) : prev.slug,
    }))
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
    console.log("Form submitted with data:", formData) // Debug log
    setIsLoading(true)

    try {
      // Validation
      if (!formData.name || !formData.slug || !formData.admin || !formData.email) {
        toast.error("Please fill in all required fields")
        setIsLoading(false)
        return
      }

      console.log("Calling onSubmit with:", formData) // Debug log
      // Submit data
      onSubmit(formData)
    } catch (error) {
      console.error("Error in form submission:", error) // Debug log
      toast.error(`Failed to ${mode} hospital. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Hospital Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter hospital name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="hospital-slug"
            disabled={mode === "edit"}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="admin">Administrator Name *</Label>
          <Input
            id="admin"
            value={formData.admin}
            onChange={(e) => setFormData((prev) => ({ ...prev, admin: e.target.value }))}
            placeholder="Dr. John Smith"
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
            placeholder="admin@hospital.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+1 (555) 123-4567"
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

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="123 Medical Center Dr, City, State"
        />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="package">Package</Label>
          <Select
            value={formData.package}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, package: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select package" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg} value={pkg}>
                  {pkg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="branches">Number of Branches</Label>
          <Input
            id="branches"
            type="number"
            min="1"
            value={formData.branches}
            onChange={(e) => setFormData((prev) => ({ ...prev, branches: Number.parseInt(e.target.value) || 1 }))}
          />
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <Label>Available Modules</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableModules.map((module) => (
            <div key={module} className="flex items-center space-x-2">
              <Checkbox
                id={module}
                checked={formData.modules.includes(module)}
                onCheckedChange={() => handleModuleToggle(module)}
              />
              <Label htmlFor={module} className="text-sm capitalize">
                {module}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading
            ? `${mode === "create" ? "Creating" : "Updating"}...`
            : `${mode === "create" ? "Create" : "Update"} Hospital`}
        </Button>
      </div>
    </form>
  )
}

// Hospital View Component (READ)
function HospitalView({ hospital }: { hospital: Hospital }) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">Hospital Name</Label>
            <p className="text-lg font-semibold">{hospital.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">URL Slug</Label>
            <p className="text-sm text-blue-600">/{hospital.slug}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Administrator</Label>
            <p>{hospital.admin}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Email</Label>
            <p>{hospital.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">Phone</Label>
            <p>{hospital.phone || "Not provided"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Website</Label>
            <p>{hospital.website || "Not provided"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Package</Label>
            <Badge className="mt-1">{hospital.package}</Badge>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Status</Label>
            <div className="mt-1">
              {hospital.status === "Active" && <Badge className="bg-green-500">Active</Badge>}
              {hospital.status === "Inactive" && <Badge className="bg-red-500">Inactive</Badge>}
              {hospital.status === "Suspended" && <Badge className="bg-yellow-500">Suspended</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <Label className="text-sm font-medium text-gray-500">Address</Label>
        <p>{hospital.address || "Not provided"}</p>
      </div>

      {/* Description */}
      {hospital.description && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Description</Label>
          <p>{hospital.description}</p>
        </div>
      )}

      {/* Modules */}
      {hospital.modules && hospital.modules.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Active Modules</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {hospital.modules.map((module) => (
              <Badge key={module} variant="outline" className="capitalize">
                {module}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <Label className="text-sm font-medium text-gray-500">Branches</Label>
          <p>{hospital.branches}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Created</Label>
          <p>{hospital.createdAt}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Last Login</Label>
          <p>{hospital.lastLogin}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={() => window.open(`/${hospital.slug}/auth/login`, "_blank")}>
          Visit Hospital Login
        </Button>
        <Button variant="outline" onClick={() => window.open(`/${hospital.slug}/home`, "_blank")}>
          Visit Hospital Website
        </Button>
      </div>
    </div>
  )
}
