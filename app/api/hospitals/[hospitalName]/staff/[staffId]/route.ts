import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

// Validation schema for staff updates
const staffUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  canChatWithPatients: z.boolean().optional(),
});

// PUT /api/hospitals/[hospitalName]/staff/[staffId] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { hospitalName: string; staffId: string } }
) {
  try {
    // Authenticate request
    const authResult = await getAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role for this hospital
    const isAdmin = authResult.user.role === "admin" || 
                   authResult.user.role === "hospital_admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find hospital by name
    const hospital = await prisma.hospital.findFirst({
      where: { name: params.hospitalName },
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Verify staff exists and belongs to this hospital
    const existingStaff = await prisma.user.findFirst({
      where: {
        id: params.staffId,
        hospitalId: hospital.id,
      },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = staffUpdateSchema.parse(body);

    // Check email uniqueness if updating email
    if (validatedData.email && validatedData.email !== existingStaff.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 }
        );
      }
    }

    // Update staff member
    const updatedStaff = await prisma.user.update({
      where: { id: params.staffId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        department: true,
        canChatWithPatients: true,
      },
    });

    return NextResponse.json(updatedStaff);
    
  } catch (error) {
    console.error("Error updating hospital staff:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/hospitals/[hospitalName]/staff/[staffId] - Remove staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { hospitalName: string; staffId: string } }
) {
  try {
    // Authenticate request
    const authResult = await getAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role for this hospital
    const isAdmin = authResult.user.role === "admin" || 
                   authResult.user.role === "hospital_admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find hospital by name
    const hospital = await prisma.hospital.findFirst({
      where: { name: params.hospitalName },
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Verify staff exists and belongs to this hospital
    const existingStaff = await prisma.user.findFirst({
      where: {
        id: params.staffId,
        hospitalId: hospital.id,
      },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Delete staff member
    await prisma.user.delete({
      where: { id: params.staffId },
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting hospital staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
