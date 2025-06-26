/**
 * Patient Login Authentication Handler
 *
 * This API endpoint handles patient authentication by properly
 * querying the dedicated PatientEmail table instead of relying on the
 * deprecated contact JSON field.
 * 
 * Following CentralHealth System policies:
 * - All patient data must be real clinical data
 * - Medical IDs must NEVER be regenerated for existing patients
 * - Patient session handling follows strict security requirements
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";

// Authentication utility functions
const comparePasswords = async (plainPassword: string, hashedPassword: string) => {
  // Check if password is stored in plaintext (legacy) or hashed
  if (hashedPassword.startsWith("$2")) {
    // It's already a bcrypt hash
    return compare(plainPassword, hashedPassword);
  } else {
    // Legacy plaintext password - we should migrate these
    const matches = plainPassword === hashedPassword;
    if (matches) {
      // Auto-migrate to hashed password for security
      try {
        // This will happen on successful login - don't block the main flow if this fails
        const bcrypt = require("bcrypt");
        const hashedPwd = await bcrypt.hash(plainPassword, 10);
        const userWithPassword = await prisma.user.findFirst({
          where: { password: hashedPassword },
        });
        if (userWithPassword) {
          await prisma.user.update({
            where: { id: userWithPassword.id },
            data: { password: hashedPwd },
          });
          console.log(`Upgraded password hash for user ${userWithPassword.id}`);
        }
      } catch (e) {
        console.error("Failed to upgrade password hash:", e);
      }
    }
    return matches;
  }
};

// Generate authentication token with all necessary patient data
const generateToken = (payload: any) => {
  const secret = process.env.JWT_SECRET || "fallback-dev-secret-change-in-production";
  return sign(payload, secret, { expiresIn: "7d" });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Normalize the email for consistent matching
    const normalizedEmail = email.toLowerCase().trim();

    // PRIMARY AUTHENTICATION FLOW: Check dedicated email table first
    const patientEmail = await prisma.patientEmail.findFirst({
      where: {
        email: normalizedEmail,
      },
      include: {
        patient: {
          include: {
            User: true,
          },
        },
      },
    });

    // If patient email record exists, authenticate the associated user
    if (patientEmail?.patient?.User) {
      const user = patientEmail.patient.User;
      const validPassword = await comparePasswords(password, user.password);

      if (!validPassword) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Generate authentication token with proper patient information
      const token = generateToken({
        userId: user.id,
        patientId: patientEmail.patient.id,
        mrn: patientEmail.patient.mrn, // Include permanent medical ID
        role: user.role || "PATIENT",
        email: normalizedEmail,
      });

      // Set secure, HTTP-only cookie for authentication
      const cookieStore = cookies();
      cookieStore.set({
        name: "authToken",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Return success with patient data
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: normalizedEmail,
          role: user.role,
          patientId: patientEmail.patient.id,
          mrn: patientEmail.patient.mrn,
        },
      });
    }

    // FALLBACK AUTHENTICATION: Try direct user table lookup
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
      include: {
        patient: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await comparePasswords(password, user.password);

    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token with available patient data
    const token = generateToken({
      userId: user.id,
      patientId: user.patient?.id,
      mrn: user.patient?.mrn, // Include permanent medical ID if available
      role: user.role,
      email: normalizedEmail,
    });

    // Set secure, HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set({
      name: "authToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Check if we need to create an entry in the PatientEmail table for this user
    // This helps migrate users who don't have a proper email entry yet
    if (user.patient && !patientEmail) {
      try {
        await prisma.patientEmail.create({
          data: {
            patientId: user.patient.id,
            email: normalizedEmail,
            primary: true, // Set as primary since it's the login email
            verified: true, // Consider it verified since user can authenticate with it
          },
        });
        console.log(`Created missing PatientEmail record for patient ${user.patient.id}`);
      } catch (e) {
        console.error("Failed to create PatientEmail record:", e);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId: user.patient?.id,
        mrn: user.patient?.mrn,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
