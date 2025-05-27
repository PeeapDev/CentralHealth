import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"

export async function GET(request: NextRequest, { params }: { params: { hospitalName: string } }) {
  try {
    const { hospitalName } = params
    
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
    
    // Find the user by id
    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
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
        // Don't include password
      },
    })
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    
    // Ensure user belongs to the correct hospital
    if (!user.hospital || user.hospital.subdomain !== hospitalName) {
      return NextResponse.json({ message: "Unauthorized access to this hospital" }, { status: 403 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
