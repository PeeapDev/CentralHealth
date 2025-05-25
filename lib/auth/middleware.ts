import type { NextRequest } from "next/server"
import { verifyToken, extractTokenFromHeader, type JWTPayload } from "./jwt"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (req: AuthenticatedRequest): Promise<Response> => {
    try {
      const authHeader = req.headers.get("authorization")
      const token = extractTokenFromHeader(authHeader)

      if (!token) {
        return Response.json({ success: false, error: "Authorization token required" }, { status: 401 })
      }

      const payload = verifyToken(token)
      req.user = payload

      return handler(req)
    } catch (error) {
      return Response.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }
  }
}

export function withRole(roles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) =>
    withAuth(async (req: AuthenticatedRequest): Promise<Response> => {
      if (!req.user || !roles.includes(req.user.role)) {
        return Response.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
      }
      return handler(req)
    })
}
