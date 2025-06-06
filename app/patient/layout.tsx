"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Calendar, 
  FileText, 
  User, 
  Activity, 
  Pill, 
  Heart, 
  Home, 
  Settings, 
  Bell, 
  Shield, 
  LogOut, 
  Menu, 
  X,
  Users,
  Droplet,
  Clipboard,
  Receipt,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function PatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isOpen, setIsOpen] = useState(true)
  const [patientData, setPatientData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname() || "/patient/dashboard"
  const isDashboard = pathname.includes("/patient/dashboard")
  
  // Fetch patient data from session
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/patients/session/me')
        const data = await response.json()
        
        if (data.patient) {
          setPatientData(data.patient)
        }
      } catch (error) {
        console.error('Error fetching patient data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPatientData()
  }, [])
  
  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/patients/session/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }
  
  // Main navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/patient/dashboard",
      icon: Home
    },
    {
      name: "Appointment",
      href: "/patient/appointment",
      icon: Calendar
    },
    {
      name: "Prescription",
      href: "/patient/prescription",
      icon: Pill
    },
    {
      name: "Doctor",
      href: "/patient/doctor",
      icon: Users
    },
    {
      name: "Blood Bank",
      href: "/patient/blood-bank",
      icon: Droplet
    },
    {
      name: "Admit History",
      href: "/patient/admit-history",
      icon: Clipboard
    },
    {
      name: "Operation History",
      href: "/patient/operation-history",
      icon: Activity
    },
    {
      name: "Invoice",
      href: "/patient/invoice",
      icon: Receipt
    },
    {
      name: "Message",
      href: "/patient/message",
      icon: MessageSquare
    },
    {
      name: "Profile",
      href: "/patient/profile",
      icon: User
    }
  ]
  
  // Dashboard category items (only shown on dashboard)
  const dashboardCategories = [
    {
      name: "Overview",
      href: "/patient/dashboard",
      icon: Home
    },
    {
      name: "Appointments",
      href: "/patient/dashboard/appointments",
      icon: Calendar
    },
    {
      name: "Medications",
      href: "/patient/dashboard/medications",
      icon: Pill
    },
    {
      name: "Vaccinations",
      href: "/patient/dashboard/vaccinations",
      icon: Shield
    },
    {
      name: "Medical Records",
      href: "/patient/dashboard/medical-records",
      icon: FileText
    }
  ]
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Toggle Button for Mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>
      
      {/* Sidebar */}
      <div
        className={cn(
          "bg-background border-r border-border w-64 flex-shrink-0 overflow-y-auto transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isDashboard ? "bg-gray-900 text-white" : "bg-white text-gray-900",
          "md:translate-x-0 fixed md:relative z-30 h-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center">
          <div className={cn(
            "p-2 rounded-md mr-2",
            isDashboard ? "bg-white/10" : "bg-primary/10"
          )}>
            <Heart className={cn(
              "h-5 w-5",
              isDashboard ? "text-white" : "text-primary"
            )} />
          </div>
          <h1 className="text-lg font-bold">Patient Portal</h1>
        </div>
        
        {/* Patient Info */}
        {!isLoading && patientData && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className={cn(
                  isDashboard ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                )}>
                  {patientData.name ? patientData.name.charAt(0) : 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{patientData.name || 'Patient'}</p>
                <p className={cn(
                  "text-sm",
                  isDashboard ? "text-gray-300" : "text-muted-foreground"
                )}>
                  MRN: {patientData.medicalNumber || 'Not assigned'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Categories (only shown on dashboard pages) */}
        {isDashboard && (
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wider">
              Dashboard
            </h2>
            <nav className="space-y-1">
              {dashboardCategories.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm rounded-md w-full",
                      isActive 
                        ? "bg-white/10 text-white font-medium" 
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
        
        {/* Main Navigation */}
        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm rounded-md w-full",
                    isActive
                      ? isDashboard
                        ? "bg-white/10 text-white font-medium"
                        : "bg-primary/10 text-primary font-medium"
                      : isDashboard
                        ? "text-gray-300 hover:bg-white/5 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        
        {/* Logout */}
        <div className="p-4 border-t border-border mt-auto">
          <Button
            variant={isDashboard ? "outline" : "secondary"}
            className={cn(
              "w-full justify-start",
              isDashboard && "border-white/20 text-white hover:bg-white/10 hover:text-white"
            )}
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
