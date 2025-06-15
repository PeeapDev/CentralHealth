import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Check } from "lucide-react"
import Link from "next/link"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function ReleaseNotesPage() {
  // Release notes data
  const currentVersion = "1.0.0"
  const releaseDate = "June 1, 2025"
  
  const releaseNotes = [
    {
      version: "1.0.0",
      date: "June 1, 2025",
      title: "Initial Release",
      highlights: [
        "Offline access to patient records",
        "Automatic data synchronization",
        "Secure local authentication",
        "Cross-platform support (Windows, macOS, Linux)",
        "Real-time sync status indicators"
      ],
      details: [
        {
          category: "Core Features",
          items: [
            "Complete patient management in offline mode",
            "Medical records access and editing while offline",
            "Appointment scheduling with sync resolution",
            "User role-based access control (RBAC)",
            "Encrypted local database with SQLite"
          ]
        },
        {
          category: "Security",
          items: [
            "Session expiration after configurable time period",
            "Password-based offline authentication",
            "Sensitive data encryption at rest",
            "Automatic logout on extended inactivity"
          ]
        },
        {
          category: "Performance",
          items: [
            "Optimized cold start time (<3 seconds)",
            "Reduced memory usage (~200MB)",
            "Background sync with negligible performance impact",
            "Intelligent data prefetching"
          ]
        },
      ]
    },
    {
      version: "0.9.1 (Beta)",
      date: "May 15, 2025",
      title: "Final Beta Release",
      highlights: [
        "Bug fixes and stability improvements",
        "Performance optimizations",
        "UI refinements based on beta tester feedback"
      ],
      details: [
        {
          category: "Bug Fixes",
          items: [
            "Fixed sync conflict resolution edge cases",
            "Resolved authentication token persistence issues",
            "Fixed UI layout problems on Linux distributions",
            "Corrected timestamp handling across timezones"
          ]
        }
      ]
    },
    {
      version: "0.9.0 (Beta)",
      date: "April 30, 2025",
      title: "Public Beta Release",
      highlights: [
        "First public beta release",
        "Core functionality complete",
        "Limited to selected beta testers"
      ],
      details: []
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div suppressHydrationWarning>
        <LandingHeader />
      </div>

      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/downloads/medicore-windows-v1.0.0.exe">
                <Download className="mr-2 h-4 w-4" />
                Download Latest Version
              </Link>
            </Button>
          </div>
          
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">MediCore Offline App</h1>
            <p className="text-muted-foreground">Release Notes and Version History</p>
          </div>

          <div className="space-y-12">
            {releaseNotes.map((release, index) => (
              <Card key={index} className={index === 0 ? "border-blue-200 shadow-md" : ""}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold">{release.version}</h2>
                        {index === 0 && <Badge>Latest</Badge>}
                      </div>
                      <CardDescription>{release.date} - {release.title}</CardDescription>
                    </div>
                    
                    {index === 0 && (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/downloads/medicore-windows-v1.0.0.exe">Windows</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/downloads/medicore-mac-v1.0.0.dmg">macOS</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/downloads/medicore-linux-v1.0.0.deb">Linux</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Highlights */}
                  {release.highlights.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Highlights</h3>
                      <ul className="space-y-2">
                        {release.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-1" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Detailed changes by category */}
                  {release.details.map((category, i) => (
                    <div key={i}>
                      <h3 className="font-semibold mb-3">{category.category}</h3>
                      <ul className="space-y-2 text-sm">
                        {category.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-foreground rounded-full mt-2" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="font-semibold mb-4">Need Help?</h3>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              If you encounter any issues with the offline application, please contact our support team
              or check the documentation for troubleshooting guides.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/support">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
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
