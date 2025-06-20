import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { patientNameToString } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    console.log("Patient search API called")
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const hospitalId = searchParams.get("hospitalId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")

    console.log(`Search params: search=${search}, hospitalId=${hospitalId}, page=${page}, pageSize=${pageSize}`)

    // Skip calculation for pagination
    const skip = (page - 1) * pageSize

    // Create the base where clause
    const whereClause: any = {}
    
    // If hospital ID provided, filter by it
    if (hospitalId) {
      whereClause.hospitalId = hospitalId
    }

    // Build the OR conditions for searching
    const orConditions: any[] = []
    const searchTerm = search.trim()
    
    console.log(`Building search query for term: "${searchTerm}"`)
    
    // Add search filters if provided
    if (searchTerm !== "") {
      // Simple text fields - these are safe and straightforward
      orConditions.push({ mrn: { contains: searchTerm, mode: 'insensitive' } })
      orConditions.push({ phone: { contains: searchTerm, mode: 'insensitive' } })
      orConditions.push({ email: { contains: searchTerm, mode: 'insensitive' } })
      
      // For JSON name field - we need to use different approaches
      // The name field is JSON, so we need to use jsonPath or specialized queries
      
      // Approach 1: Use string_contains on the raw DB field (PostgreSQL specific)
      // This searches within the JSON string representation
      orConditions.push({
        name: {
          path: ['$'],
          string_contains: searchTerm.toLowerCase()
        }
      })
      
      // Approach 2: Check specific paths in JSON that might contain name parts
      if (searchTerm.length > 1) {
        orConditions.push({
          name: {
            path: ['family'],
            string_contains: searchTerm.toLowerCase()
          }
        })
        
        orConditions.push({
          name: {
            path: ['given'],
            array_contains: [searchTerm.toLowerCase()]
          }
        })
        
        orConditions.push({
          name: {
            path: ['text'],
            string_contains: searchTerm.toLowerCase()
          }
        })
      }
      
      console.log(`Created ${orConditions.length} search conditions`)
    }
    
    // Add OR conditions to the where clause if we have any
    if (orConditions.length > 0) {
      whereClause.OR = orConditions
    }

    console.log("Search where clause:", JSON.stringify(whereClause, null, 2))
    
    // Debug: List a few patients in the database regardless of search
    try {
      const allPatients = await prisma.patient.findMany({
        select: { id: true, mrn: true, name: true, contact: true },
        take: 3,
      })
      console.log(`DEBUG - First few patients in database:`, 
        JSON.stringify(allPatients.map(p => ({ 
          id: p.id, 
          mrn: p.mrn,
          name: typeof p.name === 'string' ? p.name : JSON.stringify(p.name) 
        })), null, 2)
      )
    } catch (e) {
      console.error('Debug patient listing failed:', e)
    }

    // Execute the query with pagination and better error handling
    let patients: any[] = []
    let total = 0

    try {
      // First try with the OR conditions
      ;[patients, total] = await Promise.all([
        prisma.patient.findMany({
          where: whereClause,
          select: {
            id: true,
            mrn: true,
            name: true,
            // photo field removed - doesn't exist in schema
            // email field removed - doesn't exist in schema
            hospitalId: true,
            // active field removed - doesn't exist in schema
            contact: true, // Use contact field which contains phone and email
          },
          skip,
          take: pageSize,
        }),
        prisma.patient.count({ where: whereClause }),
      ])
      
      console.log(`Found ${patients.length} patients with search criteria`)
    } catch (queryError) {
      console.error("Error with complex search query, falling back to simple search:", queryError)
      
      // If the complex query fails, fall back to a simpler query
      const simpleWhereClause: any = hospitalId ? { hospitalId } : {}
      
      console.log('Complex query failed, falling back to simple query')
      
      // Add a simple name condition if search is provided
      if (search && search.trim() !== "") {
        // For the fallback, only search these reliable fields
        simpleWhereClause.OR = [
          { mrn: { contains: search, mode: 'insensitive' } },
          // Search in contact JSON field for phone and email
          { contact: { path: ['$[*].value'], string_contains: search } },
        ]
        
        // Also try a direct match on medical number as this is most reliable
        if (search.trim().length >= 4) {
          simpleWhereClause.OR.push({ mrn: search.trim() })
        }
      }
      
      console.log('Fallback where clause:', JSON.stringify(simpleWhereClause, null, 2))
      
      // Try again with the simpler query
      ;[patients, total] = await Promise.all([
        prisma.patient.findMany({
          where: simpleWhereClause,
          select: {
            id: true,
            mrn: true,
            name: true,
            // photo field removed - doesn't exist in schema
            // email field removed - doesn't exist in schema
            hospitalId: true,
            // active field removed - doesn't exist in schema
            contact: true, // Use contact field which contains phone and email
          },
          skip,
          take: pageSize,
        }),
        prisma.patient.count({ where: simpleWhereClause }),
      ])
      
      console.log(`Fallback search found ${patients.length} patients`)
    }

    // Process patients to ensure consistent name format with better error handling
    const processedPatients = patients.map((patient: any) => {
      // Process patient name to be consistent string format
      let patientName = "Unknown"
      // Transform mrn for consistent format
      const medicalId = patient.mrn || ""
      let phoneNumber = ""
      
      // Extract phone from contact JSON field
      try {
        if (patient.contact) {
          const contactData = typeof patient.contact === 'string' ? 
            JSON.parse(patient.contact) : patient.contact;
          
          if (Array.isArray(contactData)) {
            const phoneEntry = contactData.find((entry: any) => 
              entry.system === 'phone' || entry.use === 'phone' || entry.type === 'phone');
            if (phoneEntry) {
              phoneNumber = phoneEntry.value || "";
            }
          }
        }
      } catch (e) {
        console.warn(`Could not extract phone from contact for patient ${patient.id}`);
      }

      try {
        if (!patient.name) {
          patientName = "Unknown Patient"
        } else if (typeof patient.name === 'string') {
          patientName = patient.name || "Unknown Patient"
        } else if (patient.name && typeof patient.name === 'object') {
          // Try using the patientNameToString helper
          try {
            patientName = patientNameToString(patient.name) || "Unknown Patient"
          } catch (nameError) {
            console.error("Error using patientNameToString:", nameError)
            
            // Fallback to manual extraction
            if (patient.name.given && Array.isArray(patient.name.given)) {
              const given = patient.name.given.join(" ")
              const family = patient.name.family || ""
              patientName = `${given} ${family}`.trim() || "Unknown Patient"
            } else if (patient.name.family) {
              patientName = patient.name.family
            } else if (patient.name.text) {
              patientName = patient.name.text
            } else {
              // Last resort: stringify the object
              try {
                patientName = JSON.stringify(patient.name).substring(0, 30) || "Unknown Patient"
              } catch {
                patientName = "Unknown Patient"
              }
            }
          }
        } else {
          patientName = "Unknown Patient"
        }
      } catch (error) {
        console.error("Error processing patient name:", error)
        patientName = "Unknown Patient"
      }

      // Return a sanitized patient object with all fields validated
      return {
        id: patient.id || "",
        medicalNumber: patient.mrn || "",
        name: patientName || "Unknown Patient",
        email: "", // Email extracted from contact below
        phone: "", // Phone will be extracted from contact
        photo: patient.photo || "",
        hospitalId: patient.hospitalId || "",
        active: patient.active !== undefined ? patient.active : true
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize)
    const hasMore = page < totalPages

    console.log(`Returning ${processedPatients.length} processed patients`)
    
    // Return the response with pagination info
    return NextResponse.json({
      patients: processedPatients,
      total,
      page,
      pageSize,
      totalPages,
      hasMore,
      filters: {
        search,
        hospitalId,
      }
    })
  } catch (error) {
    console.error("Error searching patients:", error)
    return NextResponse.json(
      { error: "Failed to search patients", message: (error as Error).message },
      { status: 500 }
    )
  }
}
