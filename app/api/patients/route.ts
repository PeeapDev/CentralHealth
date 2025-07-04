import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse, isValid, differenceInYears, format } from 'date-fns';
import { patientNameToString } from '@/lib/utils';

// CACHING DISABLED FOR PRESENTATION MODE
// No response caching - all requests go directly to the database
let cachedResponse: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 0; // Caching disabled (TTL set to 0)

/**
 * Helper function to create a friendly display medical ID
 * Preserves the original 5-character medical IDs (like T6YB8) generated during registration.
 */
function createFriendlyMedicalId(medicalId: string | undefined): string {
  if (!medicalId) return 'Not Assigned';
  
  // If it's a 5-character registration ID, preserve it exactly as is
  if (medicalId.length === 5 && /^[A-Z0-9]{5}$/i.test(medicalId)) {
    return medicalId.toUpperCase();
  }
  
  // If already in our P-format, return as is
  if (medicalId.match(/^P-[A-Z0-9]{4,6}$/)) {
    return medicalId;
  }
  
  // For any other format, use first 4 chars with P- prefix
  return `P-${medicalId.substring(0, Math.min(4, medicalId.length)).toUpperCase()}`;
}

/**
 * Extract and format contact information from the patient contact JSON field
 * Returns structured contact information including phone, email, and address
 * ONLY extracts real data, never adds fake/mock data
 */
function extractContactInfo(contactData: any): { 
  email: string | null, 
  phone: string | null,
  address: {
    street: string | null,
    city: string | null,
    state: string | null,
    postalCode: string | null,
    country: string | null,
    formatted: string
  }
} {
  // Initialize with null values - NEVER add fake data
  const defaultContactInfo = {
    email: null,
    phone: null,
    address: {
      street: null,
      city: null,
      state: null,
      postalCode: null,
      country: null,
      formatted: 'No address available'
    }
  };

  // Return null values if no contact data
  if (!contactData) return defaultContactInfo;

  // Try to parse JSON string if needed
  let parsedContact = contactData;
  if (typeof contactData === 'string') {
    try {
      parsedContact = JSON.parse(contactData);
      // If parsed to an empty string/object, return null values
      if (!parsedContact || (typeof parsedContact === 'object' && Object.keys(parsedContact).length === 0)) {
        return defaultContactInfo;
      }
    } catch (e) {
      console.error('Error parsing contact JSON:', e);
      return defaultContactInfo;
    }
  }

  const result = { ...defaultContactInfo };
  
  // Handle the case where the entire contactData is an array
  // Format from screenshot: [{"system":"email","value":"pay.peeap@gmail.com","use":"home"},...]
  if (Array.isArray(parsedContact)) {
    for (const item of parsedContact) {
      if (item.system === 'email' && item.value) {
        result.email = item.value;
      }
      if (item.system === 'phone' && item.value) {
        result.phone = item.value;
      }
    }
    return result;
  }
  
  // FHIR format: telecom array with system and value properties
  if (Array.isArray(parsedContact.telecom)) {
    for (const item of parsedContact.telecom) {
      if (item.system === 'email' && item.value) {
        result.email = item.value;
      }
      if (item.system === 'phone' && item.value) {
        result.phone = item.value;
      }
    }
  } 
  // Direct properties format
  if (!result.email && parsedContact.email) {
    result.email = parsedContact.email;
  }
  if (!result.phone && parsedContact.phone) {
    result.phone = parsedContact.phone;
  }
  // Value property directly
  if (!result.email && parsedContact.value) {
    result.email = parsedContact.value;
  }

  // Process address from FHIR format or direct properties
  const addressData = Array.isArray(parsedContact.address) ? parsedContact.address[0] : parsedContact.address;
  
  if (addressData) {
    result.address = {
      street: addressData.line?.[0] || addressData.street || null,
      city: addressData.city || null,
      state: addressData.state || null,
      postalCode: addressData.postalCode || addressData.zip || null,
      country: addressData.country || null,
      formatted: ''
    };

    // Create a formatted address string only from actual data
    const parts = [];
    if (result.address.street) parts.push(result.address.street);
    if (result.address.city) {
      const cityPart = [result.address.city];
      if (result.address.state) cityPart.push(result.address.state);
      if (result.address.postalCode) cityPart.push(result.address.postalCode);
      parts.push(cityPart.join(', '));
    }
    if (result.address.country && !parts.some(p => p.includes(result.address.country || ''))) {
      parts.push(result.address.country);
    }

    result.address.formatted = parts.length > 0 ? parts.join('\n') : 'No address available';
  }

  return result;
}

/**
 * Generate a deterministic avatar URL based on user name and ID
 * Uses a high-quality avatar generation service to provide consistent patient avatars
 */
function generateAvatarUrl(name: string | null | undefined, id: string): string {
  const safeName = encodeURIComponent(name || 'User');
  const backgroundColors = ['5DBCD2', '1B4965', 'FF7D00', '2EC4B6', 'E71D36'];
  const bgIndex = parseInt(id.slice(-1), 16) % backgroundColors.length;
  const bgColor = backgroundColors[bgIndex];
  
  return `https://ui-avatars.com/api/?name=${safeName}&size=128&background=${bgColor}&color=fff&bold=true`;
}

/**
 * Calculate age from date of birth handling various formats
 * Returns both age as a number and formatted birthdate for display
 */
function processDateOfBirth(dateOfBirth: any): { age: number | null, formattedDate: string } {
  if (!dateOfBirth) return { age: null, formattedDate: 'Not available' };
  
  try {
    const now = new Date();
    
    // If it's already a Date object
    if (dateOfBirth instanceof Date) {
      return {
        age: differenceInYears(now, dateOfBirth),
        formattedDate: format(dateOfBirth, 'MMMM d, yyyy')
      };
    }
    
    // If it's a string, try different formats
    if (typeof dateOfBirth === 'string') {
      // Try direct conversion first
      let date = new Date(dateOfBirth);
      
      // If valid, return age and formatted date
      if (!isNaN(date.getTime())) {
        return {
          age: differenceInYears(now, date),
          formattedDate: format(date, 'MMMM d, yyyy')
        };
      }
      
      // Try specific formats if direct conversion fails
      const formats = [
        'yyyy-MM-dd',
        'yyyy/MM/dd',
        'MM/dd/yyyy',
        'dd/MM/yyyy'
      ];
      
      for (const formatStr of formats) {
        date = parse(dateOfBirth, formatStr, new Date());
        if (isValid(date)) {
          return {
            age: differenceInYears(now, date),
            formattedDate: format(date, 'MMMM d, yyyy')
          };
        }
      }
      
      // Last resort: if the string looks like a year, calculate age from that
      if (/^\d{4}$/.test(dateOfBirth)) {
        const year = parseInt(dateOfBirth, 10);
        const currentYear = now.getFullYear();
        if (year > 1900 && year < currentYear) {
          return {
            age: currentYear - year,
            formattedDate: `Year ${year}`
          };
        }
      }
    }
    
    return { age: null, formattedDate: 'Not available' };
  } catch (e) {
    console.error('Date processing error:', e);
    return { age: null, formattedDate: 'Not available' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10'); // Default to 10 per page for better performance
    const limit = pageSize; // Alias for compatibility
    const searchQuery = url.searchParams.get('search') || '';
    
    // Check if the request has a cache-busting parameter
    const noCache = url.searchParams.get('noCache') === 'true';
    
    // Check if we can use cached response (only if noCache is not set)
    const now = Date.now();
    if (!noCache && cachedResponse && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached patients response');
      return NextResponse.json(cachedResponse);
    }
    
    // Calculate pagination offsets
    const skip = (page - 1) * limit;
    
    // Build where clause for search
    const where: any = {};
    if (searchQuery) {
      where.OR = [
        { id: { contains: searchQuery } },
        { mrn: { contains: searchQuery } },
        { name: { contains: searchQuery } } // Search in name field as well
      ];
    }
    
    // Get total count for pagination in a separate query
    const totalCount = await prisma.patient.count({ where });
    
    // If no patients found, return a friendly message instead of an error
    if (totalCount === 0) {
      return NextResponse.json({
        patients: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
        message: searchQuery
          ? `No patients found matching "${searchQuery}". Please try a different search term.`
          : "No patients found in the system. Please register patients to get started.",
        noPatients: true
      }, { status: 200 }); // Return 200 OK with empty results and a message
    }
    
    // Get patients with pagination
    // NOTE: Once migration is complete, we can include emails and phones from the dedicated tables
    // Try to fetch patients with a simpler query first for better reliability
    const patients = await prisma.patient.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy: {
        updatedAt: 'desc' // Show most recently updated patients first
      },
      select: {
        id: true,
        mrn: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        // contact field no longer exists in the schema
        createdAt: true,
        updatedAt: true,
        onboardingCompleted: true,
        // Include Emails and Phones relations explicitly
        Emails: {
          where: { primary: true },
          take: 1,
          select: { email: true, verified: true }
        },
        Phones: {
          where: { primary: true },
          take: 1,
          select: { phone: true, verified: true }
        },
        // Include User relation for better name resolution
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true  // Use photo field instead of image
          }
        },
        // Include ProfilePicture for avatar display
        ProfilePicture: {
          select: {
            imageUrl: true
          }
        }
      }
    }).catch(err => {
      console.error('Error in patient query:', err);
      // Return an empty array instead of failing
      return [];
    });
    
    // If the query failed completely, return a graceful error
    if (!patients) {
      return NextResponse.json({
        patients: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
        message: "There was an issue retrieving patient data. System administrators have been notified."
      }, { status: 200 }); // Return 200 with helpful message instead of 500
    }

    // Process each patient into the display format used by the frontend
    const processedPatients = patients.map((patient: any) => {
      try {
        // Extract name with minimal processing
        let displayName = 'Unknown Patient';
        
        // Prioritize different name sources in order of preference:
        // 1. fullName from the patient record
        // 2. name from User relation
        // 3. Structured name from patient.name
        if (patient.fullName && typeof patient.fullName === 'string') {
          displayName = patient.fullName;
        } else if (patient.User && patient.User.name) {
          displayName = patient.User.name;
        } else if (patient.name) {
          if (typeof patient.name === 'string') {
            // Check if it looks like a plain string rather than JSON
            if (!/^\s*[{\[]/.test(patient.name)) {
              displayName = patient.name;
            } else {
              // Only attempt JSON parsing if it looks like JSON
              try {
                const nameObj = JSON.parse(patient.name);
                displayName = nameObj.text || 
                  ((nameObj.given && nameObj.family) ? 
                  `${Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given} ${nameObj.family}` : 
                  'Unknown');
              } catch (e) {
                // If parsing fails, use as-is
                displayName = patient.name;
              }
            }
          } else if (typeof patient.name === 'object') {
            // Handle name object directly
            const nameObj = patient.name as any;
            displayName = nameObj.text || 
              ((nameObj.given && nameObj.family) ? 
              `${Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given} ${nameObj.family}` : 
              'Unknown');
          }
        }
        
        // Format medical ID for display - must preserve original 5-character IDs per policy
        const medicalId = patient.mrn || patient.id;
        const displayMedicalNumber = createFriendlyMedicalId(medicalId);
        
        // Extract contact info from the Emails and Phones relations
        let email = null;
        let phone = null;
        
        // Get email from the Emails relation
        if (patient.Emails && Array.isArray(patient.Emails) && patient.Emails.length > 0) {
          email = patient.Emails[0].email;
        }
        
        // Get phone from the Phones relation
        if (patient.Phones && Array.isArray(patient.Phones) && patient.Phones.length > 0) {
          phone = patient.Phones[0].phone;
        }
        
        // Process date of birth
        const dobResult = processDateOfBirth(patient.dateOfBirth);
        
        // Try to extract gender
        let gender = 'Not Specified';
        if (patient.gender) {
          if (typeof patient.gender === 'string') {
            gender = patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase();
            if (gender === 'Male' || gender === 'Female' || gender === 'Other') {
              // Gender is valid
            } else if (gender.toLowerCase() === 'm') {
              gender = 'Male';
            } else if (gender.toLowerCase() === 'f') {
              gender = 'Female';
            } else {
              gender = 'Other';
            }
          }
        }
        
        // Get profile picture URL if available
        let profilePictureUrl = null;
        if (patient.ProfilePicture && patient.ProfilePicture.imageUrl) {
          profilePictureUrl = patient.ProfilePicture.imageUrl;
        } else if (patient.User && patient.User.image) {
          profilePictureUrl = patient.User.image;
        }
        
        // Return a consistent patient record object
        return {
          id: patient.id,
          medicalId: displayMedicalNumber,
          medicalNumber: patient.mrn || '',  // Added for compatibility
          displayMedicalNumber: displayMedicalNumber, // Added for compatibility
          name: displayName,
          email: email,
          phone: phone,
          dob: dobResult.formattedDate,
          birthDate: patient.dateOfBirth,  // Keep original date for calculations
          age: dobResult.age || 'Unknown',
          gender: gender,
          createdAt: patient.createdAt,
          onboardingStatus: patient.onboardingCompleted ? 'Completed' : 'Pending',
          status: 'Active',
          active: true, // Default to active for compatibility
          // Add all the additional fields needed for the UI
          avatarUrl: profilePictureUrl,
          fullName: patient.fullName || displayName,
          displayName: displayName,
          User: patient.User || null,
          profilePicture: patient.ProfilePicture || null
        };
      } catch (err) {
        // If processing an individual patient fails, return a simplified record
        // instead of failing the entire request
        console.error('Error processing patient:', err);
        return {
          id: patient.id || 'Unknown ID',
          medicalId: patient.mrn || patient.id || 'Unknown',
          name: 'Error loading patient',
          email: null,
          phone: null,
          dob: 'Not available',
          age: 'Unknown',
          gender: 'Not Specified',
          createdAt: new Date(),
          onboardingStatus: 'Unknown',
          status: 'Unknown',
          avatarUrl: null,
          error: true
        };
      }
    });
    
    // Build response with pagination info
    const response = {
      patients: processedPatients,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
    
    // Cache the response
    cachedResponse = response;
    cacheTimestamp = Date.now();
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in patients API:', error);
    // Return a more helpful error response with empty patients array
    return NextResponse.json(
      { 
        message: 'Unable to retrieve patient data at this time. Please try again later.', 
        error: 'Failed to retrieve patients', 
        details: error instanceof Error ? error.message : String(error),
        patients: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      },
      { status: 500 }
    );
  }
}
