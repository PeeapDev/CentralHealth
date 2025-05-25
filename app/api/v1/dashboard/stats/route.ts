import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { db } from "@/lib/database/storage"
import type { ApiResponse } from "@/lib/database/models"

export const GET = withAuth(async (req: AuthenticatedRequest): Promise<Response> => {
  try {
    const { hospitalId } = req.user!

    const stats = await db.getDashboardStats(hospitalId)

    // Additional calculations for dashboard
    const appointments = await db.getAppointments(hospitalId)
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const monthlyAppointments = appointments.filter((a) => new Date(a.appointmentDate) >= thisMonth)

    const completedAppointments = appointments.filter((a) => a.status === "completed")
    const pendingAppointments = appointments.filter((a) => a.status === "scheduled")

    // Mock revenue data (in real app, calculate from billing)
    const revenue = {
      today: completedAppointments
        .filter((a) => new Date(a.appointmentDate).toDateString() === today.toDateString())
        .reduce((sum, a) => sum + a.fees.total, 0),
      month: monthlyAppointments.reduce((sum, a) => sum + a.fees.total, 0),
      total: completedAppointments.reduce((sum, a) => sum + a.fees.total, 0),
    }

    const dashboardData = {
      overview: {
        ...stats,
        pendingAppointments: pendingAppointments.length,
        completedAppointments: completedAppointments.length,
        revenue,
      },
      charts: {
        appointmentTrends: generateAppointmentTrends(appointments),
        revenueByMonth: generateRevenueByMonth(appointments),
        patientsByAge: generatePatientsByAge(await db.getPatients(hospitalId)),
      },
    }

    return Response.json({
      success: true,
      data: dashboardData,
    } as ApiResponse)
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    )
  }
})

function generateAppointmentTrends(appointments: any[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toDateString()
  }).reverse()

  return last7Days.map((date) => ({
    date,
    count: appointments.filter((a) => new Date(a.appointmentDate).toDateString() === date).length,
  }))
}

function generateRevenueByMonth(appointments: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
  return months.map((month) => ({
    month,
    revenue: Math.floor(Math.random() * 50000) + 10000, // Mock data
  }))
}

function generatePatientsByAge(patientsData: any) {
  const ageGroups = ["0-18", "19-35", "36-50", "51-65", "65+"]
  return ageGroups.map((group) => ({
    ageGroup: group,
    count: Math.floor(Math.random() * 100) + 10, // Mock data
  }))
}
