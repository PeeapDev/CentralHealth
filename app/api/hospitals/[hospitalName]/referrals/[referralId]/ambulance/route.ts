import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET handler for fetching ambulance dispatch details for a referral
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string; referralId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hospitalName, referralId } = params;

    // Find the hospital by subdomain
    const hospital = await prisma.hospital.findFirst({
      where: { subdomain: hospitalName },
      select: { id: true }
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Check if the referral exists and belongs to this hospital
    const referral = await prisma.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { fromHospitalId: hospital.id },
          { toHospitalId: hospital.id }
        ]
      },
      include: {
        ambulanceDispatch: {
          include: {
            ambulance: true
          }
        }
      }
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    if (!referral.ambulanceDispatch) {
      return NextResponse.json({ error: "No ambulance dispatch found for this referral" }, { status: 404 });
    }

    return NextResponse.json(referral.ambulanceDispatch);
  } catch (error) {
    console.error("Error fetching ambulance dispatch:", error);
    return NextResponse.json(
      { error: "Failed to fetch ambulance dispatch" },
      { status: 500 }
    );
  }
}

// POST handler for requesting an ambulance for a referral
export async function POST(
  request: NextRequest,
  { params }: { params: { hospitalName: string; referralId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hospitalName, referralId } = params;
    const data = await request.json();

    // Find the hospital by subdomain
    const hospital = await prisma.hospital.findFirst({
      where: { subdomain: hospitalName },
      select: { id: true }
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Check if the referral exists and belongs to this hospital
    const referral = await prisma.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { fromHospitalId: hospital.id },
          { toHospitalId: hospital.id }
        ]
      },
      include: {
        ambulanceDispatch: true
      }
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Check if an ambulance dispatch already exists for this referral
    if (referral.ambulanceDispatch) {
      return NextResponse.json(
        { error: "Ambulance dispatch already exists for this referral" },
        { status: 400 }
      );
    }

    // Find an available ambulance
    const availableAmbulance = await prisma.ambulance.findFirst({
      where: {
        hospitalId: hospital.id,
        status: "AVAILABLE"
      }
    });

    if (!availableAmbulance) {
      return NextResponse.json(
        { error: "No available ambulances" },
        { status: 400 }
      );
    }

    // Calculate estimated arrival time (30 minutes from now for demo purposes)
    const dispatchTime = new Date();
    const estimatedArrival = new Date(dispatchTime.getTime() + 30 * 60000);

    // Create ambulance dispatch
    const ambulanceDispatch = await prisma.ambulanceDispatch.create({
      data: {
        referralId: referral.id,
        ambulanceId: availableAmbulance.id,
        status: "DISPATCHED",
        dispatchTime,
        estimatedArrival,
        pickupLocation: data.pickupLocation || "Patient's home",
        dropoffLocation: referral.toHospital.name,
        notes: data.notes || ""
      },
      include: {
        ambulance: true,
        referral: {
          include: {
            patient: {
              select: {
                id: true,
                mrn: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Update the ambulance status to DISPATCHED
    await prisma.ambulance.update({
      where: { id: availableAmbulance.id },
      data: { status: "DISPATCHED" }
    });

    return NextResponse.json(ambulanceDispatch);
  } catch (error) {
    console.error("Error creating ambulance dispatch:", error);
    return NextResponse.json(
      { error: "Failed to create ambulance dispatch" },
      { status: 500 }
    );
  }
}

// PUT handler for updating ambulance dispatch status
export async function PUT(
  request: NextRequest,
  { params }: { params: { hospitalName: string; referralId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hospitalName, referralId } = params;
    const data = await request.json();

    // Find the hospital by subdomain
    const hospital = await prisma.hospital.findFirst({
      where: { subdomain: hospitalName },
      select: { id: true }
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Check if the referral exists and belongs to this hospital
    const referral = await prisma.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { fromHospitalId: hospital.id },
          { toHospitalId: hospital.id }
        ]
      },
      include: {
        ambulanceDispatch: true
      }
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    if (!referral.ambulanceDispatch) {
      return NextResponse.json(
        { error: "No ambulance dispatch found for this referral" },
        { status: 404 }
      );
    }

    // Update ambulance dispatch status
    const updatedDispatch = await prisma.ambulanceDispatch.update({
      where: { id: referral.ambulanceDispatch.id },
      data: {
        status: data.status,
        notes: data.notes || referral.ambulanceDispatch.notes,
        currentLocation: data.currentLocation || referral.ambulanceDispatch.currentLocation,
        driverName: data.driverName || referral.ambulanceDispatch.driverName,
        driverPhone: data.driverPhone || referral.ambulanceDispatch.driverPhone
      },
      include: {
        ambulance: true
      }
    });

    // Update ambulance status based on dispatch status
    if (data.status === "COMPLETED") {
      await prisma.ambulance.update({
        where: { id: referral.ambulanceDispatch.ambulanceId },
        data: { status: "AVAILABLE" }
      });
    } else if (data.status === "CANCELLED") {
      await prisma.ambulance.update({
        where: { id: referral.ambulanceDispatch.ambulanceId },
        data: { status: "AVAILABLE" }
      });
    }

    return NextResponse.json(updatedDispatch);
  } catch (error) {
    console.error("Error updating ambulance dispatch:", error);
    return NextResponse.json(
      { error: "Failed to update ambulance dispatch" },
      { status: 500 }
    );
  }
}
