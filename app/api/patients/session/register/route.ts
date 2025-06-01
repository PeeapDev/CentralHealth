import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { createPatientSession } from "@/lib/patient-session";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { firstName, lastName, email, phone, password, birthDate: rawBirthDate } = body;
    
    const missingFields: string[] = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!password) missingFields.push('password');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Format phone number
    const phoneNumber = phone.startsWith("+") ? phone : `+${phone}`;

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Generate unique medical number
    let medicalNumber = `SL-${Date.now().toString().slice(-6)}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Prepare name data
    const nameData = [
      {
        use: "official",
        family: lastName,
        given: [firstName],
      },
    ];

    // Prepare telecom data
    const telecomData = [
      {
        system: "email",
        value: email,
        use: "home",
      },
      {
        system: "phone",
        value: phoneNumber,
        use: "mobile",
      },
    ];

    // Prepare address data
    const addressData: Array<{
      use: string;
      type: string;
      line: string[];
      city?: string;
      district?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }> = [
      {
        use: "home",
        type: "physical",
        line: [body.address || ""],
        city: body.city || "",
        district: body.district || "",
        state: body.state || "",
        postalCode: body.postalCode || "",
        country: "Sierra Leone",
      },
    ];

    // Process birthDate (required in schema)
    let birthDate: Date;
    try {
      if (rawBirthDate) {
        birthDate = new Date(rawBirthDate);
        // Validate birthDate is not in the future
        if (birthDate > new Date()) {
          return NextResponse.json(
            { error: "Birth date cannot be in the future" },
            { status: 400 }
          );
        }
      } else {
        // Default date if not provided
        birthDate = new Date('1900-01-01'); 
      }
      
      // Check if birthDate is valid
      if (isNaN(birthDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (dateError) {
      console.error('Invalid birth date:', dateError);
      return NextResponse.json(
        { error: "Invalid birth date format" },
        { status: 400 }
      );
    }

    // Log the data we're about to send to Prisma
    console.log('Creating patient with data:', {
      medicalNumber,
      email,
      phone: phoneNumber,
      birthDate: birthDate.toISOString(),
    });
    
    // Check if a patient with this email already exists
    const existingPatient = await prisma.patient.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
      },
    });
    
    if (existingPatient) {
      return NextResponse.json(
        { error: "A patient with this email already exists" },
        { status: 409 } // Conflict
      );
    }
    
    // Create patient in database with retry mechanism
    let newPatient;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Create the patient data object without the problematic fields
        const patientData = {
          medicalNumber: medicalNumber,
          resourceType: "Patient",
          active: true,
          name: JSON.stringify(nameData),
          gender: body.gender || "unknown",
          birthDate: birthDate,
          email: email,
          phone: phoneNumber,
          password: hashedPassword,
          telecom: JSON.stringify(telecomData),
          address: JSON.stringify(addressData),
          photo: "",
        };
        
        // Add hospitalId only if provided
        if (body.hospitalId) {
          Object.assign(patientData, { hospitalId: String(body.hospitalId) });
        }
        
        newPatient = await prisma.patient.create({
          data: patientData,
          select: {
            id: true,
            medicalNumber: true,
            email: true,
            createdAt: true
          }
        });
        
        console.log('Patient created successfully:', newPatient.id);
        break; // Exit the retry loop if successful
      } catch (prismaError) {
        retryCount++;
        
        // Handle specific database errors
        if (prismaError instanceof PrismaClientKnownRequestError) {
          // P2002 is a unique constraint violation
          if (prismaError.code === 'P2002') {
            const target = (prismaError.meta?.target as string[]) || [];
            if (target.includes('medicalNumber')) {
              // Regenerate a different medical number
              console.log('Medical number collision, regenerating...');
              medicalNumber = `SL-${Date.now().toString().slice(-6)}-${Math.floor(
                Math.random() * 1000
              )}`;
              // Continue to retry with new medical number
              continue;
            }
            if (target.includes('email')) {
              return NextResponse.json(
                { error: "A patient with this email already exists" },
                { status: 409 } // Conflict
              );
            }
          }
        }
        
        // Log detailed error information
        console.error(`Prisma error creating patient (attempt ${retryCount}/${maxRetries}):`, {
          code: (prismaError as any).code,
          meta: (prismaError as any).meta,
          message: (prismaError as any).message,
          name: (prismaError as any).name,
          stack: (prismaError as any).stack,
        });
        
        // If we've reached max retries, throw the error to be caught by outer try/catch
        if (retryCount >= maxRetries) {
          throw prismaError;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
      }
    }
    
    if (!newPatient) {
      throw new Error('Failed to create patient after multiple attempts');
    }
    
    // Create session for the new patient
    try {
      await createPatientSession({
        id: newPatient.id,
        medicalNumber: newPatient.medicalNumber,
        firstName,
        lastName,
        email: newPatient.email || email, // Use the form email as fallback
        createdAt: new Date().toISOString(),
      });
      console.log('Patient session created successfully');
    } catch (sessionError) {
      console.error('Error creating patient session:', sessionError);
      // We'll still return success since the patient was created
      // The user can always log in afterwards
    }
    
    // Return success response with patient data (excluding password)
    return NextResponse.json(
      {
        message: "Patient registered successfully",
        patient: {
          id: newPatient.id,
          medicalNumber: newPatient.medicalNumber,
          firstName,
          lastName,
          email: newPatient.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Log the full error for debugging
    console.error("Patient registration error:", {
      message: error.message || 'No error message',
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    // Return appropriate error message
    let statusCode = 500;
    let errorMessage = "Failed to register patient. Please try again later.";
    
    if (error?.name === 'PrismaClientValidationError') {
      statusCode = 400;
      errorMessage = "Invalid patient data provided.";
    } else if (error?.name === 'PrismaClientKnownRequestError') {
      statusCode = 409; // Conflict
      errorMessage = "Database constraint violation. Please check your input.";
    }
    
    return NextResponse.json(
      { error: error.message || errorMessage },
      { status: statusCode }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from Prisma:', disconnectError);
    }
  }
}
