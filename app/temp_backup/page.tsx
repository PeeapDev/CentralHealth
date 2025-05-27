import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarRange, Clock, Heart, Mail, MapPin, Phone, Shield, User } from 'lucide-react'

async function getHospitalBySlug(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/hospitals/${slug}`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching hospital:', error)
    return null
  }
}

export default async function HospitalPage({ params }: { params: { slug: string } }) {
  const hospitalData = await getHospitalBySlug(params.slug)

  if (!hospitalData) {
    notFound()
  }

  const hospital = hospitalData.hospital || hospitalData

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{hospital.name}</h1>
              <p className="text-blue-100 text-lg md:text-xl max-w-2xl mb-6">
                {hospital.description || 'A modern healthcare facility committed to providing exceptional care to our patients.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  <Link href={`/${params.slug}/patients/register`}>
                    <User className="mr-2 h-5 w-5" />
                    Patient Portal
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-blue-600">
                  <Link href={`/${params.slug}/appointments/book`}>
                    <CalendarRange className="mr-2 h-5 w-5" />
                    Book Appointment
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative h-40 w-40 md:h-56 md:w-56 bg-white p-4 rounded-full shadow-lg">
                <Image
                  src={hospital.logo || '/hospital-logo-placeholder.svg'}
                  alt={`${hospital.name} Logo`}
                  fill
                  className="object-contain p-4"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Contact Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Get in touch with {hospital.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hospital.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-blue-600" />
                    <span>{hospital.phone}</span>
                  </div>
                )}
                {hospital.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-blue-600" />
                    <span>{hospital.email}</span>
                  </div>
                )}
                {hospital.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                    <span>{hospital.address}{hospital.city ? `, ${hospital.city}` : ''}{hospital.state ? `, ${hospital.state}` : ''}{hospital.zip ? ` ${hospital.zip}` : ''}</span>
                  </div>
                )}
                {hospital.website && (
                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={hospital.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>When you can visit us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Monday - Friday</span>
                  <span>8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Saturday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sunday</span>
                  <span>9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex items-center pt-2 text-blue-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">Emergency services available 24/7</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Services */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Our Services</CardTitle>
                <CardDescription>Comprehensive healthcare services offered at {hospital.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                    <div className="rounded-full bg-blue-100 p-2 mr-4">
                      <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Primary Care</h3>
                      <p className="text-sm text-gray-500">Comprehensive health assessment and preventive care services</p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                    <div className="rounded-full bg-blue-100 p-2 mr-4">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Emergency Care</h3>
                      <p className="text-sm text-gray-500">24/7 emergency medical services with advanced life support</p>
                    </div>
                  </div>

                  {/* Add more service cards based on hospital.modules */}
                  {hospital.modules && hospital.modules.includes('appointment') && (
                    <div className="flex items-start p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                      <div className="rounded-full bg-blue-100 p-2 mr-4">
                        <CalendarRange className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">Appointment Scheduling</h3>
                        <p className="text-sm text-gray-500">Convenient online and phone booking for all departments</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/${params.slug}/services`}>
                    View All Services
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Staff Login Card */}
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-2">Staff Resources</h3>
              <p className="text-gray-500 mb-4">Secure access for authorized personnel only</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href={`/${params.slug}/auth/login`}>
                    Staff Login
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/${params.slug}/staff/resources`}>
                    Resource Portal
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
