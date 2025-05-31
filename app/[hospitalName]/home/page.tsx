"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Award,
  Heart,
  Shield,
  Stethoscope,
  Bed,
  Pill,
  TestTube,
  Scan,
  Droplet,
  Truck,
  UserCheck,
  ArrowRight,
} from "lucide-react"

// Demo hospital data
const hospitalData = {
  "smart-hospital": {
    name: "Smart Hospital & Research Center",
    tagline: "Advanced Healthcare with Compassionate Care",
    description:
      "Leading medical facility providing comprehensive healthcare services with state-of-the-art technology and experienced medical professionals.",
    logo: "/placeholder.svg?height=80&width=80",
    address: "123 Medical Center Dr, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "info@smarthospital.com",
    website: "www.smarthospital.com",
    established: "1985",
    beds: "500+",
    doctors: "150+",
    departments: "25+",
    rating: 4.8,
    accreditation: ["JCI Accredited", "ISO 9001:2015", "NABH Certified"],
    specialties: [
      "Cardiology",
      "Neurology",
      "Oncology",
      "Orthopedics",
      "Pediatrics",
      "Emergency Medicine",
      "Surgery",
      "Radiology",
    ],
    services: [
      { icon: Stethoscope, name: "OPD Services", description: "Comprehensive outpatient care" },
      { icon: Bed, name: "IPD Services", description: "24/7 inpatient care" },
      { icon: Pill, name: "Pharmacy", description: "Full-service pharmacy" },
      { icon: TestTube, name: "Laboratory", description: "Advanced diagnostic tests" },
      { icon: Scan, name: "Radiology", description: "Digital imaging services" },
      { icon: Truck, name: "Emergency", description: "24/7 emergency services" },
    ],
    hours: {
      emergency: "24/7",
      opd: "8:00 AM - 8:00 PM",
      pharmacy: "8:00 AM - 10:00 PM",
    },
  },
  "city-medical": {
    name: "City Medical Center",
    tagline: "Your Health, Our Priority",
    description:
      "Modern healthcare facility committed to providing excellent medical care with a patient-centered approach and cutting-edge medical technology.",
    logo: "/placeholder.svg?height=80&width=80",
    address: "456 Healthcare Ave, Los Angeles, CA 90210",
    phone: "+1 (555) 987-6543",
    email: "info@citymedical.com",
    website: "www.citymedical.com",
    established: "1992",
    beds: "350+",
    doctors: "120+",
    departments: "20+",
    rating: 4.6,
    accreditation: ["AAAHC Accredited", "ISO 14001:2015", "CARF Certified"],
    specialties: [
      "Internal Medicine",
      "Surgery",
      "Pediatrics",
      "Obstetrics",
      "Dermatology",
      "Psychiatry",
      "Rehabilitation",
      "Pathology",
    ],
    services: [
      { icon: Stethoscope, name: "General Medicine", description: "Primary healthcare services" },
      { icon: Heart, name: "Cardiology", description: "Heart care specialists" },
      { icon: Pill, name: "Pharmacy", description: "Medication management" },
      { icon: TestTube, name: "Diagnostics", description: "Comprehensive testing" },
      { icon: UserCheck, name: "Wellness", description: "Preventive care programs" },
      { icon: Truck, name: "Ambulance", description: "Emergency transport" },
    ],
    hours: {
      emergency: "24/7",
      opd: "7:00 AM - 9:00 PM",
      pharmacy: "7:00 AM - 11:00 PM",
    },
  },
  "general-hospital": {
    name: "General Hospital",
    tagline: "Caring for Our Community",
    description:
      "Community-focused hospital providing comprehensive healthcare services with a commitment to excellence, innovation, and compassionate patient care.",
    logo: "/placeholder.svg?height=80&width=80",
    address: "789 Health St, Chicago, IL 60601",
    phone: "+1 (555) 456-7890",
    email: "info@generalhospital.com",
    website: "www.generalhospital.com",
    established: "1978",
    beds: "400+",
    doctors: "130+",
    departments: "22+",
    rating: 4.7,
    accreditation: ["Joint Commission", "Magnet Recognition", "DNV GL Certified"],
    specialties: [
      "Family Medicine",
      "Emergency Medicine",
      "Surgery",
      "Radiology",
      "Anesthesiology",
      "Pathology",
      "Pharmacy",
      "Nursing",
    ],
    services: [
      { icon: Building2, name: "Multi-Specialty", description: "Comprehensive medical care" },
      { icon: Bed, name: "Inpatient Care", description: "Round-the-clock patient care" },
      { icon: Scan, name: "Imaging", description: "Advanced medical imaging" },
      { icon: TestTube, name: "Lab Services", description: "Clinical laboratory" },
      { icon: Droplet, name: "Blood Bank", description: "Blood donation & storage" },
      { icon: Shield, name: "Preventive Care", description: "Health screening programs" },
    ],
    hours: {
      emergency: "24/7",
      opd: "6:00 AM - 10:00 PM",
      pharmacy: "6:00 AM - 12:00 AM",
    },
  },
}

// Define types for hospital data
interface HospitalService {
  icon: any
  name: string
  description: string
}

interface HospitalData {
  name: string
  tagline: string
  description: string
  logo: string
  address: string
  phone: string
  email: string
  website: string
  established: string
  beds: string
  doctors: string
  departments: string
  rating: number
  accreditation: string[]
  specialties: string[]
  services: HospitalService[]
  hours: {
    emergency: string
    opd: string
    pharmacy: string
  }
}

export default function HospitalHomePage() {
  const params = useParams() || {}
  const hospitalSlug = (params.hospitalName as string) || ''
  const [hospital, setHospital] = useState<HospitalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  // Fetch hospital data from the API
  useEffect(() => {
    async function fetchHospitalData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/hospitals/${hospitalSlug}`)
        
        if (!response.ok) {
          throw new Error('Hospital not found')
        }
        
        const data = await response.json()
        setHospital(data)
        setError(false)
      } catch (err) {
        console.error('Error fetching hospital data:', err)
        setError(true)
        
        // Fall back to demo data if available
        const demoHospital = hospitalData[hospitalSlug as keyof typeof hospitalData]
        if (demoHospital) {
          setHospital(demoHospital)
          setError(false)
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchHospitalData()
  }, [hospitalSlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <h1 className="text-2xl font-bold mb-2">Loading Hospital Information</h1>
          <p className="text-muted-foreground">Please wait while we retrieve the hospital details...</p>
        </div>
      </div>
    )
  }
  
  if (error || !hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Hospital Not Found</h1>
          <p className="text-muted-foreground">The requested hospital could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src={hospital.logo || "/placeholder.svg"} alt={hospital.name} className="w-10 h-10 rounded-lg" />
              <div>
                <h1 className="font-bold text-lg">{hospital.name}</h1>
                <p className="text-sm text-muted-foreground">{hospital.tagline}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href={`/${hospitalSlug}/auth/login`}>Staff Login</Link>
              </Button>
              <Button asChild>
                <Link href="#contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <img
              src={hospital.logo || "/placeholder.svg"}
              alt={hospital.name}
              className="w-20 h-20 mx-auto mb-6 rounded-xl shadow-lg"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">{hospital.name}</h1>
            <p className="text-xl md:text-2xl text-blue-600 font-medium mb-6">{hospital.tagline}</p>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">{hospital.description}</p>
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="font-semibold">{hospital.rating}/5</span>
                <span className="text-muted-foreground">Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Est. {hospital.established}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">{hospital.beds}</div>
              <div className="text-blue-100">Hospital Beds</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">{hospital.doctors}</div>
              <div className="text-blue-100">Medical Professionals</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">{hospital.departments}</div>
              <div className="text-blue-100">Departments</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Emergency Services</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Comprehensive healthcare services for all your medical needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hospital.services.map((service: HospitalService, index: number) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Medical Specialties</h2>
            <p className="text-lg text-gray-600">Expert care across multiple medical disciplines</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hospital.specialties.map((specialty: string, index: number) => (
              <Badge key={index} variant="outline" className="p-2">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditation Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Accreditations & Certifications</h2>
            <p className="text-lg text-gray-600">Recognized for excellence in healthcare quality and safety</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {hospital.accreditation.map((cert: string, index: number) => (
              <Badge key={index} className="bg-green-100 text-green-800 hover:bg-green-200">
                <Award className="mr-1 h-3 w-3" />
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span>{hospital.address}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <span>{hospital.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span>{hospital.email}</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Operating Hours</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>Emergency Services</span>
                  </span>
                  <span className="text-green-400 font-semibold">{hospital.hours.emergency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>OPD Services</span>
                  </span>
                  <span>{hospital.hours.opd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Pill className="h-4 w-4 text-blue-400" />
                    <span>Pharmacy</span>
                  </span>
                  <span>{hospital.hours.pharmacy}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={hospital.logo || "/placeholder.svg"} alt={hospital.name} className="w-8 h-8 rounded" />
            <span className="font-semibold">{hospital.name}</span>
          </div>
          <p className="text-sm">© 2025 {hospital.name}. All rights reserved.</p>
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${hospitalSlug}/auth/login`} className="inline-flex items-center space-x-2">
                <span>Staff Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
