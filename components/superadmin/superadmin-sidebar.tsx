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
  LogOut,
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

  const navigation = [
    {
      title: "Dashboard",
      url: "/superadmin",
      icon: LayoutDashboard,
    },
    {
      title: "Superadmin",
      url: "/superadmin/admins",
      icon: UserCog,
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
      title: "Email",
      icon: Mail,
      id: "email",
      subItems: [
        { title: "NEW", url: "/superadmin/email/new" },
        { title: "Sent", url: "/superadmin/email/sent" },
        { title: "Settings", url: "/superadmin/email/settings" },
        { title: "Contact Us Email", url: "/superadmin/email/contact" },
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
      title: "Language",
      url: "/superadmin/language",
      icon: Languages,
    },
    {
      title: "Profile",
      url: "/superadmin/profile",
      icon: User,
    },
    {
      title: "Log Out",
      url: "/auth/login",
      icon: LogOut,
      onClick: () => {
        localStorage.removeItem("auth")
        router.push("/auth/login")
      },
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
      <SidebarHeader className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Hospital</p>
            <p className="text-slate-300 text-sm">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-800 px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigation.map((item) => (
                <div key={item.title}>
                  {item.subItems ? (
                    <div>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => toggleMenu(item.id!)}
                          className={cn(
                            "flex items-center justify-between w-full text-white hover:bg-slate-700 hover:text-white px-4 py-3 rounded-lg transition-colors",
                            "data-[state=open]:bg-slate-700",
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="h-5 w-5 text-white" />
                            <span className="text-white font-medium">{item.title}</span>
                          </div>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-white transition-transform",
                              openMenus.includes(item.id!) && "rotate-90",
                            )}
                          />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {openMenus.includes(item.id!) && (
                        <div className="ml-6 mt-2 border-l-2 border-slate-600 pl-4 space-y-1">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton
                                asChild
                                className={cn(
                                  "text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md transition-colors",
                                  pathname === subItem.url && "bg-slate-700 text-white",
                                )}
                              >
                                <Link href={subItem.url} className="text-slate-300 hover:text-white">
                                  <span className="text-sm">{subItem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild={!item.onClick}
                        onClick={item.onClick}
                        className={cn(
                          "text-white hover:bg-slate-700 hover:text-white px-4 py-3 rounded-lg transition-colors",
                          pathname === item.url && "bg-slate-700",
                        )}
                      >
                        {item.onClick ? (
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <item.icon className="h-5 w-5 text-white" />
                            <span className="text-white font-medium">{item.title}</span>
                          </div>
                        ) : (
                          <Link href={item.url!} className="flex items-center space-x-3">
                            <item.icon className="h-5 w-5 text-white" />
                            <span className="text-white font-medium">{item.title}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-slate-800 border-t border-slate-700 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="text-white hover:bg-slate-700 hover:text-white px-4 py-3 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-yellow-500 text-white font-semibold">SA</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium">Super Admin</span>
                    <span className="text-slate-300 text-xs">Administrator</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-white" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuLabel>Super Administrator</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.removeItem("auth")
                    router.push("/auth/login")
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
