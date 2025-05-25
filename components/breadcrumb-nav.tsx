"use client"

import type React from "react"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function BreadcrumbNav({ items, className = "" }: BreadcrumbNavProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/", icon: <Home className="w-4 h-4" /> }]

    let currentPath = ""

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Format segment name
      let label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      // Special cases for better naming
      if (segment === "superadmin") label = "Super Admin"
      if (segment === "api-keys") label = "API Keys"
      if (segment === "opd") label = "OPD"
      if (segment === "ipd") label = "IPD"
      if (segment === "bloodbank") label = "Blood Bank"
      if (segment === "api-test") label = "API Testing"

      // Don't make the last item clickable
      const href = index === segments.length - 1 ? undefined : currentPath

      breadcrumbs.push({ label, href })
    })

    return breadcrumbs
  }

  const breadcrumbItems = items || generateBreadcrumbs()

  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link href={item.href} className="flex items-center space-x-1 hover:text-foreground transition-colors">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center space-x-1 text-foreground font-medium">
              {item.icon}
              <span>{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
