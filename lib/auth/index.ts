/**
 * Authentication utility that works in both online and offline modes
 */

import { NextRequest, NextResponse } from 'next/server'
import { isOnline } from '../database/network-status'
import { verifyOfflineToken } from './offline-auth'

// Interface for authenticated user data
export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  hospitalId?: string
}

/**
 * Verify authentication from request cookies or headers
 * This function handles both online and offline authentication
 */
export async function verifyAuth(request: NextRequest): Promise<{
  success: boolean
  user?: AuthUser
  message?: string
}> {
  try {
    // Check if we're online or offline
    const online = await isOnline()

    // Get the token from cookies or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
      request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return { success: false, message: 'No authentication token found' }
    }

    if (online) {
      // Online authentication using server API
      try {
        // Here we would normally validate the token with the server
        // For now we'll assume a mock implementation
        const user = {
          id: 'online-user-id',
          email: 'user@example.com',
          role: 'admin',
        }
        
        return { success: true, user }
      } catch (error) {
        return { success: false, message: 'Invalid or expired token' }
      }
    } else {
      // Offline authentication
      const user = await verifyOfflineToken(token)
      
      if (user) {
        return { success: true, user }
      } else {
        return { success: false, message: 'Invalid or expired offline token' }
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, message: 'Authentication failed' }
  }
}

/**
 * Helper to check if user has required role
 */
export function checkRole(user: AuthUser, allowedRoles: string | string[]): boolean {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  return roles.includes(user.role)
}
