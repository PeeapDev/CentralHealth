import { withRole, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { db } from "@/lib/database/storage"
import type { ApiResponse, Hospital } from "@/lib/database/models"
import bcrypt from "bcryptjs"

// Only super admins can access hospitals endpoint
export const GET = withRole(["superadmin"])(async (req: AuthenticatedRequest): Promise<Response> => {
  try {
    const hospitals = await db.getHospitals()

    return Response.json({
      success: true,
      data: { hospitals },
    } as ApiResponse)
  } catch (error) {
    console.error("Get hospitals error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
})

export const POST = withRole(["superadmin"])(async (req: AuthenticatedRequest): Promise<Response> => {
  try {
    const body = await req.json()

    // Create hospital
    const newHospital: Omit<Hospital, "_id"> = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      logo: body.logo || "/placeholder.svg?height=40&width=40",
      contact: body.contact,
      subscription: {
        package: body.subscription?.package || "basic",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        maxUsers: body.subscription?.maxUsers || 10,
        maxPatients: body.subscription?.maxPatients || 1000,
        features: body.subscription?.features || ["billing", "appointment"],
      },
      settings: {
        timezone: "UTC",
        currency: "USD",
        language: "en",
        branches: body.settings?.branches || [],
        modules: body.settings?.modules || [],
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const hospital = await db.createHospital(newHospital)

    // Create admin user for the hospital
    if (body.adminUser) {
      const hashedPassword = await bcrypt.hash(body.adminUser.password, 10)

      await db.createUser({
        hospitalId: hospital._id!,
        firstName: body.adminUser.firstName,
        lastName: body.adminUser.lastName,
        email: body.adminUser.email,
        password: hashedPassword,
        role: "admin",
        permissions: ["all"],
        profile: {
          employeeId: "ADMIN001",
          department: "Administration",
        },
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return Response.json(
      {
        success: true,
        data: hospital,
        message: "Hospital created successfully",
      } as ApiResponse<Hospital>,
      { status: 201 },
    )
  } catch (error) {
    console.error("Create hospital error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
})
