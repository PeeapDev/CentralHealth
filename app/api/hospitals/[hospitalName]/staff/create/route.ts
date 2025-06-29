import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyHospitalAuth } from '@/lib/auth';

/**
 * API endpoint to create a new staff member
 * Strictly follows hospital staff security policy:
 * - Maintains separation between admin and staff accounts
 * - Prevents elevation of privileges
 * - Includes admin protection guards
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    // Get the hospital name from parameters
    const hospitalName = params.hospitalName;

    // Verify authentication and that the user has admin privileges
    const authResult = await verifyHospitalAuth(request, hospitalName);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Authentication failed" },
        { status: authResult.status || 401 }
      );
    }

    // If we get here, the user is authenticated
    if (!authResult.user) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 }
      );
    }

    // Only hospital admins can create staff
    if (!authResult.user.isHospitalAdmin && !authResult.user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Insufficient privileges to create staff" },
        { status: 403 }
      );
    }

    // Parse the request body
    const requestData = await request.json();
    const { 
      name, 
      email, 
      role, 
      specialties = [],
      salary,
      department,
      isHospitalAdmin = false // Default to false for safety
    } = requestData;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    // Find hospital by name
    const hospital = await prisma.hospital.findFirst({
      where: {
        name: hospitalName,
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: "Hospital not found" },
        { status: 404 }
      );
    }

    // Security check: Only superadmins can create hospital admins
    if (isHospitalAdmin && !authResult.user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Only superadmins can create hospital admin accounts" },
        { status: 403 }
      );
    }

    // Check if staff with this email already exists for this hospital
    const existingStaff = await prisma.user.findFirst({
      where: {
        email: email,
        hospitalId: hospital.id,
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Staff with this email already exists for this hospital" },
        { status: 409 }
      );
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the staff member
    const newStaff = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashedPassword,
        role: role,
        specialties: specialties,
        hospital: {
          connect: { id: hospital.id }
        },
        isHospitalAdmin: isHospitalAdmin,
        department: department,
        // If needed, add other fields like salary to a separate StaffProfile model
      },
    });

    // If salary is provided, create or update staff profile
    if (salary) {
      await prisma.staffProfile.upsert({
        where: {
          userId: newStaff.id,
        },
        update: {
          salary: salary,
        },
        create: {
          userId: newStaff.id,
          hospitalId: hospital.id,
          salary: salary,
          taxRate: 0,
          shift: "MORNING",
        },
      });
    }

    // Create an audit log for staff creation
    await prisma.securityAuditLog.create({
      data: {
        action: 'STAFF_CREATE',
        userId: authResult.user.id,
        details: `Created staff member: ${name} (${email})`,
      },
    });

    // Return the new staff member (without password)
    const { password, ...staffWithoutPassword } = newStaff;
    
    return NextResponse.json({
      success: true,
      data: {
        ...staffWithoutPassword,
        tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined, // Only in dev mode
      },
      message: "Staff created successfully"
    });
  } catch (error) {
    console.error("Staff creation error:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
