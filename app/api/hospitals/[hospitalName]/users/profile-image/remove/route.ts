import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"
import { JWTPayload } from "@/lib/auth/jwt"

// Extend JWTPayload type to include id property
interface AuthPayload extends JWTPayload {
  id?: string;
}

export async function POST(request: NextRequest, { params }: { params: { hospitalName: string } }) {
  try {
    const { hospitalName } = params
    
    // Get the token from cookies
    const token = request.cookies.get("hospitalToken")?.value
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Verify token
    const payload = await verifyJwt(token) as AuthPayload
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }
    
    // Find the user by id
    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      include: {
        hospital: {
          select: {
            subdomain: true
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    
    // Ensure user belongs to the correct hospital
    if (!user.hospital || user.hospital.subdomain !== hospitalName) {
      return NextResponse.json(
        { message: "Unauthorized access to this hospital" },
        { status: 403 }
      )
    }
    
    // Update the user's profile image using raw SQL since schema may not be synced yet
    await prisma.$queryRaw`
      UPDATE "User" 
      SET "profileImage" = NULL 
      WHERE id = ${user.id}
    `
    
    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    })
    
    return NextResponse.json({
      message: "Profile image removed successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error removing profile image:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
