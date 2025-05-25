import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { db } from "@/lib/database/storage"
import type { ApiResponse } from "@/lib/database/models"

export const GET = withAuth(async (req: AuthenticatedRequest): Promise<Response> => {
  try {
    const { userId, hospitalId } = req.user!

    // Get user details
    const users = await db.getUsers(hospitalId)
    const user = users.find((u) => u._id === userId)

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "User not found",
        } as ApiResponse,
        { status: 404 },
      )
    }

    // Get hospital details
    const hospitals = await db.getHospitals()
    const hospital = hospitals.find((h) => h._id === hospitalId)

    return Response.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          profile: user.profile,
          hospital: hospital
            ? {
                id: hospital._id,
                name: hospital.name,
                slug: hospital.slug,
              }
            : null,
        },
      },
    } as ApiResponse)
  } catch (error) {
    console.error("Get user error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
})
