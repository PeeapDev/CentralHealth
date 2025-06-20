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
        { referringHospitalId: hospital.id },
        { receivingHospitalId: hospital.id }
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
        referringHospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        },
        receivingHospital: {
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
    const { 
      patientId, 
      notes, 
      medicalSummary, 
      receivingHospitalId,
      priority = "ROUTINE", 
      ambulanceRequired = false 
    } = body;

    // Validate required fields
    if (!patientId || !receivingHospitalId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Generate a unique referral code
    const referralCode = `REF-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create the referral
    const referral = await prisma.referral.create({
      data: {
        patientId,
        referralCode,
        notes,
        medicalSummary,
        referringHospitalId: referringHospital.id,
        receivingHospitalId,
        priority,
        ambulanceRequired,
        status: "PENDING"
      },
    });

    // Update the patient's referral status
    await prisma.patient.update({
      where: { id: patientId },
      data: { 
        referralCode: referralCode,
        referralStatus: "PENDING",
        currentHospitalId: referringHospital.id
      },
    });

    // Revalidate the referrals page
    revalidatePath(`/${params.hospitalName}/admin/referral`);

    return NextResponse.json({ 
      referral,
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
