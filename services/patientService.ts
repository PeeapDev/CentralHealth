import { prisma } from '@/lib/database/prisma-client';

/**
 * Patient data interface
 * Based on the Prisma Patient model and CentralHealth requirements
 */
export interface PatientData {
  id: string;
  mrn: string;  // Medical Record Number in NHS-style 5-character alphanumeric format
  name: string;
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
}

/**
 * Get a patient by their Medical Record Number (MRN)
 * 
 * According to CentralHealth requirements:
 * - MRNs are permanent and never regenerated
 * - They follow NHS-style 5-character alphanumeric format
 * - They must be stored in the mrn field
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
    
    // Find patient with the exact MRN using Prisma
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
        }
      }
    });
    
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
      });
      
      if (patients.length > 0) {
        console.log('[PatientService] Found patient with case-insensitive search');
        const patient = patients[0];
        // Convert to PatientData format to fix TypeScript issues
        return {
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
        };
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
        });
        
        if (lastFiveMatches.length > 0) {
          console.log('[PatientService] Found match using last 5 characters');
          const patient = lastFiveMatches[0];
          // Convert to PatientData format to fix TypeScript issues
          return {
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
          };
        }
      }
      
      console.log('[PatientService] No patient found with MRN:', normalizedMrn);
      return null;
    }
    
    // Log more detailed data about the found patient (excluding sensitive info)
    console.log('[PatientService] Found patient details:', {
      id: patient.id,
      mrn: patient.mrn,
      name: patient.name,
      hospitalId: patient.hospitalId
    });
    
    // Format and return patient data
    return {
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
    };
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
