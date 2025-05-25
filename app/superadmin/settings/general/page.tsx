"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Save, Edit } from "lucide-react"

export default function GeneralSettingsPage() {
  const [formData, setFormData] = useState({
    hospitalName: "National Hospital & Research Center",
    hospitalCode: "ACT-487438",
    address: "25 Kings Street, CA",
    phone: "+232",
    email: "peeaphospital@gmail.com",
    language: "english",
    dateFormat: "mm/dd/yyyy",
    timeZone: "gmt-africa-freetown",
    currency: "SLL",
    currencySymbol: "Le",
    creditLimit: "20000",
    timeFormat: "12-hour",
    mobileAppUrl: "https://demo.smart-hospital.in/api/",
    primaryColor: "#424242",
    secondaryColor: "#eeeeee",
    doctorRestriction: "disabled",
    superadminVisibility: "enabled",
    patientPanel: "enabled",
    scanType: "barcode",
    currentTheme: "blue",
    region: "western-area",
    district: "freetown",
  })

  const sierraLeoneRegions = [
    { value: "western-area", label: "Western Area" },
    { value: "northern-province", label: "Northern Province" },
    { value: "southern-province", label: "Southern Province" },
    { value: "eastern-province", label: "Eastern Province" },
  ]

  const districts = {
    "western-area": ["Freetown", "Western Area Rural"],
    "northern-province": ["Bombali", "Falaba", "Koinadugu", "Kambia", "Karene"],
    "southern-province": ["Bo", "Bonthe", "Moyamba", "Pujehun"],
    "eastern-province": ["Kailahun", "Kenema", "Kono"],
  }

  const themes = [
    { name: "default", color: "bg-gray-100" },
    { name: "red", color: "bg-red-100" },
    { name: "blue", color: "bg-blue-100" },
    { name: "gray", color: "bg-gray-200" },
  ]

  const handleSave = () => {
    console.log("Saving general settings:", formData)
    alert("General settings saved successfully!")
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="General Settings"
        description="Welcome to General Settings - Configure general system settings and preferences"
        breadcrumbs={[{ label: "Home" }, { label: "System Settings" }, { label: "General Settings" }]}
      />

      <div className="space-y-6">
        {/* Hospital Information */}
        <Card>
          <CardHeader>
            <CardTitle>Hospital Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">
                  Hospital Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hospitalName"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalCode">Hospital Code</Label>
                <Input
                  id="hospitalCode"
                  value={formData.hospitalCode}
                  onChange={(e) => setFormData({ ...formData, hospitalCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Location Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">
                  Region <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value, district: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {sierraLeoneRegions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">
                  District <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => setFormData({ ...formData, district: value })}
                  disabled={!formData.region}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.region &&
                      districts[formData.region as keyof typeof districts]?.map((district) => (
                        <SelectItem key={district} value={district.toLowerCase().replace(" ", "-")}>
                          {district}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hospital Logos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Hospital Logo <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    SMART HOSPITAL
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Logo
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Hospital Small Logo <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    SH
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Small Logo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>
                Language <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="krio">Krio</SelectItem>
                  <SelectItem value="mende">Mende</SelectItem>
                  <SelectItem value="temne">Temne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Date Time Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Date Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Date Format <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.dateFormat}
                  onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm/dd/yyyy">mm/dd/yyyy</SelectItem>
                    <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
                    <SelectItem value="yyyy-mm-dd">yyyy-mm-dd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Time Zone <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.timeZone}
                  onValueChange={(value) => setFormData({ ...formData, timeZone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmt-africa-freetown">(GMT) Africa, Freetown</SelectItem>
                    <SelectItem value="gmt-africa-abidjan">(GMT) Africa, Abidjan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Currency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SLL">SLL - Sierra Leonean Leone</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Currency Symbol <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>
                  Credit Limit <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Time Format <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.timeFormat}
                  onValueChange={(value) => setFormData({ ...formData, timeFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12-hour">12 Hour</SelectItem>
                    <SelectItem value="24-hour">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              Mobile App{" "}
              <span className="text-sm text-green-600 font-normal">(Android App Purchase Code already registered)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mobile App API URL</Label>
              <Input
                value={formData.mobileAppUrl}
                onChange={(e) => setFormData({ ...formData, mobileAppUrl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile App Primary Color Code</Label>
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile App Secondary Color Code</Label>
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mobile App Logo</Label>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-orange-500 text-white">
                  SMART HOSPITAL
                </Badge>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit App Logo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Miscellaneous Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Miscellaneous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Doctor Restriction Mode</Label>
                <RadioGroup
                  value={formData.doctorRestriction}
                  onValueChange={(value) => setFormData({ ...formData, doctorRestriction: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="disabled" id="doctor-disabled" />
                    <Label htmlFor="doctor-disabled">Disabled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enabled" id="doctor-enabled" />
                    <Label htmlFor="doctor-enabled">Enabled</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Superadmin Visibility</Label>
                <RadioGroup
                  value={formData.superadminVisibility}
                  onValueChange={(value) => setFormData({ ...formData, superadminVisibility: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="disabled" id="super-disabled" />
                    <Label htmlFor="super-disabled">Disabled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enabled" id="super-enabled" />
                    <Label htmlFor="super-enabled">Enabled</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Patient Panel</Label>
                <RadioGroup
                  value={formData.patientPanel}
                  onValueChange={(value) => setFormData({ ...formData, patientPanel: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="disabled" id="patient-disabled" />
                    <Label htmlFor="patient-disabled">Disabled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enabled" id="patient-enabled" />
                    <Label htmlFor="patient-enabled">Enabled</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Scan Type</Label>
                <RadioGroup
                  value={formData.scanType}
                  onValueChange={(value) => setFormData({ ...formData, scanType: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="barcode" id="barcode" />
                    <Label htmlFor="barcode">Barcode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="qr-code" id="qr-code" />
                    <Label htmlFor="qr-code">QR Code</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Theme */}
        <Card>
          <CardHeader>
            <CardTitle>Current Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.name}
                  className={`relative cursor-pointer border-2 rounded-lg p-4 ${
                    formData.currentTheme === theme.name ? "border-blue-500" : "border-gray-200"
                  }`}
                  onClick={() => setFormData({ ...formData, currentTheme: theme.name })}
                >
                  <div className={`h-24 ${theme.color} rounded mb-2`}></div>
                  <div className="text-center text-sm font-medium capitalize">{theme.name}</div>
                  {formData.currentTheme === theme.name && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
