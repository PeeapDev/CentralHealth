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
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const inStock = searchParams.get("inStock")

    let medications = storage.getMedications(authResult.user.hospitalId)

    // Search filter
    if (search) {
      medications = medications.filter(
        (med) =>
          med.name.toLowerCase().includes(search.toLowerCase()) ||
          med.genericName.toLowerCase().includes(search.toLowerCase()),
      )
    }

    // Category filter
    if (category) {
      medications = medications.filter((med) => med.category === category)
    }

    // Stock filter
    if (inStock === "true") {
      medications = medications.filter((med) => med.stock > 0)
    }

    return Response.json({
      success: true,
      data: {
        medications,
        categories: ["Antibiotics", "Pain Relief", "Vitamins", "Cardiac", "Diabetes"],
        totalMedications: medications.length,
        lowStockCount: medications.filter((med) => med.stock < med.minStock).length,
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
    const medicationData = {
      id: `MED${Date.now()}`,
      hospitalId: authResult.user.hospitalId,
      name: body.name,
      genericName: body.genericName,
      category: body.category,
      manufacturer: body.manufacturer,
      batchNumber: body.batchNumber,
      expiryDate: body.expiryDate,
      stock: body.stock || 0,
      minStock: body.minStock || 10,
      price: body.price || 0,
      unit: body.unit || "tablet",
      description: body.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    storage.addMedication(medicationData)

    return Response.json(
      {
        success: true,
        data: medicationData,
        message: "Medication added successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
