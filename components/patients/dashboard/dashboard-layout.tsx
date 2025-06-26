"use client"

import React from "react"

import { AppSidebar } from "./app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  CreditCard,
  Settings,
  FileText,
  CalendarDays,
  MessagesSquare,
  Stethoscope,
  FileBarChart2,
  User,
  Baby,
  Heart,
} from "lucide-react"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { shouldShowMaternalCare, SpecializedCareSettings, DEFAULT_SPECIALIZED_CARE_SETTINGS } from "@/lib/specialized-care-utils"
import { PatientProfile } from "@/lib/patient-profile-types"

interface DashboardLayoutProps {
  children: React.ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  onNavigate?: (page: string) => void
  currentPage?: string
  hideProfileHeader?: boolean
  profileData?: {
    name?: string;
    medicalNumber?: string;
    profileImage?: string;
  }
}

const baseNavigation = [
  { name: "Home", href: "/patient", icon: Home, current: true },
  { name: "Appointments", href: "/patient/appointments", icon: CalendarDays, current: false },
  { name: "Medical Records", href: "/patient/medical-records", icon: FileText, current: false },
  { name: "Messages", href: "/patient/messages", icon: MessagesSquare, current: false },
  { name: "Billing", href: "/patient/billing", icon: CreditCard, current: false },
  { name: "My Doctor", href: "/patient/doctor", icon: Stethoscope, current: false },
  { name: "Reports", href: "/patient/reports", icon: FileBarChart2, current: false },
  { name: "Profile", href: "/patient/profile", icon: User, current: false },
  { name: "Settings", href: "/patient/settings", icon: Settings, current: false },
]

const maternalCareNavigation = [
  { name: "Antenatal Care", href: "/patient/antenatal", icon: Heart, current: false },
  { name: "Neonatal Care", href: "/patient/neonatal", icon: Baby, current: false },
]

// Export as both named and default export for flexibility and to fix build errors
function DashboardLayout({
  children,
  breadcrumbs = [],
  onNavigate,
  currentPage,
  hideProfileHeader = false,
  profileData,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const { profile, isLoading } = usePatientProfile()
  
  // Fix issue with React.ReactNode children type
  const [navigation, setNavigation] = useState(baseNavigation)
  const [showMaternalCare, setShowMaternalCare] = useState(false)

  useEffect(() => {
    const updateNavigation = () => {
      let settings: SpecializedCareSettings = DEFAULT_SPECIALIZED_CARE_SETTINGS;
      try {
        const storedSettings = localStorage.getItem('specializedCareSettings');
        if (storedSettings) {
          settings = JSON.parse(storedSettings);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }

      let isPregnant = false;
      let recentBirth = false;
      
      // Parse medical history if it exists
      if (profile && 'medicalHistory' in profile) {
        try {
          const medHistory = typeof profile.medicalHistory === 'string' 
            ? JSON.parse(profile.medicalHistory)
            : profile.medicalHistory || {};
            
          isPregnant = !!medHistory.isPregnant;
          recentBirth = !!medHistory.recentBirth;
        } catch (err) {
          console.error("Error parsing medical history:", err);
        }
      }

      const showMaternal = shouldShowMaternalCare(
        profile?.dateOfBirth,
        profile?.gender,
        settings,
        isPregnant,
        recentBirth
      );
      
      setShowMaternalCare(showMaternal);
      
      if (showMaternal) {
        setNavigation([...baseNavigation, ...maternalCareNavigation]);
      } else {
        setNavigation([...baseNavigation]);
      }
    };
    
    if (profile) {
      updateNavigation();
    }
    
    const handleSettingsChange = (event: CustomEvent<SpecializedCareSettings>) => {
      updateNavigation();
    };
    
    window.addEventListener('specializedCareSettingsChanged', handleSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('specializedCareSettingsChanged', handleSettingsChange as EventListener);
    };
  }, [profile]);

  // Update the current status based on the pathname
  useEffect(() => {
    // Create a new navigation array with updated current status
    const updatedItems = navigation.map((item) => ({
      ...item,
      current: item.name.toLowerCase() === (currentPage || 'home').toLowerCase(),
    }));
    setNavigation(updatedItems);
  }, [currentPage])

  return (
    <SidebarProvider>
      <AppSidebar 
        onNavigate={onNavigate} 
        currentPage={currentPage} 
        hideProfileHeader={hideProfileHeader}
        profileData={profileData}
        navigation={navigation}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={index} className="flex items-center">
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {breadcrumb.href ? (
                        <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Export as both named export and default export to resolve build issues
export { DashboardLayout }
export default DashboardLayout
