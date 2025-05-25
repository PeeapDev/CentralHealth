import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { db } from "@/lib/database/storage"
import type { ApiResponse, Appointment } from "@/lib/database/models"

export const GET = withAuth(async (req: AuthenticatedRequest): Promise<Response> => {
  try {
    const { hospitalId } = req.user!
    const { searchParams } = new URL(req.url)

    const filters = {
      date: searchParams.get("date") || undefined,
      doctorId: searchParams.get("doctorId") || undefined,
      status: searchParams.get("status") || undefined,
    }

    const appointments = await db.getAppointments(hospitalId, filters)

    // Get patient and doctor details for each appointment
    const patients = await db.getPatients(hospitalId)
    const users = await db.getUsers(hospitalId)

    const enrichedAppointments = appointments.map((appointment) => {
      const patient = patients.patients.find((p) => p._id === appointment.patientId)
      const doctor = users.find((u) => u._id === appointment.doctorId)

      return {
        ...appointment,
        patient: patient
          ? {
              id: patient._id,
              name: `${patient.firstName} ${patient.lastName}`,
              patientId: patient.patientId,
            }
          : null,
        doctor: doctor
          ? {
              id: doctor._id,
              name: `${doctor.firstName} ${doctor.lastName}`,
              specialization: doctor.profile.specialization,
            }
          : null,
      }
    })

    return Response.json({
      success: true,
      data: { appointments: enrichedAppointments },
    } as ApiResponse)
  } catch (error) {
    console.error("Get appointments error:", error)
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

    const newAppointment: Omit<Appointment, "_id"> = {
      hospitalId,
      patientId: body.patientId,
      doctorId: body.doctorId,
      appointmentDate: new Date(body.appointmentDate),
      duration: body.duration || 30,
      type: body.type || "consultation",
      status: "scheduled",
      reason: body.reason,
      symptoms: body.symptoms || [],
      notes: body.notes,
      fees: {
        consultation: body.fees?.consultation || 0,
        additional: body.fees?.additional || 0,
        total: body.fees?.total || body.fees?.consultation || 0,
        paid: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    }

    const appointment = await db.createAppointment(newAppointment)

    return Response.json(
      {
        success: true,
        data: appointment,
        message: "Appointment created successfully",
      } as ApiResponse<Appointment>,
      { status: 201 },
    )
  } catch (error) {
    console.error("Create appointment error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
})
