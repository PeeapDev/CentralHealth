import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth/middleware"
import { RapidProService } from "@/lib/integrations/rapidpro"

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { to, text, type = "general" } = await request.json()

    if (!to || !text) {
      return NextResponse.json({ success: false, error: "Phone number and message text are required" }, { status: 400 })
    }

    // Get RapidPro config from hospital settings (demo config for now)
    const rapidProConfig = {
      apiUrl: "https://rapidpro.io/api/v2",
      apiToken: "demo-rapidpro-token-abcdef123456789",
      enabled: true,
    }

    const rapidProService = new RapidProService(rapidProConfig)

    // For demo purposes, we'll simulate sending SMS
    const result = {
      id: `msg_${Date.now()}`,
      to,
      text,
      status: "sent",
      sentAt: new Date().toISOString(),
      type,
    }

    // In production, uncomment this line:
    // const result = await rapidProService.sendSMS({ to, text });

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.id,
        status: result.status,
        sentAt: result.sentAt,
        message: "SMS sent successfully",
      },
    })
  } catch (error) {
    console.error("SMS send error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
