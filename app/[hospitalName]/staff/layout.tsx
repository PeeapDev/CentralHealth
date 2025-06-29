"use client"

import { useState, useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Home, Users, Wallet, Settings, LogOut, Calendar, MessageSquare, FileText, ChevronRight, User, CreditCard
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// Define the StaffDashboardLayout component
export default function StaffDashboardLayout({ 
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const params = useParams<{ hospitalName: string }>()
  const pathname = usePathname()
  const hospitalName = params?.hospitalName || ""
  const { toast } = useToast()
  
  // Define proper type for staff member
  interface StaffMember {
    id: string
    name: string
    email: string
    role: string
    department?: string
    specialization?: string
    profilePicture?: string
    wallet?: {
      balance: number
      currency: string
    }
  }
  
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch staff data
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/hospitals/${hospitalName}/staff/me`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch staff data: ${response.statusText}`)
        }
        
        const data = await response.json()
        setStaff(data as StaffMember)
      } catch (error) {
        console.error("Error fetching staff data:", error)
        toast({
          title: "Error",
          description: "Failed to load your profile data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchStaffData()
  }, [hospitalName, toast])

  // Navigation items with dynamic hospitalName
  const navigationItems = [
    {
      name: "Dashboard",
      href: `/${hospitalName}/staff`,
      icon: Home,
      current: pathname === `/${hospitalName}/staff`,
    },
    {
      name: "Schedule",
      href: `/${hospitalName}/staff/schedule`,
      icon: Calendar,
      current: pathname === `/${hospitalName}/staff/schedule`,
    },
    {
      name: "Patients",
      href: `/${hospitalName}/staff/patients`,
      icon: Users,
      current: pathname === `/${hospitalName}/staff/patients`,
    },
    {
      name: "Messages",
      href: `/${hospitalName}/staff/messages`,
      icon: MessageSquare,
      current: pathname === `/${hospitalName}/staff/messages`,
    },
    {
      name: "Documents",
      href: `/${hospitalName}/staff/documents`,
      icon: FileText,
      current: pathname === `/${hospitalName}/staff/documents`,
    },
    {
      name: "Wallet",
      href: `/${hospitalName}/staff/wallet`,
      icon: Wallet,
      current: pathname === `/${hospitalName}/staff/wallet`,
    },
    {
      name: "Profile",
      href: `/${hospitalName}/staff/profile`,
      icon: User,
      current: pathname === `/${hospitalName}/staff/profile`,
    },
    {
      name: "Settings",
      href: `/${hospitalName}/staff/settings`,
      icon: Settings,
      current: pathname === `/${hospitalName}/staff/settings`,
    },
  ]

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        window.location.href = '/login';
      } else {
        throw new Error('Failed to log out');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Breadcrumbs logic
  const getBreadcrumbs = () => {
    const paths = pathname ? pathname.split('/').filter(Boolean) : [];
    const currentPage = paths[paths.length - 1];
    
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Link href={`/${hospitalName}/staff`} className="hover:text-gray-700">
          Dashboard
        </Link>
        {currentPage !== "staff" && (
          <>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="capitalize font-medium text-gray-900">
              {currentPage.replace(/-/g, ' ')}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center flex-shrink-0 px-4 mb-5">
            <Link href="/">
              <h1 className="text-xl font-bold text-blue-600">LifeCare Hospital</h1>
            </Link>
          </div>
          
          {/* Staff Profile */}
          <div className="px-4 mb-4">
            {loading ? (
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : staff ? (
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={staff.profilePicture} alt={staff.name} />
                  <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{staff.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{staff.role.toLowerCase()}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Error loading profile</div>
            )}
          </div>
          
          <Separator className="mb-4" />
          
          {/* Navigation */}
          <nav className="mt-2 flex-1 px-2 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  item.current
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    item.current ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Sign out button */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="flex items-center w-full text-gray-600 hover:text-gray-900"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Breadcrumb */}
        <div className="sticky top-0 z-10 bg-white py-3 px-4 border-b border-gray-200">
          {getBreadcrumbs()}
        </div>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
