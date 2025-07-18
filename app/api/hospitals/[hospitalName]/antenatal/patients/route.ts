import { NextRequest, NextResponse } from "next/server"
import { getPatientFromSession } from "@/lib/auth/session-auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    console.log(`Fetching antenatal patients for hospital: ${params.hospitalName}`)
    
    // Get pagination parameters from request
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get hospital ID from hospitalName
    const hospital = await prisma.hospital.findUnique({
      where: { subdomain: params.hospitalName },
      select: { id: true }
    })

    if (!hospital) {
      console.error(`Hospital not found: ${params.hospitalName}`)
      return NextResponse.json(
        { error: "Hospital not found" },
        { status: 404 }
      )
    }
    
    console.log(`Found hospital with ID: ${hospital.id}`)

    // Check if AntenatalRecord table exists in the database
    let antenatalTableExists = true
    try {
      await prisma.$queryRaw`SELECT 1 FROM "AntenatalRecord" LIMIT 1`;
      console.log('AntenatalRecord table exists')
    } catch (error) {
      antenatalTableExists = false
      console.log('AntenatalRecord table does not exist or is not accessible')
      // Return empty data structure instead of error when table doesn't exist
      return NextResponse.json({
        patients: [],
        stats: {
          totalPatients: 0,
          activePatients: 0,
          newRegistrations: 0,
          upcomingAppointments: 0
        }
      })
    }

    // Fetch antenatal records with patients
    const antenatalRecords = await prisma.antenatalRecord.findMany({
      where: {
        hospitalId: hospital.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        Patient: {
          select: {
            id: true,
            mrn: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    console.log(`Found ${antenatalRecords.length} antenatal records`)
    
    // Get total count for pagination info
    const totalCount = await prisma.antenatalRecord.count({
      where: {
        hospitalId: hospital.id,
      }
    })
    
    // Add type annotation to help TypeScript understand the structure
    type AntenatalRecordWithPatient = typeof antenatalRecords[number];

    // If no records found, return empty data structure with zeros
    if (!antenatalRecords || antenatalRecords.length === 0) {
      console.log('No antenatal records found for this hospital')
      return NextResponse.json({
        patients: [],
        stats: {
          totalPatients: 0,
          activePatients: 0,
          newRegistrations: 0,
          upcomingAppointments: 0
        }
      })
    }
    
    // Transform antenatal and patient data with better error handling
    const transformedPatients = antenatalRecords.map((record: AntenatalRecordWithPatient) => {
      // Ensure patient exists and handle missing patient data gracefully
      const patient = record.Patient || { 
        id: 'unknown', 
        mrn: '', 
        name: '', 
        dateOfBirth: null,
        gender: '',
        createdAt: new Date(),
        updatedAt: new Date() 
      };
      
      // Default values
      let firstName = ''
      let lastName = ''
      let contactInfo = {}
      
      // Parse name field
      if (patient.name) {
        try {
          // Check if name is already a JSON object or needs parsing
          const nameObj = typeof patient.name === 'string' 
            ? JSON.parse(patient.name) 
            : patient.name
            
          firstName = nameObj.firstName || nameObj.given?.[0] || nameObj.givenName || ''
          lastName = nameObj.lastName || nameObj.family || nameObj.familyName || ''
        } catch (error) {
          console.error(`Error parsing patient name for ${patient.id}:`, error)
          // If parsing fails, try to use name as is
          firstName = typeof patient.name === 'string' ? patient.name : 'Unknown'
        }
      }
      
      // We no longer access patient.contact directly as it's not selected in the query
      // Initialize empty contact info
      const typedContactInfo: Record<string, any> = {};
      
      // Get antenatal specific data
      const riskLevel = record.riskLevel?.toString().toLowerCase() || 'low';
      const trimester = record.trimester || 1;
      const gestationalAge = record.gestationalAge || 0;
      const nextAppointment = record.nextAppointment;
      const expectedDueDate = record.expectedDueDate;
      const status = record.status?.toString().toLowerCase() || 'active';
      
      // Build patient object with appropriate defaults and antenatal data
      return {
        id: patient.id,
        medicalNumber: patient.mrn || '',
        name: `${firstName} ${lastName}`.trim() || 'Unknown',
        age: calculateAge(patient.dateOfBirth),
        gender: patient.gender || 'unknown',
        phone: '',
        email: '',
        gestationalAge,
        riskLevel,
        status,
        trimester,
        nextAppointment,
        imageUrl: undefined,
        expectedDueDate,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      }
    })

    // Calculate stats
    const totalPatients = totalCount
    const activePatients = antenatalRecords.filter(record => 
      record.status === 'ACTIVE').length
    
    // New registrations in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newRegistrations = antenatalRecords.filter(record => 
      record.createdAt > thirtyDaysAgo).length
    
    // Count upcoming appointments in next 7 days
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)
    
    const upcomingAppointments = antenatalRecords.filter(record => 
      record.nextAppointment && 
      record.nextAppointment > today && 
      record.nextAppointment < nextWeek
    ).length

    console.log('Successfully prepared antenatal patient data')
    
    return NextResponse.json({
      patients: transformedPatients,
      stats: {
        totalPatients,
        activePatients,
        newRegistrations,
        upcomingAppointments
      }
    })

  } catch (error) {
    console.error("Error fetching antenatal patients:", error)
    // Return empty data structure instead of error when exception occurs
    return NextResponse.json({
      patients: [],
      stats: {
        totalPatients: 0,
        activePatients: 0,
        newRegistrations: 0,
        upcomingAppointments: 0
      },
      error: "An error occurred but returning empty data instead of failing"
    })
  }
}

// Helper function to calculate age from DOB
function calculateAge(dob: Date | string | null | undefined): number {
  if (!dob) return 0
  
  const birthDate = new Date(dob)
  const today = new Date()
  
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Helper function to determine trimester based on gestational age in weeks
function calculateTrimester(gestationalAge: number): 1 | 2 | 3 {
  if (gestationalAge < 14) return 1
  if (gestationalAge < 28) return 2
  return 3
}
