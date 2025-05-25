import type { NextRequest } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { storage } from "@/lib/database/storage"

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return Response.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    let bills = storage.getBills(authResult.user.hospitalId)

    // Filter by patient
    if (patientId) {
      bills = bills.filter((bill) => bill.patientId === patientId)
    }

    // Filter by status
    if (status) {
      bills = bills.filter((bill) => bill.status === status)
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedBills = bills.slice(startIndex, endIndex)

    return Response.json({
      success: true,
      data: {
        bills: paginatedBills,
        pagination: {
          page,
          limit,
          total: bills.length,
          pages: Math.ceil(bills.length / limit),
        },
      },
    })
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return Response.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const billData = {
      id: `INV${Date.now()}`,
      hospitalId: authResult.user.hospitalId,
      patientId: body.patientId,
      appointmentId: body.appointmentId,
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString(),
      dueDate: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: body.items || [],
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      status: "pending",
      paymentMethod: body.paymentMethod || "",
      paidAmount: 0,
      paidDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    storage.addBill(billData)

    return Response.json(
      {
        success: true,
        data: billData,
        message: "Bill created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
