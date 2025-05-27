"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Settings,
  Heart,
  ChevronUp,
  LayoutDashboard,
  UserCog,
  CreditCard,
  FileBarChart,
  Laptop2,
  Mail,
  ServerCog,
  ChevronRight,
  DollarSign,
  HelpCircle,
  MessageSquare,
  Shield,
  Languages,
  User,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function SuperAdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]))
  }
  
  // Handle logout - client-side implementation that doesn't rely on API
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear cookies with multiple approaches to ensure they're cleared
    // Set standard cookies to empty with past expiration date
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'hospitalToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    
    // Try with domain specified
    document.cookie = 'token=; path=/; domain=localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'hospitalToken=; path=/; domain=localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    
    // Clear any local storage items that might contain auth info
    localStorage.clear();
    sessionStorage.clear();
    
    // Force a hard redirect to the root login page (more reliable than /auth/login)
    window.location.replace('/');
  }

  interface NavigationItem {
    title: string;
    url?: string;
    icon: React.ElementType;
    id?: string;
    subItems?: Array<{ title: string; url: string }>;
  }

  const navigation: NavigationItem[] = [
    {
      title: "Dashboard",
      url: "/superadmin",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      icon: UserCog,
      id: "users",
      subItems: [
        { title: "All Users", url: "/superadmin/users" },
        { title: "Administrators", url: "/superadmin/users/admins" },
        { title: "Staff", url: "/superadmin/users/staff" },
        { title: "Patients", url: "/superadmin/users/patient" },
        { title: "Roles & Permissions", url: "/superadmin/users/roles" },
      ],
    },
    {
      title: "Subscription",
      icon: CreditCard,
      id: "subscription",
      subItems: [
        { title: "All Hospitals", url: "/superadmin/hospitals" },
        { title: "Create New Hospital", url: "/superadmin/hospitals/create" },
        { title: "Packages", url: "/superadmin/packages" },
        { title: "Add New Package", url: "/superadmin/packages/create" },
        { title: "Subscription Request", url: "/superadmin/subscription-requests" },
      ],
    },
    {
      title: "Reports",
      icon: FileBarChart,
      id: "reports",
      subItems: [
        { title: "Active Hospitals", url: "/superadmin/reports/active-hospitals" },
        { title: "Inactive Hospitals", url: "/superadmin/reports/inactive-hospitals" },
        { title: "Expired", url: "/superadmin/reports/expired" },
        { title: "Registered Patient", url: "/superadmin/reports/registered-patients" },
        { title: "Registered Doctor", url: "/superadmin/reports/registered-doctors" },
        { title: "Subscription Report", url: "/superadmin/reports/subscription" },
      ],
    },
    {
      title: "Website Management",
      icon: Laptop2,
      id: "website",
      subItems: [
        { title: "Visit Site", url: "/superadmin/website/visit" },
        { title: "Website Settings", url: "/superadmin/website/settings" },
        { title: "Slides", url: "/superadmin/website/slides" },
        { title: "Reviews", url: "/superadmin/website/reviews" },
        { title: "Faqs", url: "/superadmin/website/faqs" },
      ],
    },
    {
      title: "Communication",
      icon: MessageSquare,
      id: "communication",
      subItems: [
        { title: "Chat", url: "/superadmin/communication/chat" },
        { title: "Email", url: "/superadmin/communication/email" },
        { title: "SMS", url: "/superadmin/communication/sms" },
        { title: "Broadcast", url: "/superadmin/communication/broadcast" },
        { title: "Settings", url: "/superadmin/communication/settings" },
      ],
    },
    {
      title: "System Settings",
      icon: ServerCog,
      id: "system-settings",
      subItems: [
        { title: "General Setting", url: "/superadmin/settings/general" },
        { title: "Email / SMTP", url: "/superadmin/settings/smtp" },
        { title: "API Keys", url: "/superadmin/settings/api-keys" },
        { title: "Module/Extension", url: "/superadmin/settings/modules" },
        { title: "Payment Setting", url: "/superadmin/settings/payment" },
        { title: "System Update", url: "/superadmin/settings/update" },
        { title: "Language", url: "/superadmin/settings/language" },
        { title: "Error Logs", url: "/superadmin/settings/error-logs" },
        { title: "Profile", url: "/superadmin/profile" },
      ],
    },
    {
      title: "Google reCAPTCHA",
      url: "/superadmin/recaptcha",
      icon: Shield,
    },
    {
      title: "Payment Gateway",
      url: "/superadmin/payment-gateway",
      icon: DollarSign,
    },
    {
      title: "Help Center",
      url: "/superadmin/help",
      icon: HelpCircle,
    },
    {
      title: "Contact Us",
      url: "/superadmin/contact",
      icon: MessageSquare,
    },
  ]

  return (
    <Sidebar className="bg-slate-800 border-r-0">
      <SidebarHeader className="bg-slate-800 border-b border-slate-700 p-4">
        <Link href="/superadmin" className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Hospital</p>
            <p className="text-slate-300 text-sm">Management System</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-slate-800 px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => (
                <div key={item.title}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.id!)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-white hover:bg-slate-700 transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-white mr-3" />
                        <span className="text-white font-medium">{item.title}</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-white transition-transform ml-auto",
                            openMenus.includes(item.id!) && "rotate-90",
                          )}
                        />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Link 
                        href={item.url!} 
                        className="flex items-center space-x-3 rounded-lg px-3 py-2 text-white hover:bg-slate-700 transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-white" />
                        <span className="text-white font-medium">{item.title}</span>
                      </Link>
                    </div>
                  )}
                  {item.subItems && openMenus.includes(item.id!) && (
                    <div className="pl-5 mt-2 space-y-1">
                      {item.subItems.map((subItem) => (
                        <div key={subItem.title}>
                          <Link 
                            href={subItem.url}
                            className={cn(
                              "block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors",
                              pathname === subItem.url && "bg-slate-700/50 text-white"
                            )}
                          >
                            {subItem.title}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-slate-700 text-white">SA</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Super Admin</p>
                  <p className="text-xs text-slate-400">admin@example.com</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/superadmin/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/superadmin/settings/general">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
