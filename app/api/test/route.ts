import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Demo tokens (hardcoded for now to avoid import issues)
    const DEMO_TOKENS = {
      superadmin:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzE2NTg0NDAwLCJleHAiOjE3MTcxODkyMDAsInJvbGUiOiJzdXBlcmFkbWluIiwiaG9zcGl0YWxJZCI6bnVsbH0.demo_token_superadmin",
      smartHospitalAdmin:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcxNjU4NDQwMCwiZXhwIjoxNzE3MTg5MjAwLCJyb2xlIjoiYWRtaW4iLCJob3NwaXRhbElkIjoic21hcnQtaG9zcGl0YWwifQ.demo_token_smart_hospital_admin",
      cityMedicalAdmin:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcxNjU4NDQwMCwiZXhwIjoxNzE3MTg5MjAwLCJyb2xlIjoiYWRtaW4iLCJob3NwaXRhbElkIjoiY2l0eS1tZWRpY2FsLWNlbnRlciJ9.demo_token_city_medical_admin",
      greenValleyAdmin:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcxNjU4NDQwMCwiZXhwIjoxNzE3MTg5MjAwLCJyb2xlIjoiYWRtaW4iLCJob3NwaXRhbElkIjoiZ3JlZW4tdmFsbGV5LWhvc3BpdGFsIn0.demo_token_green_valley_admin",
      doctor1:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3IxIiwiaWF0IjoxNzE2NTg0NDAwLCJleHAiOjE3MTcxODkyMDAsInJvbGUiOiJkb2N0b3IiLCJob3NwaXRhbElkIjoic21hcnQtaG9zcGl0YWwifQ.demo_token_doctor1",
      doctor2:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3IyIiwiaWF0IjoxNzE2NTg0NDAwLCJleHAiOjE3MTcxODkyMDAsInJvbGUiOiJkb2N0b3IiLCJob3NwaXRhbElkIjoiY2l0eS1tZWRpY2FsLWNlbnRlciJ9.demo_token_doctor2",
      nurse1:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJudXJzZTEiLCJpYXQiOjE3MTY1ODQ0MDAsImV4cCI6MTcxNzE4OTIwMCwicm9sZSI6Im51cnNlIiwiaG9zcGl0YWxJZCI6InNtYXJ0LWhvc3BpdGFsIn0.demo_token_nurse1",
      receptionist1:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyZWNlcHRpb25pc3QxIiwiaWF0IjoxNzE2NTg0NDAwLCJleHAiOjE3MTcxODkyMDAsInJvbGUiOiJyZWNlcHRpb25pc3QiLCJob3NwaXRhbElkIjoic21hcnQtaG9zcGl0YWwifQ.demo_token_receptionist1",
    }

    const apiEndpoints = {
      authentication: {
        login: "POST /api/v1/auth/login",
        me: "GET /api/v1/auth/me",
        logout: "POST /api/v1/auth/logout",
      },
      patients: {
        list: "GET /api/v1/patients",
        create: "POST /api/v1/patients",
        get: "GET /api/v1/patients/:id",
        update: "PUT /api/v1/patients/:id",
        delete: "DELETE /api/v1/patients/:id",
      },
      appointments: {
        list: "GET /api/v1/appointments",
        create: "POST /api/v1/appointments",
        get: "GET /api/v1/appointments/:id",
        update: "PUT /api/v1/appointments/:id",
        cancel: "DELETE /api/v1/appointments/:id",
      },
      medicalRecords: {
        list: "GET /api/v1/medical-records",
        create: "POST /api/v1/medical-records",
        get: "GET /api/v1/medical-records/:id",
      },
      billing: {
        list: "GET /api/v1/billing",
        create: "POST /api/v1/billing",
        get: "GET /api/v1/billing/:id",
      },
      pharmacy: {
        list: "GET /api/v1/pharmacy",
        create: "POST /api/v1/pharmacy",
        get: "GET /api/v1/pharmacy/:id",
      },
      dashboard: {
        stats: "GET /api/v1/dashboard/stats",
      },
      hospitals: {
        list: "GET /api/v1/hospitals (Super Admin only)",
        create: "POST /api/v1/hospitals (Super Admin only)",
        get: "GET /api/v1/hospitals/:id",
        update: "PUT /api/v1/hospitals/:id",
        delete: "DELETE /api/v1/hospitals/:id",
      },
    }

    const demoCredentials = {
      superAdmin: {
        email: "superadmin@system.com",
        password: "admin123",
        token: DEMO_TOKENS.superadmin,
      },
      hospitals: {
        "smart-hospital": {
          admin: {
            email: "admin@smarthospital.com",
            password: "admin123",
            token: DEMO_TOKENS.smartHospitalAdmin,
          },
          doctor: {
            email: "dr.smith@smarthospital.com",
            password: "admin123",
            token: DEMO_TOKENS.doctor1,
          },
          nurse: {
            email: "nurse.mary@smarthospital.com",
            password: "admin123",
            token: DEMO_TOKENS.nurse1,
          },
          receptionist: {
            email: "reception@smarthospital.com",
            password: "admin123",
            token: DEMO_TOKENS.receptionist1,
          },
        },
        "city-medical-center": {
          admin: {
            email: "admin@citymedical.com",
            password: "admin123",
            token: DEMO_TOKENS.cityMedicalAdmin,
          },
          doctor: {
            email: "dr.johnson@citymedical.com",
            password: "admin123",
            token: DEMO_TOKENS.doctor2,
          },
        },
        "green-valley-hospital": {
          admin: {
            email: "admin@greenvalley.com",
            password: "admin123",
            token: DEMO_TOKENS.greenValleyAdmin,
          },
        },
      },
    }

    const usage = {
      "1. Authentication": {
        description: "Login with hospital credentials",
        example: {
          url: "/api/v1/auth/login",
          method: "POST",
          body: {
            hospitalSlug: "smart-hospital",
            email: "admin@smarthospital.com",
            password: "admin123",
          },
        },
      },
      "2. Using Tokens": {
        description: "Include JWT token in Authorization header",
        example: {
          headers: {
            Authorization: "Bearer YOUR_JWT_TOKEN",
          },
        },
      },
      "3. Demo Tokens": {
        description: "Pre-generated tokens for testing",
        note: "You can use these tokens directly without login",
      },
    }

    return Response.json({
      message: "Hospital Management System API v1.0",
      status: "Active",
      timestamp: new Date().toISOString(),
      endpoints: apiEndpoints,
      demoCredentials,
      usage,
      demoTokens: {
        note: "Use these tokens directly in Authorization header",
        tokens: DEMO_TOKENS,
      },
    })
  } catch (error) {
    console.error("API test error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
