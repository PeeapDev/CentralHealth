import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: { hospitalName: string } }) {
  try {
    const { hospitalName } = params
    const { currentPassword, newPassword } = await request.json()
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      )
    }
    
    // Get the token from cookies
    const token = request.cookies.get("hospitalToken")?.value
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Verify token
    const payload = await verifyJwt(token)
    if (!payload || !payload.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }
    
    // Find the user by id (include password for verification)
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
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      )
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update user's password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    })
    
    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error updating password:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
