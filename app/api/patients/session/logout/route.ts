import { NextRequest, NextResponse } from "next/server";
import { clearPatientSession } from "@/lib/patient-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Clear patient session
    await clearPatientSession();
    
    return NextResponse.json({
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Patient logout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log out" },
      { status: 500 }
    );
  }
}
