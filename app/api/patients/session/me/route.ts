import { NextRequest, NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { prisma } from "@/lib/prisma";

// Debug flag
const DEBUG = true;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get patient session
    const session = await getPatientSession();
    
    if (!session || !session.isLoggedIn) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Extract patient ID and email from session
    const patientId = session.id;
    const patientEmail = session.email;
    
    if (DEBUG) console.log('DEBUG: Looking up patient with:', { patientId, patientEmail });
    
    // Get the patient with its linked user using the proper one-to-one relation
    const patientWithUser = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true
      }
    });
    
    if (!patientWithUser) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }
    
    // Parse JSON fields
    let nameData;
    let telecomData;
    let addressData;
    
    try {
      // Ensure all fields are strings before parsing
      const nameString = typeof patientWithUser.name === 'string' ? patientWithUser.name : JSON.stringify([]);
      const telecomString = typeof patientWithUser.telecom === 'string' ? patientWithUser.telecom : JSON.stringify([]);
      const addressString = typeof patientWithUser.address === 'string' ? patientWithUser.address : JSON.stringify([]);
      
      nameData = JSON.parse(nameString);
      telecomData = JSON.parse(telecomString);
      addressData = JSON.parse(addressString);
    } catch (error) {
      console.error("Error parsing patient JSON fields:", error);
      nameData = [];
      telecomData = [];
      addressData = [];
    }
    
    // Define types for our JSON data structures
    interface ExtensionData {
      onboardingCompleted?: boolean;
      bloodGroup?: string;
      medicalId?: string;
      qrCode?: string;
      userId?: string; // Store linked User ID here
      [key: string]: any;
    }
    
    interface MedicalHistoryData {
      allergies?: string[];
      chronicConditions?: string[];
      organDonor?: boolean;
      [key: string]: any;
    }
    
    interface EmergencyContact {
      name?: string;
      relationship?: string;
      phone?: string;
      [key: string]: any;
    }
    
    interface ContactData {
      emergency?: EmergencyContact;
      [key: string]: any;
    }
    
    // Define structure for combined User-Patient data
    interface UserProfile {
      id: string;
      role: string;
      name?: string;
      email: string;
      profileImage?: string;
    }
    
    interface FormattedPatient extends Record<string, any> {
      id: string;
      firstName: string;
      lastName: string;
      name: string;
      medicalId?: string;
      medicalNumber?: string;
      phn?: string;
      onboardingCompleted: boolean;
      bloodGroup?: string;
      allergies?: string[];
      chronicConditions?: string[];
      userId?: string;
      userProfile?: UserProfile;
    }
    
    // Parse extension field to check for onboarding status
    let extensionData: ExtensionData = {};
    let medicalHistoryData: MedicalHistoryData = {};
    let contactData: ContactData = {};
    
    console.log('DEBUG Patient data from session/me:', { 
      id: patientWithUser.id,
      hasExtension: !!patientWithUser.extension,
      extensionType: patientWithUser.extension ? typeof patientWithUser.extension : 'none',
      extensionValue: patientWithUser.extension
    });
    
    try {
      if (patientWithUser.extension && typeof patientWithUser.extension === 'string') {
        extensionData = JSON.parse(patientWithUser.extension) as ExtensionData;
        console.log('DEBUG Parsed extension data:', extensionData);
      } else if (patientWithUser.extension) {
        extensionData = patientWithUser.extension as ExtensionData;
        console.log('DEBUG Non-string extension data:', extensionData);
      }
      
      if (patientWithUser.medicalHistory && typeof patientWithUser.medicalHistory === 'string') {
        medicalHistoryData = JSON.parse(patientWithUser.medicalHistory) as MedicalHistoryData;
      } else if (patientWithUser.medicalHistory) {
        medicalHistoryData = patientWithUser.medicalHistory as MedicalHistoryData;
      }
      
      if (patientWithUser.contact && typeof patientWithUser.contact === 'string') {
        contactData = JSON.parse(patientWithUser.contact) as ContactData;
      } else if (patientWithUser.contact) {
        contactData = patientWithUser.contact as ContactData;
      }
    } catch (error) {
      console.error("Error parsing patient extension or custom fields:", error);
    }
    
    // Check if onboarding is completed - make very strict comparison
    // A newly registered user should have explicitly set onboardingCompleted: false
    // Default to false for new users without the flag
    let onboardingCompleted = false;
    
    // Only consider onboarding completed if extensionData.onboardingCompleted is explicitly true
    if (extensionData && extensionData.onboardingCompleted === true) {
      onboardingCompleted = true;
    }
    
    console.log('DEBUG Final onboarding status:', { 
      onboardingCompleted,
      extensionDataExists: !!extensionData,
      onboardingInExtension: extensionData?.onboardingCompleted
    });
    
    // Extract important data from extension
    const bloodGroup = extensionData.bloodGroup || '';
    const medicalId = extensionData.medicalId || patientWithUser.medicalNumber || '';
    
    // Extract allergies and chronic conditions from medicalHistory
    const allergies = medicalHistoryData.allergies || [];
    const chronicConditions = medicalHistoryData.chronicConditions || [];
    
    // Extract emergency contact from contact field
    const emergencyContact = contactData.emergency || {};
    
    // Format the patient data for the response - merge with user data if available
    const formattedPatient = {
      ...patientWithUser,
      firstName: nameData?.[0]?.given?.[0] || "",
      lastName: nameData?.[0]?.family || "",
      name: `${nameData?.[0]?.given?.[0] || ""} ${nameData?.[0]?.family || ""}`.trim(),
      // Include parsed data
      nameData,
      telecomData,
      addressData,
      // Include onboarding data
      onboardingCompleted,
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContact,
      // Ensure PHN/medical ID is consistently available
      medicalId: medicalId,
      // For backward compatibility and different naming conventions
      medicalNumber: patientWithUser.medicalNumber || medicalId,
      phn: medicalId || patientWithUser.medicalNumber,
      // Ensure basic fields are available
      email: patientWithUser.email || (patientWithUser.user?.email || ''),
      phoneNumber: patientWithUser.phone || ''
    };
    
    // Create the formatted patient with proper typing
    const formattedPatientWithUser: FormattedPatient = { 
      ...formattedPatient,
    };
    
    // If we have user data, combine it with patient data
    if (patientWithUser.user) {
      // Add user information to the patient record
      formattedPatientWithUser.userId = patientWithUser.user.id;
      formattedPatientWithUser.userProfile = {
        id: patientWithUser.user.id,
        role: patientWithUser.user.role,
        name: patientWithUser.user.name || formattedPatientWithUser.name,
        email: patientWithUser.user.email,
        profileImage: patientWithUser.user.profileImage || patientWithUser.photo as string
      };
      
      // Since we're using one-to-one relation, we don't need to update extension anymore
      // but we'll keep the code for backwards compatibility with existing data
      if (!extensionData.userId) {
        try {
          // Only update if we need to add the userId
          await prisma.patient.update({
            where: { id: patientId },
            data: {
              extension: JSON.stringify({
                ...extensionData,
                userId: patientWithUser.user.id  // Store the userId in extension for future reference
              })
            }
          });
          
          if (DEBUG) {
            console.log(`DEBUG: Updated patient extension with userId=${patientWithUser.user.id}`);
          }
        } catch (error) {
          console.error('Failed to update patient extension with userId:', error);
          // Non-critical error, continue without failing the request
        }
      }
      
      if (DEBUG) {
        console.log('DEBUG: Merged user data into patient response');
      }
    }
    
    // Log the key fields for debugging
    if (DEBUG) {
      console.log('DEBUG Patient session data:', {
        id: formattedPatientWithUser.id,
        medicalNumber: formattedPatientWithUser.medicalNumber,
        medicalId: formattedPatientWithUser.medicalId,
        phn: formattedPatientWithUser.phn,
        onboardingCompleted: formattedPatientWithUser.onboardingCompleted,
        // Debug information about user-patient linkage
        userId: formattedPatientWithUser.userId || 'Not linked',
        patientId: patientWithUser.id,
        hasUserProfile: !!patientWithUser.user
      });
    }
    
    // Return patient data
    return NextResponse.json({
      authenticated: true,
      onboardingCompleted,
      patient: formattedPatientWithUser
    });
  } catch (error: any) {
    console.error("Error getting patient session:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to get patient session",
        authenticated: false
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
