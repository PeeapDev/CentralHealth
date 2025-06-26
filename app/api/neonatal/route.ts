import { NextResponse } from "next/server"
import { prisma } from "@/lib/database/prisma-client"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: Request) {
  const requestId = uuidv4();
  console.log(`[${requestId}] Processing neonatal GET request`);
  
  try {    
    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')
    
    if (!hospitalId) {
      console.log(`[${requestId}] Missing hospitalId parameter`);
      return NextResponse.json(
        { error: "Hospital ID is required", requestId },
        { status: 400 }
      )
    }

    // Get neonatal records with Prisma
    const neonatalRecords = await prisma.neonatalRecord.findMany({
      where: { hospitalId },
      include: {
        Patient_NeonatalRecord_patientIdToPatient: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(`[${requestId}] Found ${neonatalRecords.length} neonatal records`);
    return NextResponse.json({
      patients: neonatalRecords,
      requestId
    });
    
  } catch (error) {
    console.error(`[${requestId}] Error fetching neonatal patients:`, error);
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestId = uuidv4();
  console.log(`[${requestId}] Processing neonatal POST request`);
  
  try {
    const body = await request.json();
    
    // Validate required fields for a neonatal record
    if (!body.hospitalId || !body.patientId) {
      console.log(`[${requestId}] Missing required fields:`, body);
      return NextResponse.json(
        { error: "Missing required fields: hospitalId and patientId are required", requestId },
        { status: 400 }
      );
    }

    // Create data object with proper type handling
    const neonatalData: any = {
      hospitalId: body.hospitalId,
      patientId: body.patientId,
      mrn: body.mrn || '',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Only add optional fields if they exist
    if (body.birthWeight !== undefined) {
      neonatalData.birthWeight = Number(body.birthWeight);
    }
    
    if (body.gestationalAgeAtBirth !== undefined) {
      neonatalData.gestationalAgeAtBirth = Number(body.gestationalAgeAtBirth);
    }
    
    if (body.apgarScore !== undefined) {
      neonatalData.apgarScore = Number(body.apgarScore);
    }
    
    if (body.motherId) {
      neonatalData.motherId = body.motherId;
    }
    
    if (body.careLevel) {
      neonatalData.careLevel = body.careLevel;
    } else {
      neonatalData.careLevel = 'NORMAL';
    }
    
    // Create neonatal record with Prisma using properly constructed data
    const newNeonatalRecord = await prisma.neonatalRecord.create({
      data: neonatalData,
      include: {
        Patient_NeonatalRecord_patientIdToPatient: true
      }
    });
    
    console.log(`[${requestId}] Created new neonatal record with ID: ${newNeonatalRecord.id}`);
    return NextResponse.json({
      success: true,
      record: newNeonatalRecord,
      requestId
    }, { status: 201 });
    
  } catch (error: any) {
    console.error(`[${requestId}] Error creating neonatal record:`, error);
    return NextResponse.json(
      { 
        error: "Error creating neonatal record", 
        message: error?.message || "Unknown error",
        requestId 
      },
      { status: 500 }
    );
  }
}
