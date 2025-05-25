import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { HospitalSidebar } from "@/components/hospital/hospital-sidebar"
import { HospitalHeader } from "@/components/hospital/hospital-header"

interface HospitalAdminLayoutProps {
  children: React.ReactNode
  params: { hospitalName: string }
}

export default function HospitalAdminLayout({ children, params }: HospitalAdminLayoutProps) {
  // Debug: Log the hospital name to verify routing
  console.log("Hospital Name from params:", params.hospitalName)

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <HospitalSidebar hospitalName={params.hospitalName} />
        <div className="flex-1 flex flex-col">
          <HospitalHeader hospitalName={params.hospitalName} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
