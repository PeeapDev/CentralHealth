import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';

// GET /api/hospitals/[hospitalName]/referrals
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    let authResult;
    
    // In development mode, bypass authentication for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Authentication bypassed for referrals GET');
      authResult = { authenticated: true, user: { role: 'doctor', hospitalId: 'dev_hospital' } };
    } else {
      authResult = await getAuth(request);
    }
    
    // Check authentication
    if (!authResult.authenticated) {
      console.log('Authentication failed:', authResult.error);
      console.log('Auth headers:', request.headers.get('authorization'));
      
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized access", details: authResult.error }),
        { status: 401 }
      );
    }

    // Validate hospital exists
    const hospital = await prisma.hospital.findFirst({
      where: {
        subdomain: params.hospitalName,
      },
    });

    if (!hospital) {
      return new NextResponse(
        JSON.stringify({ error: "Hospital not found" }),
        { status: 404 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');

    // Build filter
    const filter: any = {
      OR: [
        { fromHospitalId: hospital.id },
        { toHospitalId: hospital.id }
      ]
    };

    if (status) {
      filter.status = status;
    }

    if (patientId) {
      filter.patientId = patientId;
    }

    // Get referrals
    const referrals = await prisma.referral.findMany({
      where: filter,
      include: {
        patient: true,
        fromHospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        },
        toHospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("Error getting referrals:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to get referrals" }),
      { status: 500 }
    );
  }
}

// POST /api/hospitals/[hospitalName]/referrals
export async function POST(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    let authResult;
    
    // In development mode, bypass authentication for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Authentication bypassed for referrals POST');
      authResult = { authenticated: true, user: { role: 'doctor', hospitalId: 'dev_hospital' } };
    } else {
      authResult = await getAuth(request);
    }
    
    // Check authentication
    if (!authResult.authenticated) {
      console.log('Authentication failed:', authResult.error);
      console.log('Auth headers:', request.headers.get('authorization'));
      
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized access", details: authResult.error }),
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    console.log('Received referral request body:', body);
    
    const { 
      patientId, 
      toHospitalId, 
      reason,
      notes, 
      priority = "ROUTINE", 
      requiresAmbulance = false
    } = body;

    // Validate required fields
    if (!patientId || !toHospitalId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields", received: { patientId, toHospitalId } }),
        { status: 400 }
      );
    }

    // Get the referring hospital
    const referringHospital = await prisma.hospital.findFirst({
      where: {
        subdomain: params.hospitalName,
      },
    });

    if (!referringHospital) {
      return new NextResponse(
        JSON.stringify({ error: "Referring hospital not found" }),
        { status: 404 }
      );
    }
    
    // Get the receiving hospital
    const receivingHospital = await prisma.hospital.findFirst({
      where: {
        id: toHospitalId,
      },
    });

    if (!receivingHospital) {
      return new NextResponse(
        JSON.stringify({ error: "Receiving hospital not found" }),
        { status: 404 }
      );
    }
    
    // Get the patient to retrieve the mrn (medical ID)
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, mrn: true }
    });
    
    if (!patient) {
      return new NextResponse(
        JSON.stringify({ error: "Patient not found" }),
        { status: 404 }
      );
    }

    // Generate a unique referral code
    const referralCode = `REF-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Create the referral in the database
    const newReferral = await prisma.referral.create({
      data: {
        patient: { connect: { id: patient.id } },
        fromHospital: { connect: { id: referringHospital.id } },
        toHospital: { connect: { id: receivingHospital.id } },
        reason,
        notes,
        priority,
        requiresAmbulance,
        status: "PENDING",
        referralCode,
        statusHistory: {
          create: {
            status: "PENDING",
            changedAt: new Date(),
            changedBy: "System", // Or use authenticated user info
          },
        },
      },
      include: {
        patient: true,
        fromHospital: true,
        toHospital: true,
      },
    });

    // Revalidate the path to show the new referral in the list
    revalidatePath(`/`);
    
    // Revalidate the referrals page
    revalidatePath(`/${params.hospitalName}/admin/referral`);
    
    // Return the response with the client referral
    return NextResponse.json({ 
      success: true,
      clientReferral: clientReferral,
      message: "Referral created successfully" 
    });

  } catch (error) {
    console.error("Error creating referral:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create referral" }),
      { status: 500 }
    );
  }
}