import { verifyToken, signToken, decodeToken, JWTPayload } from '@/lib/auth/jwt';

/**
 * Verify a JWT token and return the payload
 * @param token The JWT token to verify
 * @returns The payload if token is valid
 */
export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    return await verifyToken(token);
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Sign a JWT token with the given payload
 * @param payload The data to include in the token
 * @returns The signed JWT token
 */
export async function signJwt(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return await signToken(payload);
}

/**
 * Decode a JWT token without verifying its signature
 * @param token The JWT token to decode
 * @returns The decoded token payload
 */
export function decodeJwt(token: string): JWTPayload | null {
  return decodeToken(token);
}
