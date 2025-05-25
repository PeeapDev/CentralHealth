"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
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
  Users,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Stethoscope,
  LogOut,
  Heart,
  ChevronUp,
  Home,
  Clock,
  MessageSquare,
} from "lucide-react"

export function UserSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
        {
          title: "My Schedule",
          url: "/dashboard/schedule",
          icon: Calendar,
        },
      ],
    },
    {
      title: "Patient Care",
      items: [
        {
          title: "My Patients",
          url: "/dashboard/patients",
          icon: Users,
        },
        {
          title: "Consultations",
          url: "/dashboard/consultations",
          icon: Stethoscope,
        },
        {
          title: "Medical Records",
          url: "/dashboard/records",
          icon: FileText,
        },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          title: "Messages",
          url: "/dashboard/messages",
          icon: MessageSquare,
        },
        {
          title: "Time Tracking",
          url: "/dashboard/timetracking",
          icon: Clock,
        },
      ],
    },
    {
      title: "Personal",
      items: [
        {
          title: "Reports",
          url: "/dashboard/reports",
          icon: BarChart3,
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem("auth")
    router.push("/auth/login")
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-2">
          <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">MediCore</p>
            <p className="text-xs text-muted-foreground">Healthcare Provider</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>DR</AvatarFallback>
                  </Avatar>
                  <span>Dr. Provider</span>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuLabel>Healthcare Provider</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
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
