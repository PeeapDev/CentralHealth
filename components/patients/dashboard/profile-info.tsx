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
    // If we have profileData from props, use that first (for consistency)
    if (profileData) {
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
        setProfileImage(profileData.profileImage);
        // Also store the profile image in localStorage
        localStorage.setItem('patientProfilePhoto', profileData.profileImage);
      }
      // If we have complete data from props, skip localStorage loading
      if (profileData.name && profileData.medicalNumber && profileData.profileImage) {
        return;
      }
    }
    
    // Otherwise, try to get patient data from multiple possible sources
    const loadPatientData = () => {
      try {
        // First try to get the current patient name from localStorage (highest priority)
        const currentPatientName = localStorage.getItem('currentPatientName');
        if (currentPatientName) {
          setPatientName(currentPatientName);
          setInitials(getInitials(currentPatientName));
        }
        
        // Get patient identifiers - prioritize consistent medical data
        const storedEmail = localStorage.getItem('userEmail');
        const storedPatientId = localStorage.getItem('patientId');
        const storedMedicalNumber = localStorage.getItem('medicalNumber');
        
        if (storedMedicalNumber) {
          setMedicalNumber(storedMedicalNumber);
        }
        
        if (storedPatientId) {
          setPatientId(storedPatientId);
        }
        
        // Try to get patient name from registration data only if we don't have a name yet
        if (!currentPatientName) {
          const registrationData = localStorage.getItem('patientRegistrationData');
          if (registrationData) {
            const parsedData = JSON.parse(registrationData);
            if (parsedData.fullName) {
              setPatientName(parsedData.fullName);
              setInitials(getInitials(parsedData.fullName));
            }
            
            // Get profile image if available
            if (parsedData.photo) {
              setProfileImage(parsedData.photo);
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
