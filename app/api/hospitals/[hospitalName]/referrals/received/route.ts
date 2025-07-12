import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET handler for fetching referrals received by a hospital
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hospitalName = params.hospitalName;

    // Find the hospital by subdomain
    const hospital = await prisma.hospital.findFirst({
      where: {
        OR: [
          { subdomain: hospitalName }
        ]
      },
      select: { id: true }
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Get all referrals where this hospital is the receiving hospital
    const referrals = await prisma.referral.findMany({
      where: {
        toHospitalId: hospital.id
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
        ambulanceDispatch: {
          include: {
            ambulance: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(referrals);
  } catch (error) {
    console.error("Error fetching received referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch received referrals" },
      { status: 500 }
    );
  }
}
