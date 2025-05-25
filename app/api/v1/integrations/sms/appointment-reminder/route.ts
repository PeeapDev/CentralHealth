import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth/middleware"
import { RapidProService } from "@/lib/integrations/rapidpro"

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { appointmentId, patientPhone, appointmentDetails } = await request.json()

    if (!appointmentId || !patientPhone || !appointmentDetails) {
      return NextResponse.json(
        { success: false, error: "Appointment ID, patient phone, and appointment details are required" },
        { status: 400 },
      )
    }

    // Get RapidPro config from hospital settings (demo config for now)
    const rapidProConfig = {
      apiUrl: "https://rapidpro.io/api/v2",
      apiToken: "demo-rapidpro-token-abcdef123456789",
      enabled: true,
    }

    const rapidProService = new RapidProService(rapidProConfig)

    // For demo purposes, we'll simulate sending appointment reminder
    const result = {
      id: `reminder_${Date.now()}`,
      appointmentId,
      patientPhone,
      status: "sent",
      sentAt: new Date().toISOString(),
      type: "appointment_reminder",
    }

    // In production, uncomment this line:
    // const result = await rapidProService.sendAppointmentReminder(patientPhone, appointmentDetails);

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.id,
        appointmentId: result.appointmentId,
        status: result.status,
        sentAt: result.sentAt,
        message: "Appointment reminder sent successfully",
      },
    })
  } catch (error) {
    console.error("Appointment reminder error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send appointment reminder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
