import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth/middleware"
import { FHIRService } from "@/lib/integrations/fhir"

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    // Get FHIR config from hospital settings (demo config for now)
    const fhirConfig = {
      endpoint: "https://hapi.fhir.org/baseR4",
      clientId: "smart-hospital-client",
      clientSecret: "demo-fhir-secret-key-12345",
      version: "R4",
      enabled: true,
    }

    const fhirService = new FHIRService(fhirConfig)
    const patients = await fhirService.searchPatients(query)

    return NextResponse.json({
      success: true,
      data: {
        patients: patients.map((patient) => ({
          id: patient.id,
          identifier: patient.identifier?.[0]?.value,
          name: patient.name?.[0] ? `${patient.name[0].given?.join(" ")} ${patient.name[0].family}` : "Unknown",
          gender: patient.gender,
          birthDate: patient.birthDate,
          phone: patient.telecom?.find((t) => t.system === "phone")?.value,
          email: patient.telecom?.find((t) => t.system === "email")?.value,
          active: patient.active,
        })),
      },
    })
  } catch (error) {
    console.error("FHIR patients search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search FHIR patients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const patientData = await request.json()

    // Get FHIR config from hospital settings (demo config for now)
    const fhirConfig = {
      endpoint: "https://hapi.fhir.org/baseR4",
      clientId: "smart-hospital-client",
      clientSecret: "demo-fhir-secret-key-12345",
      version: "R4",
      enabled: true,
    }

    const fhirService = new FHIRService(fhirConfig)
    const fhirPatient = await fhirService.syncPatient(patientData)

    return NextResponse.json({
      success: true,
      data: {
        fhirId: fhirPatient.id,
        identifier: fhirPatient.identifier?.[0]?.value,
        message: "Patient synced to FHIR successfully",
      },
    })
  } catch (error) {
    console.error("FHIR patient sync error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync patient to FHIR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
