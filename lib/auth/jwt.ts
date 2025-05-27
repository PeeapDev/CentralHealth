import * as jose from 'jose'

// Demo JWT secret - in production, use environment variable
const JWT_SECRET = new TextEncoder().encode("demo_jwt_secret_key_for_hospital_management_system_2024")
const JWT_EXPIRES_IN = "7d"

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const [type, token] = authHeader.split(' ')
  return type === 'Bearer' && token ? token : null
}

export interface JWTPayload {
  userId: string
  hospitalId: string
  role: string
  email: string
  iat?: number
  exp?: number
}

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jose.decodeJwt(token)
    return decoded as JWTPayload
  } catch (error) {
    return null
  }
}

// Demo tokens for testing
export const DEMO_TOKENS = {
  superadmin: signToken({
    userId: "superadmin_001",
    hospitalId: "system",
    role: "superadmin",
    email: "superadmin@system.com",
  }),

  // Smart Hospital Admin
  smartHospitalAdmin: signToken({
    userId: "admin_smart_001",
    hospitalId: "smart-hospital",
    role: "admin",
    email: "admin@smarthospital.com",
  }),

  // City Medical Center Admin
  cityMedicalAdmin: signToken({
    userId: "admin_city_001",
    hospitalId: "city-medical-center",
    role: "admin",
    email: "admin@citymedical.com",
  }),

  // Green Valley Hospital Admin
  greenValleyAdmin: signToken({
    userId: "admin_green_001",
    hospitalId: "green-valley-hospital",
    role: "admin",
    email: "admin@greenvalley.com",
  }),

  // Doctor tokens
  doctor1: signToken({
    userId: "doctor_001",
    hospitalId: "smart-hospital",
    role: "doctor",
    email: "dr.smith@smarthospital.com",
  }),

  doctor2: signToken({
    userId: "doctor_002",
    hospitalId: "city-medical-center",
    role: "doctor",
    email: "dr.johnson@citymedical.com",
  }),

  // Nurse tokens
  nurse1: signToken({
    userId: "nurse_001",
    hospitalId: "smart-hospital",
    role: "nurse",
    email: "nurse.mary@smarthospital.com",
  }),

  // Receptionist tokens
  receptionist1: signToken({
    userId: "receptionist_001",
    hospitalId: "smart-hospital",
    role: "receptionist",
    email: "reception@smarthospital.com",
  }),
}

// Helper function to get demo token by role and hospital
export function getDemoToken(role: string, hospitalSlug?: string): string {
  switch (role) {
    case "superadmin":
      return DEMO_TOKENS.superadmin
    case "admin":
      if (hospitalSlug === "smart-hospital") return DEMO_TOKENS.smartHospitalAdmin
      if (hospitalSlug === "city-medical-center") return DEMO_TOKENS.cityMedicalAdmin
      if (hospitalSlug === "green-valley-hospital") return DEMO_TOKENS.greenValleyAdmin
      return DEMO_TOKENS.smartHospitalAdmin
    case "doctor":
      return hospitalSlug === "city-medical-center" ? DEMO_TOKENS.doctor2 : DEMO_TOKENS.doctor1
    case "nurse":
      return DEMO_TOKENS.nurse1
    case "receptionist":
      return DEMO_TOKENS.receptionist1
    default:
      return DEMO_TOKENS.smartHospitalAdmin
  }
}
