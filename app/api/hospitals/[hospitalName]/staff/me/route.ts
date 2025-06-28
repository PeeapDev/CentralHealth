import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to retrieve authenticated staff member's information
 * This endpoint returns the current staff user's data based on their session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Extract user ID from session
    const userId = session.user.id;
    
    // Get hospital from DB
    const hospital = await prisma.hospital.findFirst({
      where: {
        slug: params.hospitalName
      }
    });
    
    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }
    
    // Get staff record that matches this user in this hospital
    const staff = await prisma.staff.findFirst({
      where: {
        userId: userId,
        hospitalId: hospital.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        department: true,
        specialization: true
      }
    });
    
    if (!staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }
    
    // Return formatted staff data (exclude sensitive fields)
    return NextResponse.json({
      id: staff.id,
      staffId: staff.staffId,
      name: staff.user.name,
      email: staff.user.email,
      photo: staff.user.image,
      role: staff.role,
      department: staff.department?.name,
      specialization: staff.specialization?.name,
      startDate: staff.startDate,
      status: staff.status,
      hospitalId: hospital.id,
      hospitalName: hospital.name
    });
  } catch (error: any) {
    console.error("Error fetching staff data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve staff data" },
      { status: 500 }
    );
  }
}
