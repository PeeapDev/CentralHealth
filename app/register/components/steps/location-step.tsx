"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientFormData } from "../multi-step-form"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { MapPin, Loader2 } from "lucide-react"
import Script from "next/script"

// Sierra Leone districts
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

// Sierra Leone cities by district
const SIERRA_LEONE_CITIES: Record<string, string[]> = {
  "Western Area Urban": ["Freetown", "Hastings", "Kissy", "Waterloo"],
  "Western Area Rural": ["Waterloo", "Newton", "Kent", "York"],
  "Bo": ["Bo", "Koribondo", "Tikonko", "Yamandu"],
  "Bombali": ["Makeni", "Kamabai", "Kamalo", "Binkolo"],
  "Bonthe": ["Bonthe", "Mattru Jong", "Sahn"],
  "Falaba": ["Mongo", "Falaba", "Senkunia"],
  "Kailahun": ["Kailahun", "Pendembu", "Segbwema", "Daru"],
  "Kambia": ["Kambia", "Rokupr", "Kukuna", "Madina"],
  "Karene": ["Kamakwie", "Batkanu", "Gbinti", "Kamaron"],
  "Kenema": ["Kenema", "Blama", "Tongo", "Panguma"],
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
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [availableCities, setAvailableCities] = useState<string[]>([])
  
  // Update available cities when district changes
  useEffect(() => {
    if (formData.district) {
      setAvailableCities(SIERRA_LEONE_CITIES[formData.district] || [])
      
      // If current city is not in the new district, reset it
      if (formData.city && !SIERRA_LEONE_CITIES[formData.district]?.includes(formData.city)) {
        updateFormData({ city: '' })
      }
    } else {
      setAvailableCities([])
    }
  }, [formData.district, updateFormData])
  
  // Initialize Google Maps when script loads
  const handleGoogleMapsLoaded = () => {
    setIsMapLoaded(true)
    
    // Initialize map if we already have coordinates
    if (formData.latitude && formData.longitude) {
      initializeMap(formData.latitude, formData.longitude)
    }
  }
  
  // Initialize the map with a marker
  const initializeMap = (lat: number, lng: number) => {
    // Check if Google Maps is loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      // Get the map element
      const mapElement = document.getElementById('location-map')
      if (!mapElement) return
      
      // Create the map
      const map = new google.maps.Map(mapElement, {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
      })
      
      // Add a marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
        title: 'Your location'
      })
      
      // Update coordinates when marker is dragged
      google.maps.event.addListener(marker, 'dragend', function() {
        const position = marker.getPosition()
        if (position) {
          updateFormData({
            latitude: position.lat(),
            longitude: position.lng()
          })
          
          // Reverse geocode to update address
          reverseGeocode(position.lat(), position.lng())
        }
      })
    }
  }
  
  // Get user's current location
  const getCurrentLocation = () => {
    setIsLocating(true)
    setMapError(null)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          
          // Update form data with coordinates
          updateFormData({
            latitude,
            longitude
          })
          
          // Initialize map with user location
          initializeMap(latitude, longitude)
          
          // Use reverse geocoding to get address details
          reverseGeocode(latitude, longitude)
          
          setIsLocating(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setMapError('Could not access your location. Please enter your address manually.')
          setIsLocating(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setMapError('Geolocation is not supported by your browser')
      setIsLocating(false)
    }
  }
  
  // Reverse geocode coordinates to get address
  const reverseGeocode = (lat: number, lng: number) => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      const geocoder = new google.maps.Geocoder()
      
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const addressComponents = results[0].address_components
          
          // Extract address details
          let street = ''
          let city = ''
          let district = ''
          let postalCode = ''
          
          addressComponents.forEach(component => {
            const types = component.types
            
            if (types.includes('route')) {
              street = component.long_name
            } else if (types.includes('locality')) {
              city = component.long_name
            } else if (types.includes('administrative_area_level_2')) {
              district = component.long_name
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name
            }
          })
          
          // Update address fields
          updateFormData({
            addressLine: street || results[0].formatted_address,
            city: city || '',
            postalCode: postalCode || ''
          })
          
          // Try to match with Sierra Leone districts
          if (district) {
            const matchedDistrict = SIERRA_LEONE_DISTRICTS.find(d => 
              district.toLowerCase().includes(d.toLowerCase()) || 
              d.toLowerCase().includes(district.toLowerCase())
            )
            
            if (matchedDistrict) {
              updateFormData({ district: matchedDistrict })
            }
          }
        } else {
          console.error('Geocoder failed:', status)
        }
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
              {SIERRA_LEONE_DISTRICTS.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
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
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
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
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Your Location on Map</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLocating || !isMapLoaded}
          >
            {isLocating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Use My Current Location
              </>
            )}
          </Button>
        </div>
        
        {mapError && (
          <p className="text-sm text-destructive">{mapError}</p>
        )}
        
        {/* Google Maps container */}
        <div 
          id="location-map" 
          className="w-full h-[300px] rounded-md border bg-muted"
        >
          {!isMapLoaded && (
            <div className="h-full flex flex-col items-center justify-center">
              <Skeleton className="h-full w-full" />
              <p className="text-sm text-muted-foreground absolute">Loading map...</p>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Drag the marker to adjust your exact location. This information will be used to improve healthcare services in your area.
        </p>
      </div>
      
      {/* Load Google Maps API */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={handleGoogleMapsLoaded}
        strategy="afterInteractive"
      />
    </div>
  )
}
