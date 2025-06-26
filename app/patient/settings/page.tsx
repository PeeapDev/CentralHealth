"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, Phone, Mail, MapPin, Lock, Camera, Save, BabyIcon, UserRoundCog } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { isEligibleForMaternalCare, SpecializedCareSettings, DEFAULT_SPECIALIZED_CARE_SETTINGS } from "@/lib/specialized-care-utils"
import { calculateAge } from "@/lib/patient-profile-utils"

export default function PatientSettings() {
  const router = useRouter();
  const { profile, isLoading, error, updatePatientProfile } = usePatientProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Specialized care settings state
  const [specializedCareSettings, setSpecializedCareSettings] = useState<SpecializedCareSettings>(
    DEFAULT_SPECIALIZED_CARE_SETTINGS
  );
  const [isEligibleForMaternal, setIsEligibleForMaternal] = useState(false);
  
  // Load specialized care settings from localStorage
  useEffect(() => {
    if (profile) {
      // Load settings from localStorage
      try {
        const storedSettings = localStorage.getItem('specializedCareSettings');
        if (storedSettings) {
          setSpecializedCareSettings(JSON.parse(storedSettings));
        }
        
        // Check eligibility based on age and gender
        const eligibility = isEligibleForMaternalCare(
          profile.dateOfBirth, 
          profile.gender
        );
        setIsEligibleForMaternal(eligibility);
        
        // Auto-enable if pregnant
        if (eligibility && profile.medicalHistory) {
          let medHistory: any = {};
          try {
            if (typeof profile.medicalHistory === 'string') {
              medHistory = JSON.parse(profile.medicalHistory);
            } else {
              medHistory = profile.medicalHistory;
            }
            
            // If the patient is pregnant or had recent birth and auto-show is enabled
            if (medHistory.isPregnant || medHistory.recentBirth) {
              if (!specializedCareSettings.showMaternalCare) {
                const newSettings = {
                  ...specializedCareSettings,
                  showMaternalCare: true
                };
                setSpecializedCareSettings(newSettings);
                saveSpecializedCareSettings(newSettings);
                
                // Notify the user that maternal care has been automatically enabled
                toast.info(
                  "Maternal care dashboards have been enabled based on your pregnancy status.",
                  { duration: 5000 }
                );
              }
            }
          } catch (err) {
            console.error("Error parsing medical history:", err);
          }
        }
      } catch (err) {
        console.error("Error loading specialized care settings:", err);
      }
    }
  }, [profile]);
  
  // Save specialized care settings to localStorage and trigger UI update
  const saveSpecializedCareSettings = (settings: SpecializedCareSettings) => {
    localStorage.setItem('specializedCareSettings', JSON.stringify(settings));
    
    // This will trigger a re-render of the dashboard with the updated sidebar items
    const event = new CustomEvent('specializedCareSettingsChanged', { 
      detail: settings
    });
    window.dispatchEvent(event);
  };
  
  // Handle toggle for maternal care dashboard
  const handleMaternalCareToggle = (checked: boolean) => {
    const newSettings = {
      ...specializedCareSettings,
      showMaternalCare: checked
    };
    
    setSpecializedCareSettings(newSettings);
    saveSpecializedCareSettings(newSettings);
    
    // Show confirmation toast
    toast.success(
      checked 
        ? "Antenatal and neonatal care dashboards enabled" 
        : "Antenatal and neonatal care dashboards disabled",
      { duration: 3000 }
    );
  };
  
  if (isLoading) {
    return (
      <DashboardLayout currentPage="settings">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout currentPage="settings">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <span>Error Loading Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="settings">
      <div className="container py-6 space-y-6 max-w-5xl">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <Tabs defaultValue="profile">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
            <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
            <TabsTrigger value="features" className="flex-1">Features</TabsTrigger>
            <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Update your personal information and profile photo.
                </p>
                <Separator />
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Profile image section will be added here */}
                  <div className="flex-1 space-y-4">
                    {/* Profile form will be added here */}
                    <p className="text-center text-muted-foreground">Form section coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">Account settings coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserRoundCog className="h-5 w-5" />
                  <span>Feature Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground mb-4">
                  Customize your dashboard features and specialized care modules.
                </p>
                
                <Separator />
                
                {/* Maternal Care Settings Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Specialized Care Dashboards</h3>
                  
                  {/* Maternal Care Toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <BabyIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Label htmlFor="maternal-care-toggle" className="font-medium">
                          Maternal Care Dashboards
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Show antenatal and neonatal care modules in your dashboard.
                      </p>
                    </div>
                    <Switch
                      id="maternal-care-toggle"
                      checked={specializedCareSettings.showMaternalCare}
                      onCheckedChange={handleMaternalCareToggle}
                      disabled={!isEligibleForMaternal}
                      aria-disabled={!isEligibleForMaternal}
                    />
                  </div>
                  
                  {/* Display eligibility message */}
                  {!isEligibleForMaternal && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {profile?.gender?.toLowerCase() !== 'female' ? (
                        <span>Maternal care dashboards are only available for female patients.</span>
                      ) : (
                        <span>Maternal care dashboards are only available for female patients 12 years or older.</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">Security settings coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
