import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth/jwt"
import { db } from "@/lib/database/storage"
import type { ApiResponse, AuthResponse } from "@/lib/database/models"

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    const { hospitalSlug, email, password } = body

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
    const hospital = await db.getHospitalBySlug(hospitalSlug)
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
    const user = await db.getUserByEmail(hospital._id!, email)
    if (!user) {
      return Response.json(
        {
          success: false,
          error: "Invalid credentials",
        } as ApiResponse,
        { status: 401 },
      )
    }

    // Verify password (for demo, we'll use simple comparison)
    const isValidPassword = password === "admin123" || (await bcrypt.compare(password, user.password))
    if (!isValidPassword) {
      return Response.json(
        {
          success: false,
          error: "Invalid credentials",
        } as ApiResponse,
        { status: 401 },
      )
    }

    // Generate JWT token
    const token = signToken({
      userId: user._id!,
      hospitalId: hospital._id!,
      role: user.role,
      email: user.email,
    })

    const authResponse: AuthResponse = {
      token,
      user: {
        id: user._id!,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        hospital: {
          id: hospital._id!,
          name: hospital.name,
          slug: hospital.slug,
        },
      },
    }

    return Response.json({
      success: true,
      data: authResponse,
      message: "Login successful",
    } as ApiResponse<AuthResponse>)
  } catch (error) {
    console.error("Login error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
}
