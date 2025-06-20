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
    }

    // Fetch patients with pagination
    const patients = await prisma.patient.findMany({
      where: {
        hospitalId: hospital.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
      select: {
        id: true,
        mrn: true, // Add medical record number
        name: true,
        dateOfBirth: true, // Updated from birthDate
        gender: true,
        contact: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log(`Found ${patients.length} patients`)
    
    // Get total count for pagination info
    const totalCount = await prisma.patient.count({
      where: {
        hospitalId: hospital.id
      }
    })
    
    // Transform patient data with better error handling
    const transformedPatients = patients.map(patient => {
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
      
      // Parse contact field
      if (patient.contact) {
        try {
          contactInfo = typeof patient.contact === 'string'
            ? JSON.parse(patient.contact)
            : patient.contact
        } catch (error) {
          console.error(`Error parsing contact info for ${patient.id}:`, error)
        }
      }
      
      // Type assertion for contactInfo to avoid TypeScript errors
      const typedContactInfo = contactInfo as Record<string, any>;
      
      // Build patient object with appropriate defaults
      return {
        id: patient.id,
        medicalNumber: patient.mrn || '',
        name: `${firstName} ${lastName}`.trim() || 'Unknown',
        age: calculateAge(patient.dateOfBirth),
        gender: patient.gender || 'unknown',
        phone: typedContactInfo.phone || 
              (typedContactInfo.telecom && Array.isArray(typedContactInfo.telecom) && typedContactInfo.telecom[0]?.value) || 
              '',
        email: typedContactInfo.email || '',
        gestationalAge: 0, // Default values for antenatal data
        riskLevel: "low",
        status: "active",
        trimester: 1,
        nextAppointment: null,
        imageUrl: undefined,
        expectedDueDate: null,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      }
    })

    // Calculate stats
    const totalPatients = totalCount
    const activePatients = totalPatients // All patients are considered active for now
    
    // New registrations in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newRegistrations = transformedPatients.filter(p => p.createdAt > thirtyDaysAgo).length
    
    // Simplified stats for MVP
    const upcomingAppointments = 0

    console.log('Successfully prepared antenatal patient data')
    
    return NextResponse.json({
      patients: transformedPatients,
      totalPatients,
      activePatients,
      newRegistrations,
      upcomingAppointments
    })

  } catch (error) {
    console.error("Error fetching antenatal patients:", error)
    return NextResponse.json(
      { error: "Failed to fetch antenatal patients" },
      { status: 500 }
    )
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
