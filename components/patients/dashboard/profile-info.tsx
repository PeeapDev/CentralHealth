"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileInfoProps {
  profileData?: {
    name?: string;
    medicalNumber?: string;
    profileImage?: string;
  };
}

/**
 * ProfileInfo component that displays patient information from localStorage
 * and registration data with smooth transitions
 */
export function ProfileInfo({ profileData }: ProfileInfoProps) {
  const [patientName, setPatientName] = useState("Patient")
  const [patientId, setPatientId] = useState("")
  const [medicalNumber, setMedicalNumber] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [initials, setInitials] = useState("P")
  
  // Load patient data from props or localStorage
  useEffect(() => {
    console.log('DEBUG: ProfileInfo component - Loading patient profile data');
    
    // If we have profileData from props, use that first (for consistency)
    if (profileData) {
      console.log('DEBUG: ProfileInfo received profileData from props:', {
        name: profileData.name ? 'present' : 'missing',
        medicalNumber: profileData.medicalNumber ? 'present' : 'missing',
        profileImage: profileData.profileImage ? 'present (truncated)' : 'missing'
      });
      
      if (profileData.name) {
        // Always use the full name from profileData passed from the dashboard
        setPatientName(profileData.name);
        setInitials(getInitials(profileData.name));
        
        // Also store this name in localStorage for consistency
        localStorage.setItem('currentPatientName', profileData.name);
      }
      
      if (profileData.medicalNumber) {
        setMedicalNumber(profileData.medicalNumber);
      }
      
      if (profileData.profileImage) {
        console.log('DEBUG: Setting profile image from props');
        setProfileImage(profileData.profileImage);
        // Also store the profile image in localStorage for cross-component consistency
        localStorage.setItem('patientProfilePhoto', profileData.profileImage);
      } else {
        console.log('DEBUG: No profile image in props, will try localStorage');
      }
      
      // If we have complete data from props, skip localStorage loading
      if (profileData.name && profileData.medicalNumber && profileData.profileImage) {
        return;
      }
    }
    
    // Otherwise, try to get patient data from multiple possible sources
    const loadPatientData = () => {
      try {
        console.log('DEBUG: Loading patient data from localStorage');
        
        // First try to get the current patient name from localStorage (highest priority)
        const currentPatientName = localStorage.getItem('currentPatientName');
        if (currentPatientName) {
          console.log('DEBUG: Found patient name in localStorage');
          setPatientName(currentPatientName);
          setInitials(getInitials(currentPatientName));
        }
        
        // Get patient identifiers - prioritize consistent medical data
        const storedEmail = localStorage.getItem('userEmail');
        const storedPatientId = localStorage.getItem('patientId');
        const storedMedicalNumber = localStorage.getItem('medicalNumber');
        
        if (storedMedicalNumber) {
          console.log('DEBUG: Found medical number in localStorage');
          setMedicalNumber(storedMedicalNumber);
        }
        
        if (storedPatientId) {
          setPatientId(storedPatientId);
        }
        
        // ENHANCED PROFILE PHOTO LOADING: Try all possible sources
        const loadProfilePhoto = () => {
          // Check all possible localStorage keys for the photo
          const storedProfilePhoto = localStorage.getItem('patientProfilePhoto');
          const storedPhotoLegacy = localStorage.getItem('photo');
          const storedUserPhoto = localStorage.getItem('userPhoto');
          
          // Try patientProfilePhoto first (primary storage key)
          if (storedProfilePhoto) {
            console.log('DEBUG: Found profile photo in patientProfilePhoto key');
            setProfileImage(storedProfilePhoto);
            // Ensure the photo is stored in all keys for cross-component consistency
            localStorage.setItem('photo', storedProfilePhoto);
            localStorage.setItem('userPhoto', storedProfilePhoto);
            return true;
          }
          
          // Try legacy photo keys
          if (storedPhotoLegacy) {
            console.log('DEBUG: Found profile photo in legacy photo key');
            setProfileImage(storedPhotoLegacy);
            // Store in primary key for future consistency
            localStorage.setItem('patientProfilePhoto', storedPhotoLegacy);
            localStorage.setItem('userPhoto', storedPhotoLegacy);
            return true;
          }
          
          if (storedUserPhoto) {
            console.log('DEBUG: Found profile photo in userPhoto key');
            setProfileImage(storedUserPhoto);
            // Store in primary key for future consistency
            localStorage.setItem('patientProfilePhoto', storedUserPhoto);
            localStorage.setItem('photo', storedUserPhoto);
            return true;
          }
          
          // Try to get patient photo from registration data
          const registrationData = localStorage.getItem('patientRegistrationData');
          if (registrationData) {
            try {
              const parsedData = JSON.parse(registrationData);
              if (parsedData.photo) {
                console.log('DEBUG: Found profile photo in registration data');
                setProfileImage(parsedData.photo);
                // Store in all keys for consistency
                localStorage.setItem('patientProfilePhoto', parsedData.photo);
                localStorage.setItem('photo', parsedData.photo);
                localStorage.setItem('userPhoto', parsedData.photo);
                return true;
              }
            } catch (parseErr) {
              console.error('Error parsing registration data:', parseErr);
            }
          }
          
          return false;
        };
        
        // Load profile photo from any source
        const photoLoaded = loadProfilePhoto();
        if (!photoLoaded) {
          console.log('DEBUG: No profile photo found in any storage location');
        }
        
        // Try to get patient name from registration data only if we don't have a name yet
        if (!currentPatientName) {
          const registrationData = localStorage.getItem('patientRegistrationData');
          if (registrationData) {
            try {
              const parsedData = JSON.parse(registrationData);
              if (parsedData.fullName) {
                console.log('DEBUG: Found patient name in registration data');
                setPatientName(parsedData.fullName);
                setInitials(getInitials(parsedData.fullName));
                // Store for consistency
                localStorage.setItem('currentPatientName', parsedData.fullName);
              }
            } catch (parseErr) {
              console.error('Error parsing registration data:', parseErr);
            }
          } else if (storedEmail) {
            // Use email as fallback for name
            const nameFromEmail = storedEmail.split('@')[0];
            setPatientName(formatNameFromEmail(nameFromEmail));
            setInitials(getInitials(nameFromEmail));
          }
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    };
    
    loadPatientData();
  }, [profileData, profileImage]);
  
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
