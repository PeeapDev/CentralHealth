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
      title: "Patient Management",
      description: "Complete patient records, history, and care coordination",
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
                  Healthcare Innovation
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Modern Hospital Management
                  <span className="text-blue-600 dark:text-blue-400"> Made Simple</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Streamline your healthcare operations with our comprehensive SaaS platform. Manage patients, staff,
                  and resources efficiently with enterprise-grade security.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/auth/login">Sign In</Link>
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
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
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
