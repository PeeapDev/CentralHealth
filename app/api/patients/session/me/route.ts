import { NextRequest, NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { prisma } from "@/lib/prisma";

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
    
    // Get fresh patient data from database
    const patient = await prisma.patient.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        medicalNumber: true,
        email: true,
        name: true,
        gender: true,
        birthDate: true,
        phone: true,
        active: true,
        resourceType: true,
        hospitalId: true,
        telecom: true,
        address: true,
        photo: true,
        contact: true,     // We'll use contact to store some onboarding data
        extension: true,   // We'll use extension to store onboarding status
        medicalHistory: true // For allergies and conditions
      }
    });
    
    if (!patient) {
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
      const nameString = typeof patient.name === 'string' ? patient.name : JSON.stringify([]);
      const telecomString = typeof patient.telecom === 'string' ? patient.telecom : JSON.stringify([]);
      const addressString = typeof patient.address === 'string' ? patient.address : JSON.stringify([]);
      
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
    
    // Parse extension field to check for onboarding status
    let extensionData: ExtensionData = {};
    let medicalHistoryData: MedicalHistoryData = {};
    let contactData: ContactData = {};
    
    console.log('DEBUG Patient data from session/me:', { 
      id: patient.id,
      hasExtension: !!patient.extension,
      extensionType: patient.extension ? typeof patient.extension : 'none',
      extensionValue: patient.extension
    });
    
    try {
      if (patient.extension && typeof patient.extension === 'string') {
        extensionData = JSON.parse(patient.extension) as ExtensionData;
        console.log('DEBUG Parsed extension data:', extensionData);
      } else if (patient.extension) {
        extensionData = patient.extension as ExtensionData;
        console.log('DEBUG Non-string extension data:', extensionData);
      }
      
      if (patient.medicalHistory && typeof patient.medicalHistory === 'string') {
        medicalHistoryData = JSON.parse(patient.medicalHistory) as MedicalHistoryData;
      } else if (patient.medicalHistory) {
        medicalHistoryData = patient.medicalHistory as MedicalHistoryData;
      }
      
      if (patient.contact && typeof patient.contact === 'string') {
        contactData = JSON.parse(patient.contact) as ContactData;
      } else if (patient.contact) {
        contactData = patient.contact as ContactData;
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
    
    // Extract blood group from extension
    const bloodGroup = extensionData.bloodGroup || '';
    
    // Extract allergies and chronic conditions from medicalHistory
    const allergies = medicalHistoryData.allergies || [];
    const chronicConditions = medicalHistoryData.chronicConditions || [];
    
    // Extract emergency contact from contact field
    const emergencyContact = contactData.emergency || {};
    
    // Format the patient data for the response
    const formattedPatient = {
      ...patient,
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
      // Ensure basic fields are available
      email: patient.email || '',
      phoneNumber: patient.phone || ''
    };
    
    // Return patient data
    return NextResponse.json({
      authenticated: true,
      onboardingCompleted,
      patient: formattedPatient
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
