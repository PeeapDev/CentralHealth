import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Users,
  Calendar,
  FileText,
  Shield,
  Zap,
  Heart,
  Stethoscope,
  ArrowRight,
  Code,
  Puzzle,
  Book,
  Smartphone,
} from "lucide-react"
import Link from "next/link"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export default async function HomePage() {
  const features = [
    {
      icon: Users,
      title: "Centralized Patient Registry",
      description: "Nationwide patient identification with unified medical records across all hospitals",
    },
    {
      icon: Calendar,
      title: "Appointment Scheduling",
      description: "Smart scheduling with automated reminders and conflicts resolution",
    },
    {
      icon: FileText,
      title: "Electronic Health Records",
      description: "Secure, compliant digital health records with easy access",
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Live patient vitals and hospital operations dashboard",
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security and compliance standards",
    },
    {
      icon: Zap,
      title: "Modular Plugins",
      description: "Extend functionality with custom plugins and integrations",
    },
  ]

  const demoAccounts = [
    {
      role: "SuperAdmin",
      email: "superadmin@medicore.com",
      password: "super123",
      description: "Manage multiple hospital instances",
      color: "bg-red-500",
    },
    {
      role: "Admin",
      email: "admin@hospital1.com",
      password: "admin123",
      description: "Hospital administration access",
      color: "bg-blue-500",
    },
    {
      role: "User",
      email: "doctor@hospital1.com",
      password: "user123",
      description: "Healthcare provider access",
      color: "bg-green-500",
    },
  ]

  const developerResources = [
    {
      icon: Code,
      title: "REST API Documentation",
      description: "Comprehensive API documentation with examples and testing tools",
      link: "/docs/api",
      badge: "API",
    },
    {
      icon: Smartphone,
      title: "Mobile SDK",
      description: "Flutter and React Native SDKs for mobile app development",
      link: "/docs/mobile-sdk",
      badge: "Mobile",
    },
    {
      icon: Puzzle,
      title: "Plugin Development",
      description: "Create custom modules and extensions for the platform",
      link: "/docs/plugins",
      badge: "Plugins",
    },
    {
      icon: Book,
      title: "Developer Guide",
      description: "Complete guide for integrating and extending the platform",
      link: "/docs/developer-guide",
      badge: "Docs",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div suppressHydrationWarning>
        <LandingHeader />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-blue-950/20 dark:via-background dark:to-green-950/20" />
        <div className="container relative px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">
                  <Heart className="w-3 h-3 mr-1" />
                  National Health Service
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Unified Healthcare
                  <span className="text-blue-600 dark:text-blue-400"> Across the Nation</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A centralized FHIR-compliant healthcare system that connects patients with hospitals nationwide.
                  One medical number, one patient record, accessible at any participating healthcare facility.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Register as a Patient
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/">Hospital Login</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-lg blur-3xl opacity-20" />
                <Card className="relative w-full max-w-md">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                      <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>MediCore Dashboard</CardTitle>
                    <CardDescription>Real-time hospital operations overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">1,247</div>
                        <div className="text-sm text-muted-foreground">Active Patients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">98.5%</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">
              Everything you need to manage healthcare
            </h2>
            <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed">
              Comprehensive tools designed specifically for modern healthcare facilities
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden group transition-all duration-300">
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-500 to-green-500 group-hover:w-full transition-all duration-300" />
                <CardHeader>
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{feature.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Resources Section */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Code className="w-3 h-3 mr-1" />
              For Developers
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">Build with our Platform</h2>
            <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed">
              Comprehensive APIs, SDKs, and documentation for developers to extend and integrate
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 max-w-4xl mx-auto">
            {developerResources.map((resource, index) => (
              <Card key={index} className="relative group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <resource.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <Badge variant="secondary">{resource.badge}</Badge>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription className="mb-4">{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={resource.link}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* API Testing Link */}
          <div className="text-center mt-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Activity className="h-5 w-5" />
                  Test Our APIs
                </CardTitle>
                <CardDescription>Interactive API testing dashboard with live examples</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/api-test">
                    Open API Testing Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Offline Application Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-blue-950/20 dark:via-background dark:to-green-950/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Smartphone className="w-3 h-3 mr-1" />
              Offline Access
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">Work Anywhere, Anytime</h2>
            <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed">
              Download our desktop application for seamless offline access to your patients and records
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* App Features */}
            <div className="col-span-full md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Key Features</CardTitle>
                  <CardDescription>Why use our offline application?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-100 rounded-md dark:bg-blue-900">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Work Without Internet</p>
                      <p className="text-muted-foreground text-sm">Full functionality even with no connectivity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-100 rounded-md dark:bg-blue-900">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Secure Local Data</p>
                      <p className="text-muted-foreground text-sm">Encrypted SQLite storage with session protection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-100 rounded-md dark:bg-blue-900">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Automatic Sync</p>
                      <p className="text-muted-foreground text-sm">Changes sync automatically when online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Download Options */}
            <div className="col-span-full md:col-span-1 md:row-span-2">
              <Card className="relative h-full overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-500/10 rounded-full blur-2xl" />
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Download Offline Application</CardTitle>
                  <CardDescription>Version 1.0.0 | Released June 1, 2025</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-3">
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/downloads/medicore-windows-v1.0.0.exe">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <rect x="2" y="2" width="12" height="12" rx="2" />
                          <path d="M2 8h12M8 2v12" />
                        </svg>
                        Windows (64-bit)
                      </Link>
                    </Button>
                    <Button className="w-full" variant="outline" size="lg" asChild>
                      <Link href="/downloads/medicore-mac-v1.0.0.dmg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <circle cx="8" cy="8" r="6" />
                          <path d="M8 5v3M8 11h.01" />
                        </svg>
                        macOS (Intel/Apple Silicon)
                      </Link>
                    </Button>
                    <Button className="w-full" variant="outline" size="lg" asChild>
                      <Link href="/downloads/medicore-linux-v1.0.0.deb">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <polygon points="8 2 2 8 8 14 14 8" />
                        </svg>
                        Linux (.deb)
                      </Link>
                    </Button>
                  </div>
                  <div className="pt-2 text-center">
                    <Link href="/download/release-notes" className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                      View Release Notes
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Requirements */}
            <div className="col-span-full md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>System Requirements</CardTitle>
                  <CardDescription>Minimum specs needed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium">Windows:</p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Windows 10 or newer</li>
                      <li>4GB RAM minimum</li>
                      <li>500MB disk space</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">macOS:</p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>macOS 12 or newer</li>
                      <li>4GB RAM minimum</li>
                      <li>500MB disk space</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Linux:</p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Ubuntu 20.04+ or equivalent</li>
                      <li>4GB RAM minimum</li>
                      <li>500MB disk space</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Accounts Section */}
      <section className="py-20 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Try Demo
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">Test Drive with Demo Accounts</h2>
            <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed">
              Experience different user roles and permissions with our pre-configured demo accounts
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 max-w-4xl mx-auto">
            {demoAccounts.map((account, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${account.color}`} />
                    <CardTitle className="text-lg">{account.role}</CardTitle>
                  </div>
                  <CardDescription className="mb-4">{account.description}</CardDescription>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>
                      <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">{account.email}</code>
                    </div>
                    <div>
                      <span className="font-medium">Password:</span>
                      <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">{account.password}</code>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/auth/login">Login as {account.role}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Ready to transform your healthcare facility?
            </h2>
            <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl/relaxed">
              Join thousands of healthcare providers who trust MediCore for their operations
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div suppressHydrationWarning>
        <LandingFooter />
      </div>
    </div>
  )
}
