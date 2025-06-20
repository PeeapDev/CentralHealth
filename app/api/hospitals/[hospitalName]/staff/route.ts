import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

// Validation schema for staff
const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.string(),
  department: z.string(),
  canChatWithPatients: z.boolean().default(false),
});

// GET /api/hospitals/[hospitalName]/staff - Get all staff for a hospital
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
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

    // Get staff for this hospital
    const staff = await prisma.user.findMany({
      where: { 
        hospitalId: hospital.id,
        // Only get staff members (not patients)
        role: {
          in: ["doctor", "nurse", "receptionist", "admin", "staff"]
        }
      },
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

    return NextResponse.json({ staff });
    
  } catch (error) {
    console.error("Error fetching hospital staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/hospitals/[hospitalName]/staff - Add new staff member
export async function POST(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = staffSchema.parse(body);

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 400 }
      );
    }

    // Create new staff member
    const newUser = await prisma.user.create({
      data: {
        ...validatedData,
        hospitalId: hospital.id,
        // Generate a temporary password that will need to be reset
        password: await generateTempPassword(),
      },
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

    // TODO: Send email with temporary credentials

    return NextResponse.json(newUser, { status: 201 });
    
  } catch (error) {
    console.error("Error creating hospital staff:", error);
    
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

// Helper function to generate a temporary password
async function generateTempPassword(): Promise<string> {
  // Generate a random 10-character password
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
