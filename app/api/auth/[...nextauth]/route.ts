'use server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";

// These routes handle NextAuth authentication without using the NextAuth.js library directly
// This follows CentralHealth policy for secure authentication with medical IDs

export async function GET(request: Request) {
  return NextResponse.json({
    success: false,
    error: "Method not supported"
  }, { status: 405 });
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password are required"
      }, { status: 400 });
    }
    
    // Find the user with this email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Invalid credentials"
      }, { status: 401 });
    }
    
    // Verify password
    let isValidPassword = false;
    
    if (user.password) {
      // Check if password is hashed
      if (user.password.startsWith('$2')) {
        isValidPassword = await bcrypt.compare(password, user.password);
      } else {
        // Plain text comparison (for new accounts)
        isValidPassword = password === user.password;
      }
    }
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: "Invalid credentials"
      }, { status: 401 });
    }
    
    // Generate JWT token
    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      hospitalId: user.hospitalId
    });
    
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("NextAuth route error:", error);
    return NextResponse.json({
      success: false,
      error: "Authentication failed"
    }, { status: 500 });
  }
}
