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
    const recordType = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    let records = storage.getMedicalRecords(authResult.user.hospitalId)

    // Filter by patient
    if (patientId) {
      records = records.filter((record) => record.patientId === patientId)
    }

    // Filter by type
    if (recordType) {
      records = records.filter((record) => record.recordType === recordType)
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedRecords = records.slice(startIndex, endIndex)

    return Response.json({
      success: true,
      data: {
        records: paginatedRecords,
        pagination: {
          page,
          limit,
          total: records.length,
          pages: Math.ceil(records.length / limit),
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
    const recordData = {
      id: `MR${Date.now()}`,
      hospitalId: authResult.user.hospitalId,
      patientId: body.patientId,
      appointmentId: body.appointmentId,
      doctorId: authResult.user.id,
      recordType: body.recordType,
      date: new Date().toISOString(),
      vitals: body.vitals || {},
      diagnosis: body.diagnosis || [],
      prescription: body.prescription || [],
      labResults: body.labResults || [],
      attachments: body.attachments || [],
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    storage.addMedicalRecord(recordData)

    return Response.json(
      {
        success: true,
        data: recordData,
        message: "Medical record created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
