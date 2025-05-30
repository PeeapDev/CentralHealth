"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserSidebar } from "@/components/dashboard/user-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (!auth) {
      router.push("/auth/login")
      return
    }

    const { user } = JSON.parse(auth)
    // Allow any authenticated user (doctor, nurse, staff, etc.)
    if (!user.role || user.role === "superadmin") {
      router.push("/auth/login")
      return
    }

    setIsAuthorized(true)
  }, [router])

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
