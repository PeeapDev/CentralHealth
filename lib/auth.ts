import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  hospitalId?: string;
  isHospitalAdmin?: boolean;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Gets authentication info from request (via cookies or auth header)
 */
export async function getAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Try to get token from cookies first
    let token = request.cookies.get('authToken')?.value;
    
    // If no cookie, try auth header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      token = extractTokenFromHeader(authHeader);
    }
    
    // If still no token, user is not authenticated
    if (token === null || token === undefined) {
      return { authenticated: false, error: 'No authentication token found' };
    }
    
    // Verify the token
    const payload = await verifyToken(token);
    
    // Create a user object from the verified payload
    const user: AuthUser = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      hospitalId: payload.hospitalId,
      isHospitalAdmin: payload.isHospitalAdmin || false,
    };
    
    return { authenticated: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Invalid or expired authentication token' };
  }
}
