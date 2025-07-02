"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"

// Dynamically import components to prevent SSR issues
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false })

import {
  AlertCircle,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  FileText,
  Printer,
  Download,
  Share2,
  Calendar,
  ChevronLeft,
  Camera,
  Upload,
  X
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { usePatientProfile } from "@/hooks/use-patient-profile";
import { useHospitalContext } from "@/hooks/use-hospital-context";
import { DEFAULT_HOSPITAL } from "@/lib/hospital-context";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { validatePatientExists, clearPatientCache } from "@/hooks/use-patient-profile-validator";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Define proper TypeScript interfaces for patient medical data
interface Allergy {
  name: string;
  severity?: string;
}

interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
}

interface Condition {
  name: string;
  status?: string;
}

interface PatientProfile {
  id?: string
  name?: string
  dateOfBirth?: string
  gender?: string
  email?: string
  phone?: string
  address?: string
  mrn?: string // Original medical record number field
  medicalRecordNumber?: string // Standardized medical record number per CentralHealth
  medicalNumber?: string // Legacy field
  displayMedicalNumber?: string // Legacy field
  emergencyContact?: string
  hospitalCode?: string
  allergies?: Array<Allergy | string>
  conditions?: Array<Condition | string>
  medications?: Array<Medication | string>
  photo?: string
  profileImage?: string
  [key: string]: any // For dynamic properties
}

export default function PatientProfile() {
  const router = useRouter();

  // CentralHealth policy compliance: use proper medical record number as the source of truth
  // Using 'mrn' as the localStorage key for consistency with existing code and CentralHealth standards
  const [medicalRecordNumber, setMedicalRecordNumber] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem('mrn') || localStorage.getItem('medicalNumber') || "" : ""
  );
  
  // UI state
  const [currentPage, setCurrentPage] = useState("profile");
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<string>("");
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [isEditPhotoOpen, setIsEditPhotoOpen] = useState<boolean>(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is authenticated before loading profile
  useEffect(() => {
    // Check for authentication data
    const userEmail = localStorage.getItem('userEmail');
    const patientId = localStorage.getItem('patientId');
    const mrn = localStorage.getItem('mrn') || localStorage.getItem('medicalNumber');
    
    if (!userEmail && !patientId && !mrn) {
      // No authentication data found - redirect to login
      console.log('No authentication data found, redirecting to login');
      // Store intended destination
      localStorage.setItem('redirectAfterLogin', '/patient/profile');
      router.push('/login');
    } else {
      // Ensure these are set in localStorage for the usePatientProfile hook
      if (userEmail) localStorage.setItem('userEmail', userEmail);
      if (patientId) localStorage.setItem('patientId', patientId);
      if (mrn) {
        localStorage.setItem('mrn', mrn);
        localStorage.setItem('medicalNumber', mrn);  // Set both for compatibility
      }
    }
  }, [router]);
  
  // Only one call to usePatientProfile to avoid React hook rules violation
  // Call usePatientProfile with proper options and handle all potential field formats
  // to comply with CentralHealth's strict policy on medical record numbers
  const { 
    profile, 
    isLoading, 
    error, 
    qrCodeValue, 
    profilePhotoUrl,
    refreshProfile 
  } = usePatientProfile({
    loadProfilePhoto: true,
    forceRefresh: true // Force refresh to ensure we get the latest profile photo
  });
  
  // Dedicated effect to update profile image when profilePhotoUrl changes
  useEffect(() => {
    // Only update if we have a valid photo URL and we're not loading
    if (profilePhotoUrl && !isLoading) {
      console.log('Updating profile image with photo URL:', profilePhotoUrl.substring(0, 30) + '...');
      setProfileImage(profilePhotoUrl);
      
      // Also cache it for faster loads next time
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('patientProfilePhoto', profilePhotoUrl);
        } catch (e) {
          console.warn('Failed to cache profile photo:', e);
        }
      }
    }
  }, [profilePhotoUrl, isLoading]);
  
  // Handle file selection for photo upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhotoPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    setPhotoFile(file);
  };
  
  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (!photoFile || !profile?.mrn) {
      toast({
        title: "Error",
        description: "No photo selected or patient information missing",
        variant: "destructive",
      });
      return;
    }
    
    // Per CentralHealth standards: use MRN as the consistent medical ID
    const patientId = profile.mrn || profile.id;
    if (!patientId) {
      toast({
        title: "Error",
        description: "Patient identifier not found",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    try {
      // Use a timer to simulate progress (replace with real progress tracking if API supports it)
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      
      // Upload the photo to the API
      const response = await fetch(`/api/patients/${patientId}/profile-picture/upload`, {
        method: 'POST',
        body: formData,
        // No Content-Type header - browser will set it with boundary for FormData
      });
      
      clearInterval(progressTimer);
      setUploadProgress(100);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload photo');
      }
      
      const data = await response.json();
      
      // Update the profile photo with the new one
      if (data.imageUrl) {
        setProfileImage(data.imageUrl);
        // Force refresh profile to get the updated photo
        await refreshProfile();
        
        toast({
          title: "Success",
          description: "Profile photo updated successfully",
        });
        
        setIsEditPhotoOpen(false);
        setPhotoFile(null);
        setPhotoPreview('');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred while uploading the photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Open file browser
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Effect for clearing stale cache data on error
  useEffect(() => {
    if (error) {
      // Check if we have localStorage access
      if (typeof window !== 'undefined') {
        // Clear only non-essential cache, preserving authentication and medical ID
        // per CentralHealth policy: "Medical IDs must NEVER be regenerated for existing patients"
        const keysToPreserve = ['authToken', 'patient_session', 'mrn', 'medicalNumber'];
        const preservedValues: {[key: string]: string | null} = {};
        
        // Save values we need to keep
        keysToPreserve.forEach(key => {
          preservedValues[key] = localStorage.getItem(key);
        });
        
        // Clear specific profile-related keys only
        const profileKeys = ['profile', 'patientProfile', 'profileCache', 'patient_photo_'];
        Object.keys(localStorage).forEach(key => {
          if (profileKeys.some(prefix => key.startsWith(prefix)) && !keysToPreserve.includes(key)) {
            localStorage.removeItem(key);
          }
        });
        
        // Restore preserved values
        Object.entries(preservedValues).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value);
        });
        
        console.log('Cleared stale profile cache while preserving authentication and medical ID');
      }
    }
  }, [error]);

  // Default fallback photo - higher quality SVG with better contrast
  const defaultPhoto = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23f0f0f0' stroke='%23666666' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='9' r='6' fill='%23e0e0e0' stroke='%23999999'%3E%3C/circle%3E%3Cpath d='M20 21v-2a8 8 0 0 0-16 0v2' fill='%23e0e0e0' stroke='%23999999'%3E%3C/path%3E%3C/svg%3E"

  // Immediately load any cached profile image to improve perceived performance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedImage = localStorage.getItem('patientProfilePhoto') || localStorage.getItem('photo')
        if (cachedImage) {
          setProfileImage(cachedImage)
        } else {
          setProfileImage(defaultPhoto) // Set default immediately instead of waiting
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error)
        setProfileImage(defaultPhoto) // Set default on error
        setProfileImage(defaultPhoto) // Set default immediately instead of waiting
      }
    } else {
      setProfileImage(defaultPhoto) // Default during SSR
    }
  }, [])

  // Hospital code derived from profile or default
  const hospitalCode = profile?.hospitalCode || DEFAULT_HOSPITAL.id
  
  // Medical ID is already declared as medicalRecordNumber above
  
  // Add guaranteed loading timeout to prevent infinite loading
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      // Force exit from loading state after 5 seconds to prevent UI being stuck
      loadingTimeout = setTimeout(() => {
        console.warn('Profile page forced to exit loading state due to timeout');
        // If we have a cached profile photo, use it immediately
        if (profilePhotoUrl) {
          setProfileImage(profilePhotoUrl);
        } else {
          setProfileImage(defaultPhoto); // Set default photo on timeout
        }
      }, 5000);
    }
    
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [isLoading, profilePhotoUrl, defaultPhoto]);

  // Load profile data with better performance
  useEffect(() => {
    const loadPatientData = () => {
      // Early return if we're not in a browser environment (SSR)
      if (typeof window === 'undefined') {
        setProfileImage(defaultPhoto);
        return;
      }

      try {
        // Set medical ID from profile with standardized fields per CentralHealth standards
        // Type assertion to access the medicalRecordNumber property we added to the interface
        const patientProfile = profile as any; // Temporary type assertion to access all potential MRN fields
        const patientMrn = patientProfile?.medicalRecordNumber || patientProfile?.medicalNumber || patientProfile?.displayMedicalNumber || patientProfile?.mrn || ""
        if (patientMrn) {
          setMedicalRecordNumber(patientMrn)
          // Safe localStorage operations - consistently use 'mrn' as the key per existing system conventions
          // While also maintaining backward compatibility with 'medicalNumber'
          try {
            localStorage.setItem('mrn', patientMrn)
            // Also set medicalNumber for backward compatibility
            localStorage.setItem('medicalNumber', patientMrn)
          } catch (e) {
            console.warn('Unable to save medical record number to localStorage:', e)
          }
        }

        // Enhanced profile image loading - multi-source with priority
        const safeSetProfilePhoto = (photo: string) => {
          setProfileImage(photo);
          try {
            localStorage.setItem('patientProfilePhoto', photo);
          } catch (e) {
            console.warn('Unable to save profile photo to localStorage:', e);
          }
        };
        
        // Priority 1: User object in profile (often contains the most recent photo)
        // Use typeof check and type assertion to handle possible undefined fields
        const profileObj = profile as any; // Type assertion for flexibility
        if (profileObj && profileObj.User && profileObj.User.photo) {
          safeSetProfilePhoto(profileObj.User.photo);
          return; // Exit early if we have the image
        }
        
        // Priority 2: Check if user property exists with photo
        if (profileObj && profileObj.user && profileObj.user.photo) {
          safeSetProfilePhoto(profileObj.user.photo);
          return; // Exit early if we have the image
        }
        
        // Priority 3: Direct profile photo from API
        if (profile?.photo) {
          safeSetProfilePhoto(profile.photo);
          return; // Exit early if we have the image
        }
        
        // Priority 4: Check if profile has a profileImage property
        if (profile?.profileImage) {
          safeSetProfilePhoto(profile.profileImage);
          return; // Exit early if we have the image
        }
        
        // Priority 5: Check registration data in localStorage
        try {
          const registrationData = localStorage.getItem('patientRegistrationData');
          if (registrationData) {
            try {
              const parsedData = JSON.parse(registrationData);
              if (parsedData.photo) {
                setProfileImage(parsedData.photo);
                return; // Exit early if we have the image
              }
            } catch {}
          }
        } catch (e) {
          console.warn('Error accessing localStorage for registration data:', e);
        }
        
        // Priority 6: Check various localStorage keys for backward compatibility
        try {
          const photoSources = ['patientProfilePhoto', 'photo', 'userPhoto', 'profileImage'];
          for (const source of photoSources) {
            const savedImage = localStorage.getItem(source);
            if (savedImage) {
              setProfileImage(savedImage);
              return; // Exit early if we have the image
            }
          }
        } catch (e) {
          console.warn('Error accessing localStorage for photo sources:', e);
        }
        
        // If we get here, we couldn't find a profile image
        setProfileImage(defaultPhoto);
      } catch (error) {
        console.error('Error loading patient data:', error);
        // Still set default photo on error
        setProfileImage(defaultPhoto);
      }
    }
    
    loadPatientData()
  }, [profile, hospitalCode, defaultPhoto])

  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    setCurrentPage(page)
    
    if (page === "profile") {
      // Already on the profile page
      return
    } else if (page === "dashboard") {
      router.push("/patient/dashboard")
    } else {
      // Fix URL duplication issue
      if (page.startsWith('patient/')) {
        router.push(`/${page}`)
      } else {
        router.push(`/patient/${page}`)
      }
    }
  };

  // Prepare profile data for sidebar - use standardized medicalRecordNumber field per CentralHealth standards
  const profileDataForSidebar = {
    name: profile?.name || "",
    medicalNumber: medicalRecordNumber || "", // Using proper medical record number
    profileImage: profileImage || undefined,
  }

  // Handle print functionality
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Use memoization  // Generate content for optimization with improved loading state
  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center space-y-6">
            <Spinner className="w-12 h-12 text-blue-500" />
            <p className="text-lg font-medium">Loading patient profile...</p>
            {/* Show partial UI even during loading for better user experience */}
            <div className="w-full max-w-sm p-4 mt-4 border rounded-lg shadow-sm bg-white/50 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }


    
    if (error) {
      return (
        <div className="p-6 rounded-lg border border-red-200 bg-red-50">
          <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Profile Data</h2>
          <p className="text-red-600">Failed to load profile data in a reasonable time. Please try again.</p>
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={() => {
                // Clear cache but preserve authentication
                if (typeof window !== 'undefined') {
                  const authToken = localStorage.getItem('authToken');
                  const patientSession = localStorage.getItem('patient_session');
                  const medicalNumber = localStorage.getItem('mrn') || localStorage.getItem('medicalNumber');
                  
                  // Keep the MRN/Medical ID as required by CentralHealth policy
                  // "Medical IDs must NEVER be regenerated for existing patients"
                  localStorage.clear();
                  
                  if (authToken) localStorage.setItem('authToken', authToken);
                  if (patientSession) localStorage.setItem('patient_session', patientSession);
                  if (medicalNumber) {
                    localStorage.setItem('mrn', medicalNumber);
                    localStorage.setItem('medicalNumber', medicalNumber);
                  }
                }
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/patient/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    if (!profile) {
      return null;
    }

    return (
      <div>
        {/* Medical ID Card */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-800">Medical ID Card</CardTitle>
                </div>
                <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="bg-white p-3 rounded-lg shadow-sm flex-shrink-0">
                  {profile.qrCode ? (
                    <div className="w-[130px] h-[130px] relative">
                      <Image 
                        src={profile.qrCode} 
                        alt="Patient QR Code" 
                        fill 
                        sizes="130px"
                        style={{ objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div ref={qrCodeRef}>
                      <QRCode 
                        value={qrCodeValue || `CentralHealth:${medicalRecordNumber}`} 
                        size={130} 
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-grow space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar className="h-20 w-20 ring-4 ring-blue-50 shadow-md border border-blue-100">
                        <AvatarImage 
                          src={profilePhotoUrl || profileImage || profile?.photo || defaultPhoto} 
                          alt={profile.name || "Patient"}
                          onError={(e) => {
                            console.log('Error loading profile image, falling back to default');
                            (e.target as HTMLImageElement).src = defaultPhoto;
                          }}
                        />
                        <AvatarFallback className="bg-blue-600 text-white text-lg">
                          {profile.name?.substring(0, 2).toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <button 
                        onClick={() => setIsEditPhotoOpen(true)}
                        className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Edit photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{profile.dateOfBirth ? `DOB: ${profile.dateOfBirth}` : ''}</span>
                        {profile.gender && <>
                          <span>•</span>
                          <span>{profile.gender}</span>
                        </>}
                        {profile.bloodType && <>
                          <span>•</span>
                          <span>Blood Type: {profile.bloodType || "Unknown"}</span>
                        </>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative flex items-center space-x-2">
                      <p className="text-sm text-gray-500">Medical ID:</p>
                      <p className="font-medium">{medicalRecordNumber}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{profile.dateOfBirth || 'Not available'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-500">Insurance</p>
                      <p className="font-medium">{profile.insurance?.provider || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Summary Cards */}
          <div className="space-y-6">
            {/* Insurance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-500" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Provider</label>
                    <div className="text-gray-700">{profile.insurance?.provider || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Policy Number</label>
                    <div className="text-gray-700">{profile.insurance?.policyNumber || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Group Number</label>
                    <div className="text-gray-700">{profile.insurance?.group || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                    <div className="text-gray-700">{profile.insurance?.expirationDate || "Not specified"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-500">Spouse</p>
                      <div className="flex items-center mt-1 text-sm">
                        <Phone className="mr-1 h-4 w-4 text-gray-500" />
                        <span>(555) 123-4567</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Jane Smith</p>
                      <p className="text-sm text-gray-500">Sister</p>
                      <div className="flex items-center mt-1 text-sm">
                        <Phone className="mr-1 h-4 w-4 text-gray-500" />
                        <span>(555) 987-6543</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Patient Information */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5 text-gray-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="font-medium">{profile.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="font-medium">{profile.dob}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender</label>
                        <p className="font-medium">{profile.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Age</label>
                        <p className="font-medium">{profile.age}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Height</label>
                        <p className="font-medium">{profile.height || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Weight</label>
                        <p className="font-medium">{profile.weight || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-gray-500" />
                      Contact Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Address</label>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="font-medium">{profile.phone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Home Address</label>
                        <p className="font-medium">{profile.address || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="medical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                      Allergies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.allergies && profile.allergies.length > 0 ? (
                        profile.allergies.map((allergy, index) => {
                          // Handle both string and object formats with proper type checking
                          const allergyObj = allergy as any;
                          const allergyName = typeof allergy === 'string' ? allergy : (allergyObj?.name || 'Unknown Allergy');
                          const allergySeverity = typeof allergy === 'string' ? 'Unknown' : (allergyObj?.severity || 'Unknown');
                          
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <div className="font-medium">{allergyName}</div>
                              <Badge 
                                className={
                                  allergySeverity === "Severe" 
                                    ? "bg-red-100 text-red-800" 
                                    : allergySeverity === "Moderate"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {allergySeverity}
                              </Badge>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500">No allergies recorded.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="mr-2 h-5 w-5 text-blue-500" />
                      Medical Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.conditions && profile.conditions.length > 0 ? (
                        profile.conditions.map((condition: any, index: number) => {
                          // Explicitly type check and cast to prevent TypeScript errors
                          const conditionName = typeof condition === 'string' ? condition : (condObj?.name || 'Unknown Condition');
                          const conditionStatus = typeof condition === 'string' ? null : condObj?.status;
                          
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                                <div className="font-medium">{conditionName}</div>
                              </div>
                              {conditionStatus && (
                                <Badge className="ml-2">{conditionStatus}</Badge>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500">No medical conditions recorded.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-purple-500" />
                      Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.medications && profile.medications.length > 0 ? (
                        profile.medications.map((med: any, index: number) => {
                          // Handle both string and object formats with proper type checking
                          const medName = typeof med === 'string' ? med : (medObj?.name || 'Unknown Medication');
                          const medDosage = typeof med === 'string' ? '' : (medObj?.dosage || '');
                          const medFrequency = typeof med === 'string' ? '' : (medObj?.frequency || '');
                          
                          return (
                            <div key={index} className="flex items-start justify-between pb-3 border-b last:border-b-0 last:pb-0">
                              <div>
                                <p className="font-medium">{medName}</p>
                                {medDosage && <p className="text-sm text-gray-500">{medDosage}</p>}
                              </div>
                              {medFrequency && (
                                <Badge variant="outline" className="text-purple-600 border-purple-300">
                                  {medFrequency}
                                </Badge>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500">No medications recorded.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-teal-500" />
                      Visit History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-b pb-3">
                        <p className="font-medium">Annual Physical Examination</p>
                        <p className="text-sm text-gray-500">October 10, 2024</p>
                        <p className="text-sm mt-1">Dr. Sarah Johnson - Cardiology</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Follow-up Consultation</p>
                        <p className="text-sm text-gray-500">August 22, 2024</p>
                        <p className="text-sm mt-1">Dr. Michael Chen - Internal Medicine</p>
                      </div>
                      <div className="pb-3">
                        <p className="font-medium">Emergency Room Visit</p>
                        <p className="text-sm text-gray-500">June 5, 2024</p>
                        <p className="text-sm mt-1">Dr. Alicia Rodriguez - Emergency Medicine</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-gray-500" />
                      Medical Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">Lab Results - CBC</p>
                            <p className="text-xs text-gray-500">10/10/2024 - Dr. Johnson</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">EKG Results</p>
                            <p className="text-xs text-gray-500">10/10/2024 - Dr. Johnson</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">Discharge Summary</p>
                            <p className="text-xs text-gray-500">06/06/2024 - Dr. Rodriguez</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }, [isLoading, error, profile, medicalRecordNumber, profileImage, qrCodeValue, activeTab, defaultPhoto, handlePrint]);

  return (
    <>
      <DashboardLayout 
        currentPage={currentPage}
        onNavigate={handleNavigation}
        breadcrumbs={[{ label: "Profile" }]}
        hideProfileHeader={false}
        profileData={profileDataForSidebar}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {content}
        </div>
      </DashboardLayout>
      
      {/* Hidden file input for photo upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      
      {/* Edit Photo Dialog */}
      <Dialog open={isEditPhotoOpen} onOpenChange={setIsEditPhotoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Upload a new profile photo. This photo will be displayed on your patient profile.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {photoPreview ? (
              <div className="relative w-32 h-32 mx-auto">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-full ring-4 ring-blue-50 shadow-md border border-blue-100" 
                />
                <button
                  onClick={() => {
                    setPhotoPreview('');
                    setPhotoFile(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={triggerFileInput}
                className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-10 w-10 text-gray-400" />
                <p className="text-xs text-center text-gray-500 mt-2">
                  Click to upload
                </p>
              </div>
            )}
            
            {isUploading && (
              <div className="mx-auto w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-500 mt-1">{uploadProgress}% complete</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditPhotoOpen(false);
                setPhotoFile(null);
                setPhotoPreview('');
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            
            {!photoPreview ? (
              <Button onClick={triggerFileInput} disabled={isUploading}>
                Select Photo
              </Button>
            ) : (
              <Button 
                onClick={handlePhotoUpload} 
                disabled={!photoFile || isUploading}
                className={isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isUploading ? 'Uploading...' : 'Save Photo'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}