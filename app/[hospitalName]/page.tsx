import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { 
  CalendarRange, 
  Clock, 
  Heart, 
  Mail, 
  MapPin, 
  Phone, 
  Shield, 
  User, 
  DollarSign,
  Stethoscope,
  Bed,
  Pill,
  TestTube,
  Scan,
  Droplet,
  Truck
} from 'lucide-react'

async function getHospitalBySlug(hospitalName: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/hospitals/${hospitalName}`, {
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

// Helper function to check if a module is enabled
function isModuleEnabled(hospital: any, moduleName: string) {
  if (!hospital || !hospital.modules) return false;
  return hospital.modules.includes(moduleName.toLowerCase());
}

export default async function HospitalPage({ params }: { params: { hospitalName: string } }) {
  const hospital = await getHospitalBySlug(params.hospitalName)

  if (!hospital) {
    notFound()
  }
  
  // Get a list of enabled modules for the hospital
  const enabledModules = hospital.modules || []

  // Generate features based on enabled modules
  const moduleFeatures: { [key: string]: { name: string; icon: any; description: string } } = {
    'billing': { name: "Streamlined Billing", icon: DollarSign, description: "Our advanced billing system ensures transparency and convenience for all patients." },
    'appointment': { name: "Easy Appointments", icon: CalendarRange, description: "Book appointments online or via phone with our efficient scheduling system." },
    'opd': { name: "OutPatient Services", icon: Stethoscope, description: "Comprehensive outpatient care with minimal wait times." },
    'ipd': { name: "InPatient Excellence", icon: Bed, description: "Comfortable accommodations and round-the-clock care for admitted patients." },
    'pharmacy': { name: "In-House Pharmacy", icon: Pill, description: "Convenient access to medications with expert pharmacist consultation." },
    'pathology': { name: "Advanced Pathology", icon: TestTube, description: "State-of-the-art laboratory services for accurate and timely diagnostics." },
    'radiology': { name: "Modern Imaging", icon: Scan, description: "The latest in radiological technology for precise diagnosis." },
    'bloodbank': { name: "Blood Bank Services", icon: Droplet, description: "Safe and reliable blood banking with quick processing times." },
    'ambulance': { name: "24/7 Emergency", icon: Truck, description: "Rapid response ambulance service available around the clock." }
  }
  
  // Filter features based on enabled modules
  const features = enabledModules
    .map((module: string) => moduleFeatures[module.toLowerCase()])
    .filter(Boolean)
  
  // Add some default features if we don't have enough from modules
  if (features.length < 2) {
    features.push({ name: "Patient-Centered Care", icon: User, description: "Our focus is on providing personalized, compassionate care to every patient." })
    features.push({ name: "Qualified Specialists", icon: Shield, description: "Our team of healthcare professionals is dedicated to excellence in medical care." })
  }

  const stats = [
    { name: "Years Experience", value: "25+" },
    { name: "Skilled Doctors", value: "120+" },
    { name: "Happy Patients", value: "15K+" },
    { name: "Success Rate", value: "98%" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/30 dark:via-background dark:to-blue-950/30 pt-16 pb-20 lg:pb-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center px-3 py-1 mb-2 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  Healthcare Excellence for Sierra Leone
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  {hospital.name}
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  {hospital.description || "A leading healthcare provider offering exceptional medical services and patient care."}
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href={`/${params.hospitalName}/auth/login`}>
                    Access Patient Portal
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#appointments">Book Appointment</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((stat, i) => (
                  <Card key={i} className="text-center">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">{stat.value}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{stat.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative h-[450px] w-full overflow-hidden rounded-xl">
                <Image 
                  src={hospital.logo || "/placeholder.svg"} 
                  alt={`${hospital.name} building`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-background py-12">
        <div className="container px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Our Services</h2>
            <p className="mt-2 text-muted-foreground">We provide specialized healthcare services tailored to your needs</p>
          </div>
          <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-${Math.min(features.length, 4)}`}>
            {features.map((feature: any, i: number) => {
              const Icon = feature.icon
              return (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="mt-3">{feature.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Contact Us</h2>
            <p className="mt-2 text-muted-foreground">We're here to help with all your healthcare needs</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" /> Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{hospital.address || "123 Medical Center Dr"}</p>
                <p>{hospital.city || "Freetown"}, {hospital.state || "Western Area"}</p>
                <p>{hospital.zip || "00000"}, {hospital.country || "Sierra Leone"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" /> Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Main: {hospital.phone || "+232 76 123456"}</p>
                <p>Emergency: +232 77 EMERGENCY</p>
                <p>Appointments: +232 78 BOOKING</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" /> Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>General: {hospital.email || "info@hospital.com"}</p>
                <p>Appointments: appointments@hospital.com</p>
                <p>Support: support@hospital.com</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="appointments" className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to schedule your visit?</h2>
          <p className="mb-8 text-primary-foreground/80 max-w-md mx-auto">
            Our team of healthcare professionals is ready to provide you with the care you deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href={`/${params.hospitalName}/auth/login`}>Patient Login</Link>
            </Button>
            {isModuleEnabled(hospital, 'appointment') && (
              <Button size="lg" variant="outline" className="bg-transparent" asChild>
                <Link href={`/${params.hospitalName}/appointments`}>Book Appointment</Link>
              </Button>
            )}
            <Button size="lg" variant="outline" className="bg-transparent" asChild>
              <Link href="#contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12 border-t">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">{hospital.name}</h3>
              <p className="text-muted-foreground">
                Providing quality healthcare services with compassion and expertise.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Services</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Doctors</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Departments</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Departments</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Cardiology</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Orthopedics</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Pediatrics</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Neurology</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Hours</h3>
              <ul className="space-y-2">
                <li className="text-muted-foreground">Mon - Fri: 8:00 AM - 8:00 PM</li>
                <li className="text-muted-foreground">Saturday: 9:00 AM - 6:00 PM</li>
                <li className="text-muted-foreground">Sunday: 10:00 AM - 4:00 PM</li>
                <li className="font-semibold">Emergency: 24/7</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} {hospital.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
