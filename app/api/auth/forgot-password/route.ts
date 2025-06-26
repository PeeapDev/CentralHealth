/**
 * Password Reset Request Handler
 *
 * This API endpoint handles patient password reset requests by properly
 * querying the dedicated PatientEmail table instead of relying on the
 * deprecated contact JSON field.
 * 
 * Following CentralHealth System policies:
 * - All patient data must be real clinical data
 * - Medical IDs must NEVER be regenerated for existing patients
 * - Protected patient data must be handled securely
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email"; // Adjust according to your email service

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address",
        },
        { status: 400 }
      );
    }

    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.toLowerCase().trim();

    // First, check the dedicated PatientEmail table
    const patientEmail = await prisma.patientEmail.findFirst({
      where: {
        email: normalizedEmail,
      },
      include: {
        patient: {
          include: {
            User: true, // Include user data to link to authentication
          },
        },
      },
    });

    // If no patient email found, check the User table directly as fallback
    const user = !patientEmail 
      ? await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
          },
          // We need to find the associated patient through the correct field name
          include: {
            patientProfile: true, // This is the correct field name in the Prisma schema
          },
        })
      : null;

    // Determine if we found a valid patient
    const patientId = patientEmail?.patientId || user?.patientProfile?.id;
    const userId = patientEmail?.patient?.User?.id || user?.id;
    const patientMrn = patientEmail?.patient?.mrn || user?.patientProfile?.mrn;

    // Always return a success message for security, even if no match
    // This prevents user enumeration attacks
    if (!patientId || !userId) {
      // For security, don't reveal if the email exists or not
      return NextResponse.json(
        {
          success: true,
          message: "If your email is registered, you will receive reset instructions",
        },
        { status: 200 }
      );
    }

    // Create a secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

    // Store the reset token in the database
    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        expiresAt,
        patientId,
        email: normalizedEmail,
      },
    });

    // Create reset link
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://patient.centralhospital.org'}/reset-password?token=${resetToken}`;

    // Send email with reset link
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Reset Your Password",
        html: `
          <h1>Password Reset</h1>
          <p>Hello,</p>
          <p>You requested a password reset for your patient account (Medical ID: ${patientMrn}).</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetLink}" style="padding: 10px 15px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this reset, please ignore this email.</p>
          <p>Thank you,<br/>Central Hospital Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't return error to client for security reasons
    }

    // Return success message
    return NextResponse.json({
      success: true,
      message: "If your email is registered, you will receive reset instructions",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}
