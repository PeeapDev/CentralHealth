"use client"

import {
  Calendar,
  CreditCard,
  FileText,
  Heart,
  Home,
  LucideIcon,
  MessageSquare,
  Pill,
  Settings,
  ShoppingCart,
  TestTube,
  User,
  Users,
  Wallet,
  Baby,
  Stethoscope,
  AlertCircle,
  LayoutDashboard,
  History,
  Receipt,
  LogOut,
  Bell,
  Clock,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useHospitalContext } from "@/hooks/use-hospital-context"
import { DEFAULT_HOSPITAL } from "@/lib/hospital-context"
import { ProfileInfo } from "./profile-info"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Generate patient ID with mixed letters and numbers (excluding i, o, 0, 1, l)
const generatePatientId = () => {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ"
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const PATIENT_ID = "J8K9M" // Fixed ID for consistency

// Navigation items
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    badge: null,
  },
  {
    title: "Medical Records",
    url: "/medical-records",
    icon: FileText,
    badge: null,
  },
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
    badge: "2",
  },
  {
    title: "Medications",
    url: "/medications",
    icon: Pill,
    badge: "3",
  },
  {
    title: "Test Results",
    url: "/test-results",
    icon: TestTube,
    badge: "1",
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    badge: "5",
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
    badge: null,
  },
  {
    title: "Patient Wallet",
    url: "/wallet",
    icon: Wallet,
    badge: null,
  },
  {
    title: "Admit History",
    url: "/admit-history",
    icon: History,
    badge: null,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: Receipt,
    badge: "2",
  },
  {
    title: "Medical Shop",
    url: "/shop",
    icon: ShoppingCart,
    badge: null,
  },
]

const quickActions = [
  {
    title: "Emergency",
    url: "/emergency",
    icon: Heart,
    urgent: true,
  },
  {
    title: "Schedule Appointment",
    url: "/schedule",
    icon: Clock,
    urgent: false,
  },
  {
    title: "Contact Care Team",
    url: "/contact",
    icon: Users,
    urgent: false,
  },
]

interface AppSidebarProps {
  onNavigate?: (page: string) => void
  currentPage?: string
  hideProfileHeader?: boolean
  profileData?: {
    name?: string;
    medicalNumber?: string;
    profileImage?: string;
  }
  // Optional custom navigation items
  navigation?: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    current: boolean;
    badge?: string | null;
  }>
}

export function AppSidebar({ onNavigate, currentPage, hideProfileHeader = false, profileData, navigation, ...props }: AppSidebarProps) {
  // Use our hospital context to prevent "hospital not found" errors
  const { hospital } = useHospitalContext();
  
  // Use provided navigation items or fall back to default
  const menuItems = navigation || navigationItems.map(item => ({
    name: item.title,
    href: item.url,
    icon: item.icon,
    current: currentPage === item.url.replace("/", ""),
    badge: item.badge
  }));
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-2 py-2">
          <Stethoscope className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{hospital.name}</h2>
            <p className="text-xs text-gray-500">Patient Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Patient Info - Only shown when not in hideProfileHeader mode */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${hideProfileHeader ? 'max-h-0 opacity-0 absolute -z-10' : 'max-h-[120px] opacity-100 relative z-10'}`}>
          <SidebarGroup className="transform transition-transform duration-500 ease-in-out">
            <SidebarGroupContent>
              <ProfileInfo profileData={profileData} />
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Main Navigation - Animates up when profile is hidden */}
        <SidebarGroup className={`transition-all duration-500 ${hideProfileHeader ? 'transform -translate-y-0' : ''}`}>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.name || item.href}>
                  <SidebarMenuButton
                    onClick={() => {
                      if (item.href) {
                        // Direct navigation to the full href instead of using onNavigate
                        window.location.href = item.href;
                      }
                    }}
                    isActive={currentPage === (item.href.split('/').pop() || 'dashboard')}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((action) => (
                <SidebarMenuItem key={action.title}>
                  <SidebarMenuButton
                    onClick={() => onNavigate?.(action.url.replace("/", ""))}
                    className={action.urgent ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}
                  >
                    <action.icon className="h-4 w-4" />
                    <span>{action.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate?.("settings")}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate?.("notifications")}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </div>
                <Badge variant="destructive" className="ml-auto">
                  3
                </Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => {
                // Handle signout by redirecting to the signout API endpoint
                window.location.href = '/api/patients/signout'; 
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
