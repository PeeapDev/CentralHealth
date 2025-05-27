"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ChangeEvent, FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface HospitalFormData {
  name: string
  subdomain: string
  description: string
  admin_name: string
  admin_email: string
  admin_password: string
  settings: {
    max_users: number
    max_patients: number
    fhir_enabled: boolean
    fhir_server_url?: string
    fhir_auth_token?: string
  }
  branding: {
    logo?: string
    primary_color?: string
    secondary_color?: string
  }
}

export default function CreateHospitalPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<HospitalFormData>(() => ({
    name: "",
    subdomain: "",
    description: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    settings: {
      max_users: 10,
      max_patients: 1000,
      fhir_enabled: true,
      fhir_server_url: "http://localhost:8000/fhir",
      fhir_auth_token: ""
    },
    branding: {
      logo: "",
      primary_color: "#0f172a",
      secondary_color: "#64748b"
    }
  }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate FHIR settings if enabled
      if (formData.settings.fhir_enabled) {
        if (!formData.settings.fhir_server_url) {
          toast.error("FHIR server URL is required when FHIR is enabled")
          setIsLoading(false)
          return
        }
      }

      const response = await fetch("/api/hospitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Hospital created successfully")
        
        // Create subdomain URL
        const subdomain = formData.subdomain.toLowerCase().trim()
        const url = `https://${subdomain}.yourdomain.com`
        
        toast("Hospital system created", {
          description: `Your hospital system is ready at: ${url}`,
          action: {
            label: "Visit",
            onClick: () => window.open(url, "_blank")
          }
        })

        router.push("/superadmin/hospitals")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to create hospital")
      }
    } catch (error) {
      console.error("Error creating hospital:", error)
      toast.error("An error occurred while creating the hospital")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const [parent, child] = name.split('.')
    
    if (child) {
      setFormData((prev) => {
        const parentObj = prev[parent as keyof HospitalFormData] as Record<string, any>
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        }
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>, field: 'max_users' | 'max_patients') => {
    const value = parseInt(e.target.value) || 0
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }))
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          branding: {
            ...prev.branding,
            logo: reader.result as string
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Hospital</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hospital Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter hospital name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain *</Label>
              <Input
                id="subdomain"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleInputChange}
                placeholder="Enter subdomain"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter hospital description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Information */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin_name">Admin Name *</Label>
              <Input
                id="admin_name"
                name="admin_name"
                value={formData.admin_name}
                onChange={handleInputChange}
                placeholder="Enter admin name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email *</Label>
              <Input
                id="admin_email"
                name="admin_email"
                type="email"
                value={formData.admin_email}
                onChange={handleInputChange}
                placeholder="Enter admin email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_password">Admin Password *</Label>
              <Input
                id="admin_password"
                name="admin_password"
                type="password"
                value={formData.admin_password}
                onChange={handleInputChange}
                placeholder="Enter admin password"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_users">Maximum Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.settings.max_users}
                  onChange={(e) => handleNumberChange(e, 'max_users')}
                  min={1}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_patients">Maximum Patients</Label>
                <Input
                  id="max_patients"
                  type="number"
                  value={formData.settings.max_patients}
                  onChange={(e) => handleNumberChange(e, 'max_patients')}
                  min={1}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fhir_server_url">FHIR Server URL</Label>
              <Input
                id="fhir_server_url"
                name="settings.fhir_server_url"
                type="url"
                value={formData.settings.fhir_server_url}
                onChange={handleInputChange}
                placeholder="Enter FHIR server URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fhir_auth_token">FHIR Auth Token</Label>
              <Input
                id="fhir_auth_token"
                name="settings.fhir_auth_token"
                type="password"
                value={formData.settings.fhir_auth_token}
                onChange={handleInputChange}
                placeholder="Enter FHIR auth token"
              />
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
