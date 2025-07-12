import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET handler for fetching a specific referral
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

    // Get the specific referral where this hospital is either the referring or receiving hospital
    const referral = await prisma.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { fromHospitalId: hospital.id },
          { toHospitalId: hospital.id }
        ]
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            name: true,
            dateOfBirth: true,
            gender: true
          }
        },
        fromHospital: true,
        toHospital: true,
        referringDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        receivingDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        ambulanceDispatch: true
      }
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    return NextResponse.json(referral);
  } catch (error) {
    console.error("Error fetching referral:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral" },
      { status: 500 }
    );
  }
}

// PUT handler for updating a referral
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
    const existingReferral = await prisma.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { fromHospitalId: hospital.id },
          { toHospitalId: hospital.id }
        ]
      }
    });

    if (!existingReferral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Update the referral
    const updatedReferral = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: data.status,
        notes: data.notes,
        receivingDoctorId: data.receivingDoctorId,
        completedAt: data.status === "COMPLETED" ? new Date() : existingReferral.completedAt
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            name: true
          }
        },
        fromHospital: true,
        toHospital: true,
        referringDoctor: {
          select: {
            id: true,
            name: true
          }
        },
        receivingDoctor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedReferral);
  } catch (error) {
    console.error("Error updating referral:", error);
    return NextResponse.json(
      { error: "Failed to update referral" },
      { status: 500 }
    );
  }
}

// DELETE handler for cancelling a referral
export async function DELETE(
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
    const existingReferral = await prisma.referral.findFirst({
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

    if (!existingReferral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Update the referral status to CANCELLED
    const cancelledReferral = await prisma.referral.update({
      where: { id: referralId },
      data: { status: "CANCELLED" }
    });

    // If there's an associated ambulance dispatch, cancel it too
    if (existingReferral.ambulanceDispatch) {
      await prisma.ambulanceDispatch.update({
        where: { id: existingReferral.ambulanceDispatch.id },
        data: { status: "CANCELLED" }
      });
    }

    return NextResponse.json({ message: "Referral cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling referral:", error);
    return NextResponse.json(
      { error: "Failed to cancel referral" },
      { status: 500 }
    );
  }
}
