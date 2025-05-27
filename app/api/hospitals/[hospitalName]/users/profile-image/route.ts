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
    
    // Get the request body (FormData)
    const formData = await request.formData()
    const imageBase64 = formData.get("image") as string
    
    if (!imageBase64) {
      return NextResponse.json({ message: "No image provided" }, { status: 400 })
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
    const updatedUser = await prisma.$queryRaw`
      UPDATE "User" 
      SET "profileImage" = ${imageBase64} 
      WHERE id = ${user.id} 
      RETURNING id, email, name, role, "hospitalId"
    `.then(async () => {
      // Now fetch the complete user data
      return prisma.user.findUnique({
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
    })
    
    return NextResponse.json({
      message: "Profile image updated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error updating profile image:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
