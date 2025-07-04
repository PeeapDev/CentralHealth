import { prisma } from '@/lib/database/prisma-client';

/**
 * Type definitions for Prisma query results with included relations
 * These help TypeScript understand the structure after using include
 */
interface PatientWithRelations {
  id: string;
  mrn: string;
  name: string;
  dateOfBirth: Date | null;
  gender: string | null;
  medicalHistory: string | null;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted: boolean;
  hospitalId: string | null;
  lastVisit: Date | null;
  nextVisit: Date | null;
  note: string | null;
  qrCode: string | null;
  userId: string | null;
  // Included relations
  Hospital?: {
    id: string;
    name: string;
  } | null;
  User?: {
    id: string;
    email: string;
    name: string;
  } | null;
  ProfilePicture?: {
    id: string;
    imageUrl: string;
  } | null;
  Emails?: Array<{
    id: string;
    email: string;
    primary: boolean;
  }> | null;
  Phones?: Array<{
    id: string;
    number: string;
    primary: boolean;
  }> | null;
}

/**
 * Patient data interface
 * Based on the Prisma Patient model and CentralHealth requirements
 */
export interface PatientData {
  id: string;
  mrn: string;  // Medical Record Number in NHS-style 5-character alphanumeric format
  name: string;
  // Add fullName field to consistently display patient's full name
  fullName?: string;
  dateOfBirth?: Date;
  gender?: string;
  qrCode?: string;
  lastVisit?: Date;
  nextVisit?: Date;
  note?: string;
  hospitalId?: string;
  hospital?: {
    id: string;
    name: string;
  };
  email?: string;
  phone?: string;
  medicalHistory?: string;
  profilePicture?: {
    id?: string;
    imageUrl: string;
  };
  // User field from Patient model relation
  User?: {
    id: string;
    name: string;
    email: string;
  };
  onboardingCompleted?: boolean;
}

/**
 * Get a patient by their Medical Record Number (MRN)
 * 
 * According to CentralHealth requirements:
 * - MRNs are permanent and never regenerated
 * - They follow NHS-style 5-character alphanumeric format
 * - They must be stored in the mrn field
 */
/**
 * Get a patient by their Medical Record Number (MRN)
 * Performs thorough checks to ensure patient data consistency
 * and compliance with CentralHealth requirements
 */
export async function getPatientByMrn(mrn: string): Promise<PatientData | null> {
  try {
    console.log('[PatientService] Looking up patient with raw MRN:', mrn);
    
    // Normalize MRN to uppercase for consistent matching
    const normalizedMrn = mrn.toUpperCase();
    console.log('[PatientService] Normalized MRN:', normalizedMrn);
    
    // Validate MRN format (5-character alphanumeric)
    if (!normalizedMrn || normalizedMrn.length !== 5 || !/^[A-Z0-9]{5}$/.test(normalizedMrn)) {
      console.error('[PatientService] Invalid MRN format:', normalizedMrn);
      throw new Error('Invalid medical ID format');
    }
    
    // Check database connection
    try {
      // Simple query to verify database connection
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('[PatientService] Database connection verified');
    } catch (dbError) {
      console.error('[PatientService] Database connection error:', dbError);
      throw new Error('Database connection error');
    }
    
    console.log('[PatientService] Executing findUnique query for MRN:', normalizedMrn);
    
    // Find patient with the exact MRN using Prisma - include all relevant relationships
    // Use type assertion to help TypeScript understand the included relations
    const patient = await prisma.patient.findUnique({
      where: {
        mrn: normalizedMrn
      },
      include: {
        Hospital: {
          select: {
            id: true,
            name: true
          }
        },
        // Include user relationship if it exists
        User: true,
        // Include profile picture if available
        ProfilePicture: true,
        // Include email and phone information
        Emails: true,
        Phones: true
      }
    }) as unknown as PatientWithRelations | null;
    
    console.log('[PatientService] Query result:', patient ? 'Patient found' : 'Patient not found');
    
    // If no exact match, try a case-insensitive search as fallback
    if (!patient) {
      console.log('[PatientService] Trying case-insensitive search as fallback');
      const patients = await prisma.patient.findMany({
        where: {
          mrn: {
            mode: 'insensitive',
            equals: normalizedMrn
          }
        },
        take: 1,
        include: {
          Hospital: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }) as unknown as PatientWithRelations[];
      
      if (patients.length > 0) {
        console.log('[PatientService] Found patient with case-insensitive search');
        const patient = patients[0];
        // Convert to PatientData format to fix TypeScript issues
        // Map all relevant patient data to our return format
        const patientData: PatientData = {
          id: patient.id,
          mrn: patient.mrn, // Medical Record Number (permanent, never regenerated)
          name: patient.name,
          dateOfBirth: patient.dateOfBirth || undefined,
          gender: patient.gender || undefined,
          qrCode: patient.qrCode || undefined,
          lastVisit: patient.lastVisit || undefined,
          nextVisit: patient.nextVisit || undefined,
          note: patient.note || undefined,
          hospitalId: patient.hospitalId || undefined,
          hospital: patient.Hospital ? {
            id: patient.Hospital.id,
            name: patient.Hospital.name
          } : patient.hospitalId ? { id: patient.hospitalId, name: 'Unknown Hospital' } : undefined,
          medicalHistory: patient.medicalHistory || undefined,
          onboardingCompleted: patient.onboardingCompleted,
          // Extract email from Emails array if available
          email: patient.Emails && patient.Emails.length > 0 ? 
                 patient.Emails[0].email : 
                 patient.User?.email,
          // Extract phone from Phones array if available
          phone: patient.Phones && patient.Phones.length > 0 ? 
                 patient.Phones[0].number : 
                 undefined,
          // Extract profile picture if available
          profilePicture: patient.ProfilePicture ? {
            imageUrl: patient.ProfilePicture.imageUrl
          } : undefined
        };
        
        console.log('[PatientService] Returning mapped patient data:', {
          id: patientData.id,
          mrn: patientData.mrn,
          name: patientData.name,
          email: patientData.email ? '[REDACTED FOR LOG]' : undefined
        });
        
        return patientData;
      }
      
      // As a last resort, search by the last 5 characters if the scanned QR contains more than 5 chars
      if (mrn.length > 5) {
        const lastFiveChars = mrn.slice(-5).toUpperCase();
        console.log('[PatientService] Trying with last 5 chars of longer code:', lastFiveChars);
        
        const lastFiveMatches = await prisma.patient.findMany({
          where: {
            mrn: lastFiveChars
          },
          take: 1,
          include: {
            Hospital: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }) as unknown as PatientWithRelations[];
        
        if (lastFiveMatches.length > 0) {
          console.log('[PatientService] Found match using last 5 characters');
          const patient = lastFiveMatches[0];
          // Convert to PatientData format using the same mapping as above
          const patientData: PatientData = {
            id: patient.id,
            mrn: patient.mrn, // Medical Record Number (permanent, never regenerated)
            name: patient.name,
            dateOfBirth: patient.dateOfBirth || undefined,
            gender: patient.gender || undefined,
            qrCode: patient.qrCode || undefined,
            lastVisit: patient.lastVisit || undefined,
            nextVisit: patient.nextVisit || undefined,
            note: patient.note || undefined,
            hospitalId: patient.hospitalId || undefined,
            hospital: patient.Hospital ? {
              id: patient.Hospital.id,
              name: patient.Hospital.name
            } : patient.hospitalId ? { id: patient.hospitalId, name: 'Unknown Hospital' } : undefined,
            medicalHistory: patient.medicalHistory || undefined,
            onboardingCompleted: patient.onboardingCompleted,
            // Extract email from Emails array if available
            email: patient.Emails && patient.Emails.length > 0 ? 
                   patient.Emails[0].email : 
                   patient.User?.email,
            // Extract phone from Phones array if available
            phone: patient.Phones && patient.Phones.length > 0 ? 
                   patient.Phones[0].number : 
                   undefined,
            // Extract profile picture if available
            profilePicture: patient.ProfilePicture ? {
              imageUrl: patient.ProfilePicture.imageUrl
            } : undefined
          };
          
          console.log('[PatientService] Returning mapped patient data from last 5 chars search:', {
            id: patientData.id,
            mrn: patientData.mrn,
            name: patientData.name,
          });
          
          return patientData;
        }
      }
      
      console.log('[PatientService] No patient found with MRN:', normalizedMrn);
      return null;
    }
    
    // Handle direct match case (if we didn't return in the fallback logic)
    if (patient) {
      // Log more detailed data about the found patient (excluding sensitive info)
      console.log('[PatientService] Found patient details:', {
        id: patient.id,
        mrn: patient.mrn,
        name: patient.name,
        hospitalId: patient.hospitalId
      });
      
      // We found a direct match, map the patient data comprehensively
      const patientData: PatientData = {
        id: patient.id,
        mrn: patient.mrn, // Permanent medical ID per CentralHealth policy
        name: patient.name,
        fullName: patient.User?.name || patient.name || '',
        dateOfBirth: patient.dateOfBirth || undefined,
        gender: patient.gender || undefined,
        qrCode: patient.qrCode || undefined,
        lastVisit: patient.lastVisit || undefined,
        nextVisit: patient.nextVisit || undefined,
        note: patient.note || undefined,
        hospitalId: patient.hospitalId || undefined,
        hospital: patient.Hospital ? {
          id: patient.Hospital.id,
          name: patient.Hospital.name
        } : undefined,
        medicalHistory: patient.medicalHistory || undefined,
        onboardingCompleted: patient.onboardingCompleted,
        User: patient.User ? {
          id: patient.User.id,
          name: patient.User.name,
          email: patient.User.email
        } : undefined,
        // Extract email from Emails array if available
        email: patient.Emails && patient.Emails.length > 0 ? 
               patient.Emails[0].email : 
               patient.User?.email,
        // Extract phone from Phones array if available
        phone: patient.Phones && patient.Phones.length > 0 ? 
               patient.Phones[0].number : 
               undefined,
        // Extract profile picture if available
        profilePicture: patient.ProfilePicture ? {
          imageUrl: patient.ProfilePicture.imageUrl
        } : undefined
      };
      
      return patientData;
    }
    
    // If we get here, no patient was found
    return null;
  } catch (error) {
    console.error('Database error fetching patient by MRN:', error);
    throw new Error('Failed to retrieve patient data');
  }
}

/**
 * Search for patients by name or MRN
 * Follows CentralHealth data handling guidelines
 */
export async function searchPatients(searchTerm: string, limit: number = 10): Promise<PatientData[]> {
  try {
    const normalizedSearchTerm = searchTerm.trim();
    
    // Check if search term could be an MRN
    const isMrnFormat = normalizedSearchTerm.length === 5 && /^[A-Z0-9]{5}$/i.test(normalizedSearchTerm);
    
    // Create search conditions based on search term
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          // Search by name (case insensitive)
          {
            name: {
              contains: normalizedSearchTerm,
              mode: 'insensitive'
            }
          },
          // If format matches MRN pattern, search by exact MRN
          ...(isMrnFormat ? [{
            mrn: normalizedSearchTerm.toUpperCase()
          }] : [])
        ]
      },
      include: {
        Hospital: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: limit
    });
    
    // Format and return patient data
    return patients.map(patient => ({
      id: patient.id,
      mrn: patient.mrn,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth || undefined,
      gender: patient.gender || undefined,
      qrCode: patient.qrCode || undefined,
      lastVisit: patient.lastVisit || undefined,
      nextVisit: patient.nextVisit || undefined,
      note: patient.note || undefined,
      hospitalId: patient.hospitalId || undefined,
      hospital: patient.Hospital ? {
        id: patient.Hospital.id,
        name: patient.Hospital.name
      } : undefined
    }));
  } catch (error) {
    console.error('Database error searching patients:', error);
    throw new Error('Failed to search patient records');
  }
}
