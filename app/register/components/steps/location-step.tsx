"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PatientFormData } from "../multi-step-form"
import { toast } from "sonner"

// Sierra Leone districts with regions
const SIERRA_LEONE_DISTRICTS = [
  "Western Area Urban",
  "Western Area Rural",
  "Bo",
  "Bombali",
  "Bonthe",
  "Falaba",
  "Kailahun",
  "Kambia",
  "Karene",
  "Kenema",
  "Koinadugu",
  "Kono",
  "Moyamba",
  "Port Loko",
  "Pujehun",
  "Tonkolili"
]

// Group districts by region
type RegionKey = "Northern" | "Southern" | "Eastern" | "Western"
const SIERRA_LEONE_REGIONS: Record<RegionKey, string[]> = {
  "Northern": ["Bombali", "Kambia", "Karene", "Koinadugu", "Port Loko", "Tonkolili", "Falaba"],
  "Southern": ["Bo", "Bonthe", "Moyamba", "Pujehun"],
  "Eastern": ["Kailahun", "Kenema", "Kono"],
  "Western": ["Western Area Urban", "Western Area Rural"]
}

// Sierra Leone cities by district
const SIERRA_LEONE_CITIES: Record<string, string[]> = {
  "Western Area Urban": ["Freetown", "Hastings", "Kissy", "Waterloo", "Aberdeen", "Goderich", "Murray Town", "Congo Town"],
  "Western Area Rural": ["Waterloo", "Newton", "Kent", "York", "Hamilton", "Sussex", "Tombo", "Gbaneh"],
  "Bo": ["Bo", "Koribondo", "Tikonko", "Yamandu", "Baoma", "Bumpeh", "Kakua", "Lugbu"],
  "Bombali": ["Makeni", "Kamabai", "Kamalo", "Binkolo", "Kalangba", "Kamaranka", "Mamaka", "Mapaki"],
  "Bonthe": ["Bonthe", "Mattru Jong", "Sahn", "Gbangbatoke", "Bendu", "Tihun", "Mokaba", "York Island"],
  "Falaba": ["Mongo", "Falaba", "Senkunia", "Kondembaia", "Musaia", "Bafodia", "Sinkunia", "Kurubonla"],
  "Kailahun": ["Kailahun", "Pendembu", "Segbwema", "Daru", "Koindu", "Buedu", "Mobai", "Baiwala"],
  "Kambia": ["Kambia", "Rokupr", "Kukuna", "Madina", "Kamakwie", "Kassiri", "Mange", "Barmoi"],
  "Karene": ["Kamakwie", "Batkanu", "Gbinti", "Kamaron", "Makakura", "Rogbere", "Magburaka", "Mateboi"],
  "Kenema": ["Kenema", "Blama", "Tongo", "Panguma", "Segbwema", "Giehun", "Boajibu", "Lalehun"],
  "Koinadugu": ["Kabala", "Sinkunia", "Falaba", "Musaia"],
  "Kono": ["Koidu", "Yengema", "Tombodu", "Motema"],
  "Moyamba": ["Moyamba", "Shenge", "Bradford", "Rotifunk"],
  "Port Loko": ["Port Loko", "Lunsar", "Maforki", "Lungi"],
  "Pujehun": ["Pujehun", "Zimmi", "Bandajuma", "Potoru"],
  "Tonkolili": ["Magburaka", "Matotoka", "Mabonto", "Mile 91"]
}

interface LocationStepProps {
  formData: PatientFormData
  updateFormData: (data: Partial<PatientFormData>) => void
}

export function LocationStep({ formData, updateFormData }: LocationStepProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | "all-regions" | "">("")
  const [filteredDistricts, setFilteredDistricts] = useState<string[]>(SIERRA_LEONE_DISTRICTS)
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [manualAddress, setManualAddress] = useState('')

  useEffect(() => {
    if (selectedRegion && selectedRegion !== 'all-regions') {
      setFilteredDistricts(SIERRA_LEONE_REGIONS[selectedRegion])
      if (formData.district && !SIERRA_LEONE_REGIONS[selectedRegion].includes(formData.district)) {
        updateFormData({ district: '', city: '' })
      }
    } else {
      setFilteredDistricts(SIERRA_LEONE_DISTRICTS)
    }
  }, [selectedRegion, formData.district, updateFormData])

  useEffect(() => {
    if (formData.district) {
      setAvailableCities(SIERRA_LEONE_CITIES[formData.district] || [])
      if (formData.city && !SIERRA_LEONE_CITIES[formData.district]?.includes(formData.city)) {
        updateFormData({ city: '' })
      }
    } else {
      setAvailableCities([])
    }
  }, [formData.district, updateFormData])

  const getCurrentLocation = () => {
    updateFormData({
      addressLine: "Default Street Address",
      city: "Freetown", 
      district: "Western Area Urban"
    })
    toast.success("Location set to default address in Freetown")
  }

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualAddress(value)
    if (value.length > 3) {
      const mockSuggestions = [
        `${value}, Freetown, Western Area Urban`,
        `${value}, Bo, Southern Province`,
        `${value}, Kenema, Eastern Province`,
        `${value}, Makeni, Northern Province`
      ]
      setAddressSuggestions(mockSuggestions)
      setShowSuggestions(true)
    } else {
      setAddressSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setManualAddress(suggestion)
    setShowSuggestions(false)
    const parts = suggestion.split(', ')
    if (parts.length >= 3) {
      updateFormData({
        addressLine: parts[0],
        city: parts[1],
        district: parts[2].split(' ')[0] 
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="addressLine">Street Address</Label>
        <Input
          id="addressLine"
          placeholder="Enter your street address"
          value={formData.addressLine}
          onChange={(e) => updateFormData({ addressLine: e.target.value })}
          required
        />
      </div>
      
      <div className="p-1 space-y-4">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={getCurrentLocation}
          >
            Use My Current Location
          </Button>
        </div>
      </div>
      
      {/* Manual address input with suggestions */}
      <div className="relative">
        <Label htmlFor="manualAddress">Or enter your address manually</Label>
        <Input
          id="manualAddress"
          placeholder="Start typing your address..."
          value={manualAddress}
          onChange={handleManualAddressChange}
          className="mt-1"
        />
        
        {/* Address suggestions dropdown */}
        {showSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <ul className="py-1">
              {addressSuggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="region">Region of Sierra Leone</Label>
        <Select
          value={selectedRegion}
          onValueChange={(value) => setSelectedRegion(value as RegionKey | "")}
        >
          <SelectTrigger id="region">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-regions">All Regions</SelectItem>
            {Object.keys(SIERRA_LEONE_REGIONS).map((region) => (
              <SelectItem key={region} value={region}>
                {region} Region
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Select a region to filter districts</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Select
            value={formData.district}
            onValueChange={(value) => updateFormData({ district: value })}
          >
            <SelectTrigger id="district">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {filteredDistricts.length > 0 ? (
                filteredDistricts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-districts-available">No districts available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">City/Town</Label>
          <Select
            value={formData.city}
            onValueChange={(value) => updateFormData({ city: value })}
            disabled={!formData.district || availableCities.length === 0}
          >
            <SelectTrigger id="city">
              <SelectValue placeholder={!formData.district ? "Select district first" : "Select city/town"} />
            </SelectTrigger>
            <SelectContent>
              {availableCities.length > 0 ? (
                availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-cities-available">No cities available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="postalCode">Postal Code (Optional)</Label>
        <Input
          id="postalCode"
          placeholder="Enter postal code if available"
          value={formData.postalCode}
          onChange={(e) => updateFormData({ postalCode: e.target.value })}
        />
      </div>
      
      {/* Map removed to fix form progression issues */}
      <div className="rounded-md border bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Map functionality has been temporarily disabled.
          Please enter your address information manually.
        </p>
      </div>
    </div>
  )
}
