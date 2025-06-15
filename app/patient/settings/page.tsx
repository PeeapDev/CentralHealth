"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, Phone, Mail, MapPin, Lock, Camera, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function PatientSettings() {
  const { profile, isLoading, error, updatePatientProfile } = usePatientProfile()
  const [isUpdating, setIsUpdating] = useState(false)
  
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
