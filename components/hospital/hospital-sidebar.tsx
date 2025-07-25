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
  Settings,
  Bell,
  Wrench,
  CreditCard as PaymentIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

interface HospitalSidebarProps {
  hospitalName: string
}

export function HospitalSidebar({ hospitalName }: HospitalSidebarProps) {
  const pathname = usePathname()
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [hospital, setHospital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  
  // Fetch hospital data to get enabled modules
  // Fetch unread message count with enhanced error handling
  const fetchUnreadMessages = async () => {
    // Skip fetching if no hospital name is available
    if (!hospitalName) {
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`/api/hospitals/${hospitalName}/messages/recent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.unreadCount || 0);
      } else {
        // Handle non-200 responses silently in production
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Messages API returned status: ${response.status}`);
        }
      }
    } catch (error) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        if ((error as Error)?.name === 'AbortError') {
          console.warn('Messages fetch timed out');
        } else {
          console.warn('Error fetching unread messages:', error);
        }
      }
      // Silently handle errors - unread count stays as is
    }
  }
  
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const response = await fetch(`/api/hospitals/${hospitalName}`)
        if (response.ok) {
          const data = await response.json()
          setHospital(data)
          console.log('Hospital data loaded for sidebar:', data)
        } else {
          console.error('Failed to load hospital data for sidebar')
        }
      } catch (error) {
        console.error('Error fetching hospital:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (hospitalName) {
      fetchHospital()
      fetchUnreadMessages() // Fetch unread messages count
      
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchUnreadMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [hospitalName])
  
  // Check if a module is enabled
  const isModuleEnabled = (moduleName: string) => {
    if (!hospital || !hospital.modules) return false
    return hospital.modules.some((m: string) => 
      m.toLowerCase() === moduleName.toLowerCase()
    )
  }

  // Define all possible menu items
  const allMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: `/${hospitalName}/admin`, id: "dashboard", module: null }, // Always show dashboard
    { icon: CreditCard, label: "Billing", href: `/${hospitalName}/admin/billing`, id: "billing", module: "billing" },
    { icon: Calendar, label: "Appointment", href: `/${hospitalName}/admin/appointment`, id: "appointment", module: "appointment" },
    { icon: Stethoscope, label: "OPD - Out Patient", href: `/${hospitalName}/admin/opd`, id: "opd", module: "opd" },
    { icon: Bed, label: "IPD - In Patient", href: `/${hospitalName}/admin/ipd`, id: "ipd", module: "ipd" },
    { icon: Users, label: "Antenatal Care", href: `/${hospitalName}/admin/antenatal`, id: "antenatal", module: "antenatal" },
    { icon: UserPlus, label: "Neonatal Care", href: `/${hospitalName}/admin/neonatal`, id: "neonatal", module: "neonatal" },
    { icon: Pill, label: "Pharmacy", href: `/${hospitalName}/admin/pharmacy`, id: "pharmacy", module: "pharmacy" },
    { icon: TestTube, label: "Pathology", href: `/${hospitalName}/admin/pathology`, id: "pathology", module: "pathology" },
    { icon: Scan, label: "Radiology", href: `/${hospitalName}/admin/radiology`, id: "radiology", module: "radiology" },
    { icon: Droplet, label: "Blood Bank", href: `/${hospitalName}/admin/blood-bank`, id: "blood-bank", module: "blood bank" },
    { icon: Truck, label: "Ambulance", href: `/${hospitalName}/admin/ambulance`, id: "ambulance", module: "ambulance" },
    { icon: Building, label: "Front Office", href: `/${hospitalName}/admin/front-office`, id: "front-office", module: "front office" },
    { icon: FileText, label: "Birth & Death Record", href: `/${hospitalName}/admin/birth-death`, id: "birth-death", module: "birth & death record" },
    { icon: Users, label: "Human Resource", href: `/${hospitalName}/admin/hr`, id: "hr", module: "human resource" },
    { icon: Clock, label: "Duty Roster", href: `/${hospitalName}/admin/duty-roster`, module: "duty roster" },
    { icon: CalendarDays, label: "Annual Calendar", href: `/${hospitalName}/admin/annual-calendar`, module: "annual calendar" },
    { icon: UserPlus, label: "Referral", href: `/${hospitalName}/admin/referral`, module: "referral" },
    { icon: Shield, label: "TPA Management", href: `/${hospitalName}/admin/tpa`, module: "tpa management" },
    { icon: DollarSign, label: "Finance", href: `/${hospitalName}/admin/finance`, module: "billing" }, // Finance is shown if billing is enabled
    // Add Patient management - FHIR compliant
    { icon: UserPlus, label: "Patients", href: `/${hospitalName}/admin/patients`, module: null } // Always show patients
  ]
  
  // Filter menu items based on enabled modules
  const menuItems = allMenuItems.filter(item => {
    // Always show items without a module requirement
    if (!item.module) return true
    
    // Always show antenatal and neonatal modules
    if (item.module === 'antenatal' || item.module === 'neonatal') return true
    
    // Show items if their module is enabled
    return isModuleEnabled(item.module)
  })

  // Define all possible report categories
  const allReportCategories = [
    { label: "Finance", href: `/${hospitalName}/admin/reports/finance`, module: "billing" },
    { label: "Appointment", href: `/${hospitalName}/admin/reports/appointment`, module: "appointment" },
    { label: "OPD", href: `/${hospitalName}/admin/reports/opd`, module: "opd" },
    { label: "IPD", href: `/${hospitalName}/admin/reports/ipd`, module: "ipd" },
    { label: "Pharmacy", href: `/${hospitalName}/admin/reports/pharmacy`, module: "pharmacy" },
    { label: "Pathology", href: `/${hospitalName}/admin/reports/pathology`, module: "pathology" },
    { label: "Radiology", href: `/${hospitalName}/admin/reports/radiology`, module: "radiology" },
    { label: "Blood Bank", href: `/${hospitalName}/admin/reports/blood-bank`, module: "blood bank" },
    { label: "Ambulance", href: `/${hospitalName}/admin/reports/ambulance`, module: "ambulance" },
    { label: "Birth Death", href: `/${hospitalName}/admin/reports/birth-death`, module: "birth & death record" },
    { label: "Human Resource", href: `/${hospitalName}/admin/reports/hr`, module: "human resource" },
    { label: "TPA", href: `/${hospitalName}/admin/reports/tpa`, module: "tpa management" },
    { label: "Inventory", href: `/${hospitalName}/admin/reports/inventory`, module: null }, // Core feature
    { label: "Live Consultation", href: `/${hospitalName}/admin/reports/live-consultation`, module: null }, // Core feature
    { label: "Log", href: `/${hospitalName}/admin/reports/log`, module: null }, // Core feature
    { label: "OT", href: `/${hospitalName}/admin/reports/ot`, module: "opd" }, // Related to OPD
    { label: "Patient", href: `/${hospitalName}/admin/reports/patient`, module: null }, // Core feature
  ]
  
  // Filter report categories based on enabled modules
  const reportCategories = allReportCategories.filter(report => {
    // Always show core reports
    if (report.module === null) return true;
    // Only show module-specific reports if they're enabled for this hospital
    return isModuleEnabled(report.module);
  })

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
        {loading ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">Loading modules...</p>
          </div>
        ) : (
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id || item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} className="w-full justify-start">
                  <Link href={item.href} className="flex items-center space-x-3 px-3 py-2 relative">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                    
                    {/* Show unread count badge for Chat & Notifications */}
                    {item.label === "Chat & Notifications" && unreadMessages > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        

          {/* Reports Section with Collapsible Submenu - Only show if we have reports */}
          {reportCategories.length > 0 && (
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
          )}

          {/* Settings Section with Collapsible Submenu */}
          <SidebarMenuItem>
            <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="w-full justify-start">
                  <div className="flex items-center space-x-3 px-3 py-2 w-full">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm flex-1">Settings</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isSettingsOpen ? "rotate-90" : ""}`} />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === `/${hospitalName}/admin/settings/general`}>
                      <Link href={`/${hospitalName}/admin/settings/general`} className="text-sm">
                        General Settings
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === `/${hospitalName}/admin/settings/roles`}>
                      <Link href={`/${hospitalName}/admin/settings/roles`} className="text-sm">
                        Role and Permission
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === `/${hospitalName}/admin/settings/notifications`}>
                      <Link href={`/${hospitalName}/admin/settings/notifications`} className="text-sm">
                        Notification Settings
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === `/${hospitalName}/admin/settings/utilities`}>
                      <Link href={`/${hospitalName}/admin/settings/utilities`} className="text-sm">
                        Utilities
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === `/${hospitalName}/admin/settings/payment`}>
                      <Link href={`/${hospitalName}/admin/settings/payment`} className="text-sm">
                        Payment Settings
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarMenu>
      )}</SidebarContent>
    </Sidebar>
  )
}
