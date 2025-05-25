import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { db } from "@/lib/database/storage"
import type { ApiResponse, Patient } from "@/lib/database/models"

export const GET = withAuth(async (req: AuthenticatedRequest): Promise<Response> => {
  try {
    const { hospitalId } = req.user!
    const { searchParams } = new URL(req.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined

    const { patients, total } = await db.getPatients(hospitalId, page, limit, search)

    return Response.json({
      success: true,
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    } as ApiResponse)
  } catch (error) {
    console.error("Get patients error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
})

export const POST = withAuth(async (req: AuthenticatedRequest): Promise<Response> => {
  try {
    const { hospitalId, userId } = req.user!
    const body = await req.json()

    // Generate patient ID
    const { patients } = await db.getPatients(hospitalId)
    const patientId = `P${String(patients.length + 1).padStart(4, "0")}`

    const newPatient: Omit<Patient, "_id"> = {
      hospitalId,
      patientId,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      contact: body.contact,
      medical: body.medical || {
        allergies: [],
        chronicConditions: [],
        medications: [],
      },
      isActive: true,
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    }

    const patient = await db.createPatient(newPatient)

    return Response.json(
      {
        success: true,
        data: patient,
        message: "Patient created successfully",
      } as ApiResponse<Patient>,
      { status: 201 },
    )
  } catch (error) {
    console.error("Create patient error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
})
