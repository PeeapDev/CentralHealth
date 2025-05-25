"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  Stethoscope,
  Bed,
  Pill,
  TestTube,
  Scan,
  Droplet,
  Truck,
  Building,
  FileText,
  Users,
  Clock,
  CalendarDays,
  UserPlus,
  Shield,
  DollarSign,
  MessageSquare,
  BarChart3,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface HospitalSidebarProps {
  hospitalName: string
}

export function HospitalSidebar({ hospitalName }: HospitalSidebarProps) {
  const pathname = usePathname()
  const [isReportsOpen, setIsReportsOpen] = useState(false)

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: `/${hospitalName}/admin` },
    { icon: CreditCard, label: "Billing", href: `/${hospitalName}/admin/billing` },
    { icon: Calendar, label: "Appointment", href: `/${hospitalName}/admin/appointment` },
    { icon: Stethoscope, label: "OPD - Out Patient", href: `/${hospitalName}/admin/opd` },
    { icon: Bed, label: "IPD - In Patient", href: `/${hospitalName}/admin/ipd` },
    { icon: Pill, label: "Pharmacy", href: `/${hospitalName}/admin/pharmacy` },
    { icon: TestTube, label: "Pathology", href: `/${hospitalName}/admin/pathology` },
    { icon: Scan, label: "Radiology", href: `/${hospitalName}/admin/radiology` },
    { icon: Droplet, label: "Blood Bank", href: `/${hospitalName}/admin/blood-bank` },
    { icon: Truck, label: "Ambulance", href: `/${hospitalName}/admin/ambulance` },
    { icon: Building, label: "Front Office", href: `/${hospitalName}/admin/front-office` },
    { icon: FileText, label: "Birth & Death Record", href: `/${hospitalName}/admin/birth-death` },
    { icon: Users, label: "Human Resource", href: `/${hospitalName}/admin/hr` },
    { icon: Clock, label: "Duty Roster", href: `/${hospitalName}/admin/duty-roster` },
    { icon: CalendarDays, label: "Annual Calendar", href: `/${hospitalName}/admin/annual-calendar` },
    { icon: UserPlus, label: "Referral", href: `/${hospitalName}/admin/referral` },
    { icon: Shield, label: "TPA Management", href: `/${hospitalName}/admin/tpa` },
    { icon: DollarSign, label: "Finance", href: `/${hospitalName}/admin/finance` },
    { icon: MessageSquare, label: "Messaging", href: `/${hospitalName}/admin/messaging` },
  ]

  const reportCategories = [
    { label: "Finance", href: `/${hospitalName}/admin/reports/finance` },
    { label: "Appointment", href: `/${hospitalName}/admin/reports/appointment` },
    { label: "OPD", href: `/${hospitalName}/admin/reports/opd` },
    { label: "IPD", href: `/${hospitalName}/admin/reports/ipd` },
    { label: "Pharmacy", href: `/${hospitalName}/admin/reports/pharmacy` },
    { label: "Pathology", href: `/${hospitalName}/admin/reports/pathology` },
    { label: "Radiology", href: `/${hospitalName}/admin/reports/radiology` },
    { label: "Blood Bank", href: `/${hospitalName}/admin/reports/blood-bank` },
    { label: "Ambulance", href: `/${hospitalName}/admin/reports/ambulance` },
    { label: "Birth Death", href: `/${hospitalName}/admin/reports/birth-death` },
    { label: "Human Resource", href: `/${hospitalName}/admin/reports/hr` },
    { label: "TPA", href: `/${hospitalName}/admin/reports/tpa` },
    { label: "Inventory", href: `/${hospitalName}/admin/reports/inventory` },
    { label: "Live Consultation", href: `/${hospitalName}/admin/reports/live-consultation` },
    { label: "Log", href: `/${hospitalName}/admin/reports/log` },
    { label: "OT", href: `/${hospitalName}/admin/reports/ot` },
    { label: "Patient", href: `/${hospitalName}/admin/reports/patient` },
  ]

  return (
    <Sidebar className="border-r bg-gray-100">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm capitalize">{hospitalName.replace("-", " ")}</h2>
            <p className="text-xs text-gray-600">Hospital Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} className="w-full justify-start">
                <Link href={item.href} className="flex items-center space-x-3 px-3 py-2">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Reports Section with Collapsible Submenu */}
          <SidebarMenuItem>
            <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="w-full justify-start">
                  <div className="flex items-center space-x-3 px-3 py-2 w-full">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm flex-1">Reports</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isReportsOpen ? "rotate-90" : ""}`} />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {reportCategories.map((report) => (
                    <SidebarMenuSubItem key={report.href}>
                      <SidebarMenuSubButton asChild isActive={pathname === report.href}>
                        <Link href={report.href} className="text-sm">
                          {report.label}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
