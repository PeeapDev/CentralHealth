import React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { HospitalSidebar } from "@/components/hospital/hospital-sidebar"
import { HospitalHeader } from "@/components/hospital/hospital-header"

interface HospitalAdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ hospitalName: string }> | { hospitalName: string }
}

export default function HospitalAdminLayout({ children, params }: HospitalAdminLayoutProps) {
  // Extract hospitalName using React.use for Promise params
  const { hospitalName } = params instanceof Promise ? React.use(params) : params
  
  // Debug: Log the hospital name to verify routing
  console.log("Hospital Name from params:", hospitalName)

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <HospitalSidebar hospitalName={hospitalName} />
        <div className="flex-1 flex flex-col">
          <HospitalHeader hospitalName={hospitalName} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
