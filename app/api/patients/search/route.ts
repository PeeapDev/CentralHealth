import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma-client";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
// Define simple IP extraction function instead of importing missing module
function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  
  return request.headers.get('x-real-ip') || 
         'unknown';
}

// Prisma client is now imported from the centralized location
// Using the shared client instance for better performance

// Type definitions
interface PatientSearchResult {
  id: string;
  medicalNumber: string;
  name: string;
  email: string;
  phone: string;
  qrCode: string;
  dateOfBirth?: string;
  gender?: string;
  hospitals: Array<{
    id: string;
    name: string;
  }>;
}

interface AuditLogData {
  action: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
  userId?: string;
  patientId?: string;
  success?: boolean;
}

interface RateLimitResult {
  status: number;
  response: NextResponse;
}

// Security and rate limiting configuration
const RATE_LIMIT_CONFIG = {
  PATIENT_SEARCH: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
  },
};

// Cache for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Main search handler
export async function GET(request: NextRequest) {
  try {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID();
    console.log(`[Patient Search API] [${requestId}] Processing search request`);
    
    // Rate limiting check
    const ipAddress = getClientIp(request) || 'unknown';
    const rateLimitCheck = await checkRateLimit(ipAddress, 'PATIENT_SEARCH');
    if (rateLimitCheck) return rateLimitCheck.response;

    // Extract and validate query parameters
    const { searchParams } = request.nextUrl;
    const searchTerm = searchParams.get("search")?.trim() || "";
    const email = searchParams.get("email")?.trim() || "";
    const medicalId = searchParams.get("medicalId")?.trim() || "";
    const hospitalId = searchParams.get("hospitalId")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10")));
    const skip = (page - 1) * pageSize;

    // Log search parameters for debugging
    console.log(`[${requestId}] Search params:`, { searchTerm, email, medicalId, hospitalId, page, pageSize });
    
    // Validate at least one search parameter is provided
    if (!searchTerm && !email && !medicalId) {
      console.log(`[${requestId}] Missing search parameters`);
      return NextResponse.json(
        { success: false, message: "Please provide at least one search parameter", requestId },
        { status: 400 }
      );
    }

    // Build the database query with error handling
    let whereClause;
    try {
      whereClause = buildWhereClause({ searchTerm, email, medicalId, hospitalId });
      console.log(`[${requestId}] Executing patient search query with where clause:`, JSON.stringify(whereClause, null, 2));
    } catch (whereError) {
      console.error(`[${requestId}] Error building where clause:`, whereError);
      whereClause = {}; // Fallback to empty where clause to avoid breaking the query
    }
    
    try {
      // Execute the query with transaction for consistency and additional error handling
      let patients = [];
      let totalCount = 0;
      
      try {
        [patients, totalCount] = await prisma.$transaction([
          prisma.patient.findMany({
            where: whereClause,
            select: getPatientSelectFields(),
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.patient.count({ where: whereClause }),
        ]);
      } catch (prismaError) {
        console.error(`[${requestId}] Prisma query error:`, prismaError);
        // If the transaction fails, try simple query without transaction
        patients = await prisma.patient.findMany({
          where: whereClause,
          select: getPatientSelectFields(),
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        });
        totalCount = patients.length; // Use as fallback count
      }

      console.log(`[${requestId}] Found ${patients.length} patients`);      
      if (patients.length === 0) {
        console.log(`[${requestId}] No patients found, original search parameters:`, { searchTerm, email, medicalId, hospitalId });
      } else {
        console.log(`[${requestId}] First patient found:`, JSON.stringify({
          id: patients[0].id,
          mrn: patients[0].mrn,
          name: patients[0].name,
          // Don't log sensitive data
        }, null, 2));
      }
      
      // Process results with enhanced error handling for each patient
      const processedPatients = [];
      for (const patient of patients) {
        try {
          // Check for null or invalid patient data
          if (!patient || typeof patient !== 'object' || !patient.id) {
            console.warn(`[${requestId}] Skipping invalid patient record:`, patient);
            continue;
          }
          
          // Handle each patient separately to prevent one bad record from failing the entire response
          const processed = processPatientResult(patient);
          processedPatients.push(processed);
        } catch (patientError) {
          console.error(`[${requestId}] Error processing patient:`, patientError, 'Patient ID:', patient?.id || 'unknown');
          // Create a minimal safe fallback patient object to avoid breaking the results
          if (patient?.id) {
            processedPatients.push({
              id: patient.id,
              medicalNumber: patient.mrn || '',
              name: 'Patient Record',
              email: '',
              phone: '',
              qrCode: '',
              hospitals: [],
            });
          }
        }
      }
      
      const totalPages = Math.ceil(totalCount / pageSize);

      // Log successful search
      await logSecurityEvent({
        action: 'PATIENT_SEARCH_SUCCESS',
        ipAddress,
        details: {
          requestId,
          searchTerm,
          email,
          medicalId,
          hospitalId,
          resultCount: processedPatients.length,
        },
        success: true,
      });

      console.log(`[${requestId}] Successfully processed ${processedPatients.length} patients`);
      
      // Return appropriate response based on query type
      if (email || medicalId) {
        return NextResponse.json({
          success: true,
          patient: processedPatients[0] || null,
          requestId
        });
      }

      // Format response to match what the frontend expects
      return NextResponse.json({
        success: true,
        patients: processedPatients, // Return as 'patients' for frontend compatibility
        data: processedPatients,     // Also include as 'data' for backward compatibility
        pagination: {
          total: totalCount,
          page,
          pageSize,
          totalPages,
          hasMore: page < totalPages,
        },
        requestId
      });
      
    } catch (dbError) {
      console.error(`[${requestId}] Database query error:`, dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }

  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] Patient search error:`, error);
    
    await logSecurityEvent({
      action: 'PATIENT_SEARCH_ERROR',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: request.url,
      },
      success: false,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while searching for patients',
        requestId,
        ...(process.env.NODE_ENV !== 'production' && {
          debug: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n'),
          } : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

// Helper Functions

function buildWhereClause(params: {
  searchTerm: string;
  email: string;
  medicalId: string;
  hospitalId: string;
}) {
  const { searchTerm, email, medicalId, hospitalId } = params;
  const where: any = {};

  // Hospital access restriction
  if (hospitalId) {
    where.HospitalAccesses = { some: { hospitalId } };
  }

  // Search conditions
  const conditions = [];
  
  if (medicalId) {
    // Handle both exact match and partial match for medical IDs
    conditions.push(
      { mrn: { equals: medicalId, mode: 'insensitive' } },
      { mrn: { contains: medicalId, mode: 'insensitive' } }
    );
  } else if (email) {
    conditions.push(
      // Search in dedicated Emails relation
      { Emails: { some: { email: { contains: email, mode: 'insensitive' } } } },
      
      // Search in contact JSON field using safer contains approach
      // This avoids JSON path filters which can cause errors
      { contact: { contains: email, mode: 'insensitive' } }
    );
  } else if (searchTerm) {
    conditions.push(
      // Medical ID search
      { mrn: { contains: searchTerm, mode: 'insensitive' } },
      
      // Name search (exact field)
      { name: { contains: searchTerm, mode: 'insensitive' } },
      
      // Email search in dedicated relation
      { Emails: { some: { email: { contains: searchTerm, mode: 'insensitive' } } } },
      
      // Phone search in dedicated relation
      { Phones: { some: { phone: { contains: searchTerm } } } },
      
      // Search in contact JSON field using safer contains approach
      { contact: { contains: searchTerm, mode: 'insensitive' } }
    );
  }

  if (conditions.length > 0) {
    where.OR = conditions;
  }

  return where;
}

function getPatientSelectFields() {
  return {
    id: true,
    mrn: true,
    name: true,
    dateOfBirth: true,
    gender: true,
    qrCode: true,
    contact: true,
    Emails: {
      where: { primary: true },
      select: { email: true },
    },
    Phones: {
      where: { primary: true },
      select: { phone: true, type: true },
    },
    HospitalAccesses: {
      select: {
        id: true,
        hospital: {
          select: {
            id: true,
            name: true
          }
        },
        accessLevel: true
      }
    },
  };
}

function processPatientResult(patient: any): PatientSearchResult {
  // First make sure patient has required ID
  if (!patient?.id) {
    throw new Error('Invalid patient record: missing ID');
  }

  try {
    // Use defensive coding pattern throughout to avoid any null/undefined errors
    return {
      id: patient.id,
      medicalNumber: patient.mrn || '',
      // Handle missing or malformed name with fallback
      name: patient.name ? formatPatientName(patient.name) : 'Patient',
      // Handle potentially missing email extraction
      email: safelyExtractPrimaryEmail(patient),
      // Handle potentially missing phone extraction
      phone: safelyExtractPrimaryPhone(patient),
      qrCode: patient.qrCode || '',
      // Handle different date formats safely
      dateOfBirth: patient.dateOfBirth ? 
        (patient.dateOfBirth instanceof Date ? 
          patient.dateOfBirth.toISOString() : 
          String(patient.dateOfBirth)) : 
        undefined,
      gender: patient.gender || undefined,
      // Handle missing or malformed hospital accesses
      hospitals: Array.isArray(patient.HospitalAccesses) ?
        patient.HospitalAccesses
          .filter((access: any) => access?.hospital?.id && access?.hospital?.name)
          .map((access: any) => ({
            id: access.hospital.id,
            name: access.hospital.name,
          })) : [],
    };
  } catch (error) {
    console.error('Error processing patient result:', error, 'Patient ID:', patient?.id);
    // Return minimal valid data on error
    return {
      id: patient.id,
      medicalNumber: patient.mrn || '',
      name: 'Patient Record',
      email: '',
      phone: '',
      qrCode: '',
      hospitals: [],
    };
  }
}

// Safely extract primary email with additional error handling
function safelyExtractPrimaryEmail(patient: any): string {
  try {
    return extractPrimaryEmail(patient);
  } catch (error) {
    console.error('Error extracting email:', error);
    return '';
  }
}

// Safely extract primary phone with additional error handling
function safelyExtractPrimaryPhone(patient: any): string {
  try {
    return extractPrimaryPhone(patient);
  } catch (error) {
    console.error('Error extracting phone:', error);
    return '';
  }
}

function formatPatientName(name: any): string {
  // Handle simple string name
  if (typeof name === 'string') return name.trim() || 'Unknown Patient';
  
  // Handle missing name
  if (!name) return 'Unknown Patient';

  try {
    // Handle JSON string
    if (typeof name === 'string') {
      try {
        name = JSON.parse(name);
      } catch {
        return name.trim() || 'Unknown Patient';
      }
    }
    
    // Handle FHIR-style name with given and family
    if (name.given || name.family) {
      let given = '';
      
      // Handle various given name formats
      if (name.given) {
        if (Array.isArray(name.given)) {
          given = name.given
            .filter((part: any) => part && typeof part === 'string')
            .join(' ');
        } else if (typeof name.given === 'string') {
          given = name.given;
        }
      }
      
      // Handle family name
      let family = '';
      if (typeof name.family === 'string') {
        family = name.family;
      }
      
      // Combine parts
      const fullName = `${given} ${family}`.trim();
      if (fullName) return fullName;
    }
    
    // Handle text property
    if (name.text && typeof name.text === 'string') {
      return name.text.trim();
    }
    
    // Handle first+last pattern
    if (name.firstName || name.lastName) {
      return `${name.firstName || ''} ${name.lastName || ''}`.trim() || 'Unknown Patient';
    }
    
    // Handle name object with just a toString method
    if (typeof name.toString === 'function') {
      const nameStr = name.toString();
      if (nameStr !== '[object Object]') return nameStr;
    }
    
    // Default case
    return 'Unknown Patient';
  } catch (error) {
    console.error('Error formatting patient name:', error);
    return 'Unknown Patient';
  }
}

function extractPrimaryEmail(patient: any): string {
  // First check the dedicated Emails relation
  if (patient.Emails && Array.isArray(patient.Emails) && patient.Emails.length > 0) {
    // Get the first email (which should be the primary one based on the query)
    const primaryEmail = patient.Emails[0]?.email;
    if (primaryEmail) return primaryEmail;
  }
  
  // Fallback to contact field if available
  try {
    if (patient.contact) {
      // Handle string JSON or object format
      let contactData = patient.contact;
      
      // Parse if it's a string
      if (typeof contactData === 'string') {
        try {
          contactData = JSON.parse(contactData);
        } catch {
          // If parsing fails, search for email-like patterns in the string
          const emailMatch = contactData.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
          return emailMatch ? emailMatch[0] : '';
        }
      }
      
      // Handle array format contact data
      if (Array.isArray(contactData)) {
        const emailEntry = contactData.find((entry: any) => 
          entry && (entry.system === 'email' || entry.use === 'email' || 
                  entry.type === 'email' || entry.value?.includes('@')));
        return emailEntry?.value || '';
      }
      
      // Handle object format
      if (contactData && typeof contactData === 'object') {
        // Check common property names for email
        for (const key of ['email', 'emailAddress', 'primaryEmail']) {
          if (contactData[key] && typeof contactData[key] === 'string') {
            return contactData[key];
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting email from contact data:', error);
    return '';
  }
  
  return '';
}

function extractPrimaryPhone(patient: any): string {
  // First check the dedicated Phones relation
  if (patient.Phones && Array.isArray(patient.Phones) && patient.Phones.length > 0) {
    // Get the first phone number (which should be the primary one based on the query)
    const primaryPhone = patient.Phones[0]?.phone;
    if (primaryPhone) return primaryPhone;
  }
  
  // Fallback to contact field if available
  try {
    if (patient.contact) {
      // Handle string JSON or object format
      let contactData = patient.contact;
      
      // Parse if it's a string
      if (typeof contactData === 'string') {
        try {
          contactData = JSON.parse(contactData);
        } catch {
          // If parsing fails, search for phone-like patterns in the string
          // Match common phone formats with optional country code
          const phoneMatch = contactData.match(/(?:\+[0-9]{1,3}[-\s]?)?(?:[0-9]{3}[-\s]?[0-9]{3}[-\s]?[0-9]{4}|\([0-9]{3}\)[-\s]?[0-9]{3}[-\s]?[0-9]{4})/i);
          return phoneMatch ? phoneMatch[0] : '';
        }
      }
      
      // Handle array format contact data
      if (Array.isArray(contactData)) {
        const phoneEntry = contactData.find((entry: any) => 
          entry && (entry.system === 'phone' || entry.use === 'phone' || 
                  entry.type === 'phone' || 
                  (entry.value && typeof entry.value === 'string' && 
                   /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(entry.value))));
        return phoneEntry?.value || '';
      }
      
      // Handle object format
      if (contactData && typeof contactData === 'object') {
        // Check common property names for phone
        for (const key of ['phone', 'phoneNumber', 'primaryPhone', 'mobile', 'cell', 'telephone']) {
          if (contactData[key] && typeof contactData[key] === 'string') {
            return contactData[key];
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting phone from contact data:', error);
    return '';
  }
  
  return '';
}

async function checkRateLimit(ipAddress: string, endpoint: keyof typeof RATE_LIMIT_CONFIG): Promise<RateLimitResult | null> {
  const config = RATE_LIMIT_CONFIG[endpoint];
  const now = Date.now();
  
  let record = requestCounts.get(ipAddress);
  
  if (!record || record.resetTime < now) {
    record = { count: 0, resetTime: now + config.windowMs };
    requestCounts.set(ipAddress, record);
  }
  
  record.count++;
  
  if (record.count > config.limit) {
    await logSecurityEvent({
      action: `${endpoint}_RATE_LIMIT_EXCEEDED`,
      ipAddress,
      details: {
        count: record.count,
        limit: config.limit,
      },
      success: false,
    });
    
    return {
      status: 429,
      response: NextResponse.json(
        { success: false, message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)) } }
      ),
    };
  }
  
  return null;
}

// Simplified security logging to avoid Prisma schema issues
async function logSecurityEvent(data: AuditLogData): Promise<void> {
  try {
    // Convert patientId to details if it exists
    let finalDetails = {...(data.details || {})};
    if (data.patientId) {
      finalDetails.patientId = data.patientId;
    }

    // Log to database with a safe structure
    await prisma.$executeRaw`
      INSERT INTO "SecurityAuditLog" ("action", "ipAddress", "details", "success", "createdAt")
      VALUES (
        ${data.action},
        ${data.ipAddress || null},
        ${JSON.stringify(finalDetails)},
        ${data.success || false},
        ${new Date()}
      )
    `;
  } catch (error) {
    // Just log errors locally without failing
    console.error('Failed to log security event:', error);
  }
}