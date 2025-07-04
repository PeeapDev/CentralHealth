import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * API route to complete antenatal registration
 * 
 * This follows CentralHealth System requirements:
 * - We preserve existing medical IDs (mrn field) exactly as is
 * - We maintain consistent patient data across hospital transfers
 * - We properly link all patient records with their permanent ID
 */
export async function POST(request: Request) {
  try {
    // Ensure authenticated user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const { patientId, hospitalName, formData, isTransfer, sourceHospital } = await request.json();
    
    if (!patientId || !hospitalName || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get patient to ensure we use the correct permanent medical ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { 
        id: true, 
        mrn: true,  // Must be preserved exactly as is
        name: true
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (!patient.mrn) {
      return NextResponse.json({ 
        error: 'Patient has no medical ID. Medical ID is required before antenatal registration' 
      }, { status: 400 });
    }

    // Get hospital
    const hospital = await prisma.hospital.findFirst({
      where: { name: hospitalName }
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Get existing registration or create new if it doesn't exist
    let antenatalRegistration = await prisma.antenatalRegistration.findFirst({
      where: { patientId: patientId },
      include: { 
        bookingVisit: true,
        medicalHistory: true,
        physicalExam: true,
        labResults: true,
        visitSchedule: true
      }
    });

    const userId = session.user?.id || 'system';
    const now = new Date();

    // Handle transaction to ensure data integrity
    if (antenatalRegistration) {
      // Update existing registration
      
      // 1. Update medical history
      await prisma.antenatalMedicalHistory.upsert({
        where: { id: antenatalRegistration.medicalHistory?.id || 'create-new' },
        update: {
          previousPregnancies: formData.medicalHistory.previousPregnancies,
          complications: formData.medicalHistory.complications,
          chronicConditions: formData.medicalHistory.chronicConditions,
          allergies: formData.medicalHistory.allergies,
          medications: formData.medicalHistory.medications,
          surgicalHistory: formData.medicalHistory.surgicalHistory,
          updatedAt: now,
          updatedBy: userId
        },
        create: {
          previousPregnancies: formData.medicalHistory.previousPregnancies,
          complications: formData.medicalHistory.complications,
          chronicConditions: formData.medicalHistory.chronicConditions,
          allergies: formData.medicalHistory.allergies,
          medications: formData.medicalHistory.medications,
          surgicalHistory: formData.medicalHistory.surgicalHistory,
          createdBy: userId,
          AntenatalRegistration: {
            connect: { id: antenatalRegistration.id }
          }
        }
      });
      
      // 2. Update physical exam
      await prisma.antenatalPhysicalExam.upsert({
        where: { id: antenatalRegistration.physicalExam?.id || 'create-new' },
        update: {
          height: formData.physicalExam.height,
          weight: formData.physicalExam.weight,
          bmi: formData.physicalExam.bmi,
          bloodPressure: formData.physicalExam.bloodPressure,
          pulse: formData.physicalExam.pulse,
          temperature: formData.physicalExam.temperature,
          updatedAt: now,
          updatedBy: userId
        },
        create: {
          height: formData.physicalExam.height,
          weight: formData.physicalExam.weight,
          bmi: formData.physicalExam.bmi,
          bloodPressure: formData.physicalExam.bloodPressure,
          pulse: formData.physicalExam.pulse,
          temperature: formData.physicalExam.temperature,
          createdBy: userId,
          AntenatalRegistration: {
            connect: { id: antenatalRegistration.id }
          }
        }
      });
      
      // 3. Update lab results
      await prisma.antenatalLabResults.upsert({
        where: { id: antenatalRegistration.labResults?.id || 'create-new' },
        update: {
          bloodGroup: formData.labRequests.bloodGroup,
          hemoglobin: formData.labRequests.hemoglobin,
          hivStatus: formData.labRequests.hivStatus,
          hepatitis: formData.labRequests.hepatitis,
          urinalysis: formData.labRequests.urinalysis,
          updatedAt: now,
          updatedBy: userId
        },
        create: {
          bloodGroup: formData.labRequests.bloodGroup,
          hemoglobin: formData.labRequests.hemoglobin,
          hivStatus: formData.labRequests.hivStatus,
          hepatitis: formData.labRequests.hepatitis,
          urinalysis: formData.labRequests.urinalysis,
          createdBy: userId,
          AntenatalRegistration: {
            connect: { id: antenatalRegistration.id }
          }
        }
      });
      
      // 4. Update visit schedule
      await prisma.antenatalVisitSchedule.upsert({
        where: { id: antenatalRegistration.visitSchedule?.id || 'create-new' },
        update: {
          nextVisitDate: formData.visitPlan.nextVisitDate ? new Date(formData.visitPlan.nextVisitDate) : null,
          visitSchedule: formData.visitPlan.visitSchedule,
          updatedAt: now,
          updatedBy: userId
        },
        create: {
          nextVisitDate: formData.visitPlan.nextVisitDate ? new Date(formData.visitPlan.nextVisitDate) : null,
          visitSchedule: formData.visitPlan.visitSchedule,
          createdBy: userId,
          AntenatalRegistration: {
            connect: { id: antenatalRegistration.id }
          }
        }
      });
      
      // 5. Update registration with risk factors and hospital transfer info
      await prisma.antenatalRegistration.update({
        where: { id: antenatalRegistration.id },
        data: {
          riskFactors: formData.complications.riskFactors,
          riskLevel: formData.complications.riskLevel,
          updatedAt: now,
          updatedBy: userId,
          ...(isTransfer ? {
            hospitalId: hospital.id,
            transferredAt: now,
            transferredFrom: antenatalRegistration.hospitalId,
            transferNotes: `Transferred from ${sourceHospital || 'another hospital'}`
          } : {})
        }
      });
    } else {
      // Registration doesn't exist yet - create full registration in a transaction
      await prisma.$transaction(async (tx) => {
        // 1. Create booking visit record
        const bookingVisit = await tx.antenatalBookingVisit.create({
          data: {
            lmp: new Date(formData.bookingVisit.lmp),
            edd: new Date(formData.bookingVisit.edd),
            gravida: parseInt(formData.bookingVisit.gravida),
            para: parseInt(formData.bookingVisit.para),
            createdBy: userId
          }
        });
        
        // 2. Create medical history record
        const medicalHistory = await tx.antenatalMedicalHistory.create({
          data: {
            previousPregnancies: formData.medicalHistory.previousPregnancies,
            complications: formData.medicalHistory.complications,
            chronicConditions: formData.medicalHistory.chronicConditions,
            allergies: formData.medicalHistory.allergies,
            medications: formData.medicalHistory.medications,
            surgicalHistory: formData.medicalHistory.surgicalHistory,
            createdBy: userId
          }
        });
        
        // 3. Create physical exam record
        const physicalExam = await tx.antenatalPhysicalExam.create({
          data: {
            height: formData.physicalExam.height,
            weight: formData.physicalExam.weight,
            bmi: formData.physicalExam.bmi,
            bloodPressure: formData.physicalExam.bloodPressure,
            pulse: formData.physicalExam.pulse,
            temperature: formData.physicalExam.temperature,
            createdBy: userId
          }
        });
        
        // 4. Create lab results record
        const labResults = await tx.antenatalLabResults.create({
          data: {
            bloodGroup: formData.labRequests.bloodGroup,
            hemoglobin: formData.labRequests.hemoglobin,
            hivStatus: formData.labRequests.hivStatus,
            hepatitis: formData.labRequests.hepatitis,
            urinalysis: formData.labRequests.urinalysis,
            createdBy: userId
          }
        });
        
        // 5. Create visit schedule record
        const visitSchedule = await tx.antenatalVisitSchedule.create({
          data: {
            nextVisitDate: formData.visitPlan.nextVisitDate ? new Date(formData.visitPlan.nextVisitDate) : null,
            visitSchedule: formData.visitPlan.visitSchedule,
            createdBy: userId
          }
        });
        
        // 6. Create the main antenatal registration record linking everything
        antenatalRegistration = await tx.antenatalRegistration.create({
          data: {
            patientId: patientId,
            hospitalId: hospital.id,
            bookingVisitId: bookingVisit.id,
            medicalHistoryId: medicalHistory.id,
            physicalExamId: physicalExam.id,
            labResultsId: labResults.id,
            visitScheduleId: visitSchedule.id,
            riskFactors: formData.complications.riskFactors,
            riskLevel: formData.complications.riskLevel,
            createdBy: userId
          },
          include: {
            bookingVisit: true,
            medicalHistory: true,
            physicalExam: true,
            labResults: true,
            visitSchedule: true
          }
        });
      });
    }

    // Create antenatal visit entry if a next visit date is specified
    if (formData.visitPlan.nextVisitDate) {
      await prisma.antenatalVisit.create({
        data: {
          patientId: patientId,
          hospitalId: hospital.id,
          registrationId: antenatalRegistration.id,
          visitDate: new Date(formData.visitPlan.nextVisitDate),
          visitType: 'scheduled',
          status: 'scheduled',
          createdBy: userId
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: isTransfer ? 'Patient transfer completed successfully' : 'Registration completed successfully',
      antenatalId: antenatalRegistration.id,
      patientId: patientId,
      mrn: patient.mrn // Return the unchanged permanent medical ID
    });
  } catch (error) {
    console.error('Error completing registration:', error);
    return NextResponse.json({ error: 'Failed to complete registration' }, { status: 500 });
  }
}
