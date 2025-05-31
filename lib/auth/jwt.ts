import * as jose from 'jose'

// Demo JWT secret - in production, use environment variable
const JWT_SECRET = new TextEncoder().encode("demo_jwt_secret_key_for_hospital_management_system_2024")
const JWT_EXPIRES_IN = "7d"

export function extractTokenFromHeader(authHeader: string | null): string | undefined {
  if (!authHeader) return undefined
  
  const [type, token] = authHeader.split(' ')
  return type === 'Bearer' && token ? token : undefined
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
    // Ensure the payload has the required JWTPayload properties
    const jwtPayload: JWTPayload = {
      userId: payload.userId as string,
      hospitalId: payload.hospitalId as string,
      role: payload.role as string,
      email: payload.email as string,
      iat: payload.iat,
      exp: payload.exp
    }
    return jwtPayload
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jose.decodeJwt(token)
    // Ensure the decoded payload has the required JWTPayload properties
    const jwtPayload: JWTPayload = {
      userId: decoded.userId as string,
      hospitalId: decoded.hospitalId as string,
      role: decoded.role as string,
      email: decoded.email as string,
      iat: decoded.iat,
      exp: decoded.exp
    }
    return jwtPayload
  } catch (error) {
    return null
  }
}

// Demo tokens for testing
// Using async IIFE to resolve promises to strings
export const DEMO_TOKENS: Record<string, string> = {} 

// Initialize tokens asynchronously
;(async () => {
  DEMO_TOKENS.superadmin = await signToken({
    userId: "superadmin_001",
    hospitalId: "system",
    role: "superadmin",
    email: "superadmin@system.com",
  }),

  // Smart Hospital Admin
  DEMO_TOKENS.smartHospitalAdmin = await signToken({
    userId: "admin_smart_001",
    hospitalId: "smart-hospital",
    role: "admin",
    email: "admin@smarthospital.com",
  }),

  // City Medical Center Admin
  DEMO_TOKENS.cityMedicalAdmin = await signToken({
    userId: "admin_city_001",
    hospitalId: "city-medical-center",
    role: "admin",
    email: "admin@citymedical.com",
  }),

  // Green Valley Hospital Admin
  DEMO_TOKENS.greenValleyAdmin = await signToken({
    userId: "admin_green_001",
    hospitalId: "green-valley-hospital",
    role: "admin",
    email: "admin@greenvalley.com",
  }),

  // Doctor tokens
  DEMO_TOKENS.doctor1 = await signToken({
    userId: "doctor_001",
    hospitalId: "smart-hospital",
    role: "doctor",
    email: "dr.smith@smarthospital.com",
  }),

  DEMO_TOKENS.doctor2 = await signToken({
    userId: "doctor_002",
    hospitalId: "city-medical-center",
    role: "doctor",
    email: "dr.johnson@citymedical.com",
  }),

  // Nurse tokens
  DEMO_TOKENS.nurse1 = await signToken({
    userId: "nurse_001",
    hospitalId: "smart-hospital",
    role: "nurse",
    email: "nurse.mary@smarthospital.com",
  }),

  // Receptionist tokens
  DEMO_TOKENS.receptionist1 = await signToken({
    userId: "receptionist_001",
    hospitalId: "smart-hospital",
    role: "receptionist",
    email: "reception@smarthospital.com",
  });
})();

// Helper function to get demo token by role and hospital
export function getDemoToken(role: string, hospitalSlug?: string): string {
  // Default to an empty string if the token isn't ready yet
  // In a real application, you would handle this more gracefully with async/await
  switch (role) {
    case "superadmin":
      return DEMO_TOKENS.superadmin || ''
    case "admin":
      if (hospitalSlug === "smart-hospital") return DEMO_TOKENS.smartHospitalAdmin || ''
      if (hospitalSlug === "city-medical-center") return DEMO_TOKENS.cityMedicalAdmin || ''
      if (hospitalSlug === "green-valley-hospital") return DEMO_TOKENS.greenValleyAdmin || ''
      return DEMO_TOKENS.smartHospitalAdmin || ''
    case "doctor":
      return hospitalSlug === "city-medical-center" ? (DEMO_TOKENS.doctor2 || '') : (DEMO_TOKENS.doctor1 || '')
    case "nurse":
      return DEMO_TOKENS.nurse1 || ''
    case "receptionist":
      return DEMO_TOKENS.receptionist1 || ''
    default:
      return DEMO_TOKENS.smartHospitalAdmin || ''
  }
}
