import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import type { ApiResponse, AuthResponse } from "@/lib/database/models"

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Safely handle potentially invalid JSON
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return Response.json(
        {
          success: false,
          error: "Invalid request format"
        },
        { status: 400 }
      );
    }
    
    const { hospitalSlug, email, password } = body || {}

    // Validation
    if (!hospitalSlug || !email || !password) {
      return Response.json(
        {
          success: false,
          error: "Hospital slug, email and password are required",
        } as ApiResponse,
        { status: 400 },
      )
    }

    // Find hospital
    let hospital;
    try {
      hospital = await prisma.hospital.findUnique({
        where: { subdomain: hospitalSlug },
      });
    } catch (dbError) {
      console.error('Hospital lookup error:', dbError);
      return Response.json(
        {
          success: false,
          error: "Database error while looking up hospital"
        },
        { status: 500 }
      );
    }
    
    if (!hospital) {
      return Response.json(
        {
          success: false,
          error: "Hospital not found",
        } as ApiResponse,
        { status: 404 },
      )
    }

    // Find user
    let user;
    try {
      user = await prisma.user.findFirst({
        where: {
          email: email,
          hospitalId: hospital.id
        }
      });
    } catch (dbError) {
      console.error('User lookup error:', dbError);
      return Response.json(
        {
          success: false,
          error: "Database error while looking up user"
        },
        { status: 500 }
      );
    }
    
    if (!user) {
      return Response.json(
        {
          success: false,
          error: "Invalid credentials",
        } as ApiResponse,
        { status: 401 },
      )
    }

    // Verify password with proper security practices
    let isValidPassword = false;
    try {
      if (!user.password) {
        return Response.json(
          {
            success: false,
            error: "Account setup is incomplete",
          } as ApiResponse,
          { status: 401 },
        );
      }

      // If password is stored as bcrypt hash (starts with $2)
      if (user.password.startsWith('$2')) {
        // Use bcrypt to compare the password
        isValidPassword = await bcrypt.compare(password, user.password);
      } 
      // If password is stored in plaintext (legacy)
      else if (password === user.password) {
        isValidPassword = true;
        
        // Upgrade the plaintext password to a bcrypt hash
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          });
          console.log('Upgraded plaintext password to bcrypt hash for user:', user.id);
        } catch (upgradeError) {
          console.error('Failed to upgrade password to bcrypt:', upgradeError);
          // Continue login process even if upgrade fails
        }
      }
    } catch (bcryptError) {
      console.error('Password verification error:', bcryptError);
      // Don't expose bcrypt errors, just return invalid credentials
      return Response.json(
        {
          success: false,
          error: "Invalid credentials"
        },
        { status: 401 }
      );
    }
    if (!isValidPassword) {
      return Response.json(
        {
          success: false,
          error: "Invalid credentials",
        } as ApiResponse,
        { status: 401 },
      )
    }

    // Generate JWT token with proper fields
    let token;
    try {
      // Include sub field as per JWT standards (subject identifier) equal to user ID
      const tokenResult = signToken({
        userId: user.id,
        hospitalId: hospital.id,
        role: user.role,
        email: user.email,
        sub: user.id, // Add subject identifier explicitly
      });
      
      // JWT signing is always async with jose library
      token = await tokenResult;
      
      if (!token) {
        throw new Error('Failed to generate authentication token');
      }
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return Response.json(
        {
          success: false,
          error: "Authentication error"
        },
        { status: 500 }
      );
    }

    const authResponse: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name || email.split('@')[0], // Use name if available, otherwise use email prefix
        email: user.email,
        role: user.role,
        hospital: {
          id: hospital.id,
          name: hospital.name,
          slug: hospital.subdomain, // Use subdomain as slug
        },
      },
    }

    // Set auth_token as an HTTP-only cookie
    const response = Response.json({
      success: true,
      data: authResponse,
      message: "Login successful",
    } as ApiResponse<AuthResponse>);
    
    // Add the auth_token cookie that will be sent with subsequent requests
    // Set secure to true in production
    const isProduction = process.env.NODE_ENV === 'production';
    response.headers.set('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? 'Secure;' : ''}; Max-Age=86400`);
    
    // Log that we're setting the cookie
    console.log('Setting auth_token cookie for successful login');
    
    return response
  } catch (error) {
    console.error("Login error:", error)
    
    // Ensure we always return a valid JSON response even on unexpected errors
    return Response.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      } as ApiResponse,
      { status: 500 },
    )
  }
}
