"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePatientProfile } from "@/hooks/use-patient-profile"

interface ProfileInfoProps {
  profileData?: {
    name?: string;
    medicalNumber?: string;
    profileImage?: string;
  };
}

/**
 * ProfileInfo component that displays patient information from API data first,
 * then from props, and finally from localStorage with smooth transitions
 */
export function ProfileInfo({ profileData }: ProfileInfoProps) {
  const [patientName, setPatientName] = useState("Patient")
  const [patientId, setPatientId] = useState("")
  const [medicalNumber, setMedicalNumber] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [initials, setInitials] = useState("P")
  
  // Use the usePatientProfile hook to get fresh API data
  const { profile, isLoading } = usePatientProfile();
  
  // Load patient data with priority: API > props > localStorage
  useEffect(() => {
    // Clear any stale data from localStorage first to fix caching issues
    const clearStaleCache = () => {
      // Keep a list of current valid medical IDs to prevent showing deleted patients
      const currentMedicalId = profile?.medicalNumber || profileData?.medicalNumber || localStorage.getItem('medicalNumber');
      
      // Only clear if we have a current medical ID to prevent data loss
      if (currentMedicalId) {
        // Get stored list of recently used medical IDs
        const recentMedicalIds = JSON.parse(localStorage.getItem('recentMedicalIds') || '[]');
        
        // Remove any medical IDs that aren't the current one
        if (!recentMedicalIds.includes(currentMedicalId)) {
          const updatedRecentIds = [currentMedicalId];
          localStorage.setItem('recentMedicalIds', JSON.stringify(updatedRecentIds));
        }
      }
    };
    
    clearStaleCache();
    
    // PRIORITY 1: Use fresh API data if available
    if (profile) {
      // Set patient name from API
      if (profile.name) {
        setPatientName(profile.name);
        setInitials(getInitials(profile.name));
        localStorage.setItem('currentPatientName', profile.name);
      }
      
      // Set medical number from API
      if (profile.medicalNumber) {
        setMedicalNumber(profile.medicalNumber);
        localStorage.setItem('medicalNumber', profile.medicalNumber);
      }
      
      // Set profile image from API
      if (profile.photo) {
        setProfileImage(profile.photo);
        // Update localStorage for consistency
        localStorage.setItem('patientProfilePhoto', profile.photo);
        localStorage.setItem('photo', profile.photo);
        localStorage.setItem('userPhoto', profile.photo);
      } else if (profile.qrCode) {
        // If there's no photo but we have a QR code, the patient is verified
        // We should check for a photo in props or localStorage
        handleBackupPhotoSources();
      }
      
      return; // Skip other sources if API data is available
    }
    
    // PRIORITY 2: Use props data if provided
    if (profileData) {
      if (profileData.name) {
        setPatientName(profileData.name);
        setInitials(getInitials(profileData.name));
        localStorage.setItem('currentPatientName', profileData.name);
      }
      
      if (profileData.medicalNumber) {
        setMedicalNumber(profileData.medicalNumber);
        localStorage.setItem('medicalNumber', profileData.medicalNumber);
        
        // Store this as a recent medical ID
        const recentMedicalIds = JSON.parse(localStorage.getItem('recentMedicalIds') || '[]');
        if (!recentMedicalIds.includes(profileData.medicalNumber)) {
          recentMedicalIds.push(profileData.medicalNumber);
          localStorage.setItem('recentMedicalIds', JSON.stringify(recentMedicalIds));
        }
      }
      
      if (profileData.profileImage) {
        setProfileImage(profileData.profileImage);
        localStorage.setItem('patientProfilePhoto', profileData.profileImage);
        localStorage.setItem('photo', profileData.profileImage);
        localStorage.setItem('userPhoto', profileData.profileImage);
      } else {
        // If no profile image in props, try localStorage
        handleBackupPhotoSources();
      }
      
      // If we have complete data from props, skip localStorage loading
      if (profileData.name && profileData.medicalNumber && profileData.profileImage) {
        return;
      }
    }
    
    // PRIORITY 3: Fall back to localStorage if needed
    loadFromLocalStorage();
    
  }, [profile, isLoading, profileData]);
  
  // Function to load profile photo from backup sources
  const handleBackupPhotoSources = () => {
    // Try all possible localStorage keys for the photo
    const storedProfilePhoto = localStorage.getItem('patientProfilePhoto');
    const storedPhotoLegacy = localStorage.getItem('photo');
    const storedUserPhoto = localStorage.getItem('userPhoto');
    
    if (storedProfilePhoto) {
      setProfileImage(storedProfilePhoto);
      return;
    }
    
    if (storedPhotoLegacy) {
      setProfileImage(storedPhotoLegacy);
      localStorage.setItem('patientProfilePhoto', storedPhotoLegacy);
      return;
    }
    
    if (storedUserPhoto) {
      setProfileImage(storedUserPhoto);
      localStorage.setItem('patientProfilePhoto', storedUserPhoto);
      return;
    }
    
    // Try registration data
    const registrationData = localStorage.getItem('patientRegistrationData');
    if (registrationData) {
      try {
        const parsedData = JSON.parse(registrationData);
        if (parsedData.photo) {
          setProfileImage(parsedData.photo);
          localStorage.setItem('patientProfilePhoto', parsedData.photo);
        }
      } catch (err) {
        console.error('Error parsing registration data:', err);
      }
    }
  };
  
  // Load data from localStorage as a last resort
  const loadFromLocalStorage = () => {
    try {
      // Name
      const currentPatientName = localStorage.getItem('currentPatientName');
      if (currentPatientName) {
        setPatientName(currentPatientName);
        setInitials(getInitials(currentPatientName));
      }
      
      // Medical ID
      const storedMedicalNumber = localStorage.getItem('medicalNumber');
      if (storedMedicalNumber) {
        setMedicalNumber(storedMedicalNumber);
      }
      
      // Patient ID
      const storedPatientId = localStorage.getItem('patientId');
      if (storedPatientId) {
        setPatientId(storedPatientId);
      }
      
      // Profile photo
      handleBackupPhotoSources();
      
      // If we still don't have a name, try registration data
      if (!currentPatientName) {
        const registrationData = localStorage.getItem('patientRegistrationData');
        if (registrationData) {
          try {
            const parsedData = JSON.parse(registrationData);
            if (parsedData.fullName) {
              setPatientName(parsedData.fullName);
              setInitials(getInitials(parsedData.fullName));
              localStorage.setItem('currentPatientName', parsedData.fullName);
            }
          } catch (err) {
            console.error('Error parsing registration data:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };
  
  // Helper function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "P";
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Helper to format name from email
  const formatNameFromEmail = (email: string) => {
    return email
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="flex items-center space-x-2 px-2 py-3 bg-blue-50 rounded-lg mx-2 transition-all duration-500 ease-in-out transform hover:bg-blue-100 cursor-pointer">
      <Avatar className="h-10 w-10 transition-all duration-300 animate-fadeIn ring-2 ring-white shadow-sm">
        {profileImage ? (
          <AvatarImage src={profileImage} alt={patientName} />
        ) : null}
        <AvatarFallback className="bg-blue-600 text-white">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 pl-1 transition-all duration-500 animate-fadeIn">
        <p className="text-sm font-medium text-gray-900 truncate">{patientName || "Patient"}</p>
        {medicalNumber && <p className="text-xs text-gray-500 truncate flex items-center"><span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>Med #: {medicalNumber}</p>}
      </div>
    </div>
  );
}
