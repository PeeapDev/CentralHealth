"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Building, Shield, Key, Upload, Camera, Check, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserProfileProps {
  params: Promise<{ hospitalName: string }> | { hospitalName: string }
}

export default function UserProfilePage({ params }: UserProfileProps) {
  // Use fallback to maintain compatibility with both sync and async params
  const { hospitalName } = params instanceof Promise ? React.use(params) : params
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from local storage first (for fast loading)
        const authData = localStorage.getItem("hospitalAuth")
        if (authData) {
          const parsedData = JSON.parse(authData)
          setUserData(parsedData)
        }
        
        // Then try to fetch fresh data from the API
        const response = await fetch(`/api/hospitals/${hospitalName}/users/me`)
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
          // Update localStorage with fresh data
          localStorage.setItem("hospitalAuth", JSON.stringify(data))
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [hospitalName])

  // Handle profile image upload
  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WEBP)")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB")
      return
    }

    try {
      // Convert image to base64 and store temporarily for preview
      const base64 = await convertToBase64(file)
      setTempImage(base64)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error("Error processing image:", error)
      toast.error("An error occurred while processing the image")
    }
  }
  
  // Save profile image to server
  const saveProfileImage = async () => {
    if (!tempImage) return
    
    setImageLoading(true)
    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', tempImage)
      
      // Send to API
      const response = await fetch(`/api/hospitals/${hospitalName}/users/profile-image`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        setUserData(result.user)
        localStorage.setItem("hospitalAuth", JSON.stringify(result.user))
        setTempImage(null) // Clear temp image after successful upload
        toast.success("Profile image updated successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update profile image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("An error occurred while uploading the image")
    } finally {
      setImageLoading(false)
    }
  }
  
  // Cancel image update
  const cancelImageUpdate = () => {
    setTempImage(null)
    toast.info("Image update cancelled")
  }

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/hospitals/${hospitalName}/users/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })
      
      if (response.ok) {
        toast.success("Password updated successfully")
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update password")
      }
    } catch (error) {
      toast.error("An error occurred while updating password")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map(part => part[0])
          .join("")
          .toUpperCase()
      : "U"
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="My Profile"
        description={`Manage your account settings and password`}
        breadcrumbs={[
          { label: "Home", href: `/${hospitalName}/admin` },
          { label: "Profile" }
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and manage your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="relative">
                {/* Hidden file input for image upload */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
                
                {/* Avatar with user image */}
                <div className="flex flex-col items-center gap-2">
                  {/* Avatar with either current, temporary, or placeholder image */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative cursor-pointer group" onClick={handleImageClick}>
                          <Avatar className="h-24 w-24 border-2 border-gray-200">
                            {imageLoading ? (
                              <Skeleton className="h-24 w-24 rounded-full" />
                            ) : tempImage ? (
                              <AvatarImage src={tempImage} alt={userData?.name || "User"} />
                            ) : userData?.profileImage ? (
                              <AvatarImage src={userData.profileImage} alt={userData?.name || "User"} />
                            ) : (
                              <AvatarImage src="/placeholder.svg" alt={userData?.name || "User"} />
                            )}
                            <AvatarFallback className="text-lg bg-blue-600 text-white">
                              {userData ? getInitials(userData.name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-4 w-4" />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to select a new profile picture</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {tempImage ? (
                      /* Show Save/Cancel when there's a temporary image */
                      <>
                        <Button 
                          size="sm" 
                          className="flex items-center gap-1" 
                          disabled={imageLoading} 
                          onClick={saveProfileImage}
                        >
                          {imageLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="flex items-center gap-1" 
                          onClick={cancelImageUpdate}
                          disabled={imageLoading}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      /* Show Upload/Remove when there's no temporary image */
                      <>
                        <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={handleImageClick}>
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload</span>
                        </Button>
                        {userData?.profileImage && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex items-center gap-1"
                            disabled={imageLoading}
                            onClick={async () => {
                              if (confirm('Are you sure you want to remove your profile picture?')) {
                                setImageLoading(true);
                                try {
                                  const response = await fetch(`/api/hospitals/${hospitalName}/users/profile-image/remove`, {
                                    method: 'POST'
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    setUserData(result.user);
                                    localStorage.setItem("hospitalAuth", JSON.stringify(result.user));
                                    toast.success("Profile image removed successfully");
                                  } else {
                                    const error = await response.json();
                                    toast.error(error.message || "Failed to remove profile image");
                                  }
                                } catch (error) {
                                  console.error("Error removing image:", error);
                                  toast.error("An error occurred while removing the image");
                                } finally {
                                  setImageLoading(false);
                                }
                              }
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-semibold">{userData?.name || "Loading..."}</h3>
                <p className="text-sm text-muted-foreground">{userData?.role || "Admin"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Name</p>
                  <p className="text-sm text-muted-foreground">{userData?.name || "Loading..."}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Email</p>
                  <p className="text-sm text-muted-foreground">{userData?.email || "Loading..."}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">{userData?.role || "User"}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Hospital</p>
                  <p className="text-sm text-muted-foreground capitalize">{hospitalName.replace("-", " ")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your password and security preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="pl-10"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="pl-10"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="pl-10"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
