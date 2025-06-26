import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Import prisma from the correct path
import { prisma } from '@/lib/database/prisma-client';

// PRESENTATION MODE - Simplified authentication without sessions

/**
 * Safely parse JSON data with error handling
 */
function safeParseJson(jsonString: any): any {
  if (!jsonString) return {};
  if (typeof jsonString !== 'string') return jsonString;
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return {};
  }
}

/**
 * Generate a request ID for tracking login attempts
 */
function generateRequestId(): string {
  return `login-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Extract email from contact JSON field
 */
function extractEmailFromContact(contactJson: string | null): string | null {
  if (!contactJson) return null;
  
  try {
    const contacts = JSON.parse(contactJson);
    if (!Array.isArray(contacts)) return null;
    
    const emailContact = contacts.find((c: any) => 
      c && c.system === 'email' && c.value && typeof c.value === 'string'
    );
    
    return emailContact ? emailContact.value : null;
  } catch (e) {
    console.error('Error parsing contact JSON:', e);
    return null;
  }
}

/**
 * Verify password for presentation mode
 */
function verifyPresentationPassword(inputPassword: string, storedPassword: string): boolean {
  // For presentation mode, we're doing simple string comparison
  // In a real system this would use proper password hashing
  return inputPassword === storedPassword;
}

/**
 * Patient login handler - PRESENTATION MODE (without session cookies)
 */
export async function POST(req: NextRequest) {
  // Create a request ID to track this login attempt in logs
  const requestId = req.headers.get('X-Request-ID') || generateRequestId();
  
  try {
    // Add global error handler to catch any unexpected errors
    process.on('uncaughtException', (error) => {
      console.error(`[${requestId}] CRITICAL - Uncaught exception:`, error);
      // Don't exit the process as this would crash the server
    });
    
    // Verify request has a valid content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[${requestId}] Invalid content type: ${contentType}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid content type, expected application/json',
          error: 'INVALID_CONTENT' 
        },
        { status: 400 }
      );
    }
    // Extract credentials from request body with error handling
    let body;
    try {
      body = await req.json();
      console.log(`[${requestId}] Request body received`);
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse request body:`, parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid JSON in request body',
          error: 'INVALID_JSON' 
        },
        { status: 400 }
      );
    }
    
    const { email, password } = body || {};
    
    console.log(`[${requestId}] Login request:`, { 
      hasEmail: !!email, 
      emailType: typeof email,
      emailLength: email?.length,
      hasPassword: !!password
    });
    
    if (!email || !password) {
      console.log(`[${requestId}] Missing credentials`);
      return NextResponse.json(
        { success: false, message: 'Email and password are required', error: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }
    
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[${requestId}] Searching for patient with email: ${normalizedEmail.substring(0, 3)}****`);
    
    // Try to find the patient by email in PatientEmail table
    let patient: any = null;

    try {
      console.log(`[${requestId}] Searching for patient with email in PatientEmail table`);
      
      // Find patient by email in PatientEmail table
      const patientEmail = await prisma.patientEmail.findFirst({
        where: {
          email: normalizedEmail,
        },
        include: {
          patient: true
        }
      });
      
      // If found patient email, use the associated patient record
      if (patientEmail?.patient) {
        patient = patientEmail.patient;
        console.log(`[${requestId}] Found patient through PatientEmail table`);
      }
      
      // If not found, try to find via User -> Patient relationship
      if (!patient) {
        console.log(`[${requestId}] Searching via User -> Patient relationship`);
        
        // First find the user by email
        const user = await prisma.user.findFirst({
          where: {
            email: normalizedEmail
          }
        });
        
        // Then find patient with this userId
        if (user?.id) {
          const linkedPatient = await prisma.patient.findUnique({
            where: {
              userId: user.id
            }
          });
          
          if (linkedPatient) {
            patient = linkedPatient;
            console.log(`[${requestId}] Found patient through User->Patient relation`);
          }
        }
      }
    } catch (error) {
      console.error(`[${requestId}] Error searching patients:`, error);
    }

    if (!patient) {
      console.log(`[${requestId}] No patient found with email: ${normalizedEmail.substring(0, 3)}****`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password', 
          error: 'USER_NOT_FOUND',
          details: 'No matching patient record found with the provided email address'
        },
        { status: 401 }
      );
    }

    console.log(`[${requestId}] Patient found, verifying password`);
    
    // Get the user associated with this patient to verify password
    let isValidPassword = false;
    
    try {
      // Get the associated user account to verify password
      if (patient.userId) {
        const user = await prisma.user.findUnique({
          where: {
            id: patient.userId
          },
          select: {
            id: true,
            password: true,
            email: true
          }
        });

        if (user && user.password) {
          console.log(`[${requestId}] Found user with hashed password, verifying...`);
          // Use bcrypt to compare passwords
          isValidPassword = await bcrypt.compare(password, user.password);
        } else {
          console.log(`[${requestId}] User not found or no password stored`);
        }
      } else {
        console.log(`[${requestId}] Patient has no associated userId, authentication not possible`);
      }
      
      // Log the result of password verification
      if (isValidPassword) {
        console.log(`[${requestId}] Password verification successful`);
      } else {
        console.log(`[${requestId}] Password verification failed`);
      }
    } catch (e) {
      console.error(`[${requestId}] Error verifying password:`, e);
      isValidPassword = false;
    }
    
    if (!isValidPassword) {
      console.log(`[${requestId}] Invalid password`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password', 
          error: 'INVALID_PASSWORD',
          details: 'The password provided does not match our records'
        },
        { status: 401 }
      );
    }

    // Login successful
    console.log(`[${requestId}] Login successful for patient ID: ${patient.id}`);
    
    // Determine if patient has completed onboarding
    let onboardingCompleted = false;
    
    // Check top-level onboardingCompleted field first
    if (typeof patient.onboardingCompleted === 'boolean') {
      onboardingCompleted = patient.onboardingCompleted;
    } else {
      // Fall back to medicalHistory.onboardingCompleted for backward compatibility
      try {
        const medicalHistory = safeParseJson(patient.medicalHistory);
        if (medicalHistory && typeof medicalHistory.onboardingCompleted === 'boolean') {
          onboardingCompleted = medicalHistory.onboardingCompleted;
        }
      } catch (error) {
        console.error(`[${requestId}] Error parsing medical history:`, error);
      }
    }
    
    // Extract email from contacts JSON for response
    const userEmail = extractEmailFromContact(patient.contact) || email;
    
    // Generate simple auth token for presentation mode (insecure - for demo only)
    const simpleToken = Buffer.from(`${patient.id}:${patient.mrn}`).toString('base64');
    
    // PRESENTATION MODE RESPONSE - No cookies, just direct data
    console.log(`[${requestId}] Sending presentation mode response with direct auth data`);
    
    return NextResponse.json({
      success: true,
      presentationMode: true,
      token: simpleToken,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        name: patient.name,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        email: userEmail,
        onboardingCompleted
      },
      message: 'Login successful - PRESENTATION MODE'
    });
    
  } catch (error: any) {
    console.error(`[${requestId}] Login error:`, error);
    
    // Extract error message if available
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    // Log additional diagnostic information
    console.error(`[${requestId}] Error details:\nMessage: ${errorMessage}\nStack: ${errorStack}`);
    
    try {
      // Try to send a properly formatted error response
      return NextResponse.json(
        { 
          success: false, 
          message: 'An error occurred during login', 
          error: 'SERVER_ERROR',
          details: errorMessage
        },
        { status: 500 }
      );
    } catch (responseError) {
      // If we can't even send a JSON response, create a basic text response
      console.error(`[${requestId}] Failed to create error response:`, responseError);
      return new NextResponse(
        `Login failed: ${errorMessage}`,
        { status: 500, headers: { 'Content-Type': 'text/plain' } }
      );
    }
  }
}
