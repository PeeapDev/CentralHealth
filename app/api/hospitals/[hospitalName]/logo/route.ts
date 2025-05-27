import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { hospitalName: string } }) {
  try {
    const { hospitalName } = params
    
    // Get the token from cookies
    const token = request.cookies.get("hospitalToken")?.value
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Get the request body (FormData)
    const formData = await request.formData()
    const logo = formData.get("logo") as string
    
    if (!logo) {
      return NextResponse.json({ message: "No logo provided" }, { status: 400 })
    }
    
    // Find the hospital by subdomain
    const hospital = await prisma.hospital.findUnique({
      where: {
        subdomain: hospitalName,
      }
    })
    
    if (!hospital) {
      return NextResponse.json({ message: "Hospital not found" }, { status: 404 })
    }
    
    // Update the hospital's branding with the new logo
    // Get current branding or initialize as empty object
    const currentBranding = hospital.branding as any || {}
    
    // Update the hospital
    const updatedHospital = await prisma.hospital.update({
      where: {
        id: hospital.id,
      },
      data: {
        branding: {
          ...currentBranding,
          logo: logo
        }
      }
    })
    
    return NextResponse.json({
      message: "Hospital logo updated successfully",
      logo: logo
    })
  } catch (error) {
    console.error("Error updating hospital logo:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { hospitalName: string } }) {
  return await POST(request, { params })
}
