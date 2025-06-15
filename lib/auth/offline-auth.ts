/**
 * Offline authentication system for the hospital management system
 * Handles secure local authentication when the server is not available
 */

import { PrismaClient } from '@/lib/generated/prisma'
import { prisma } from '../database/prisma-client'
import { isOnline } from '../database/network-status'
import { compare, hash } from 'bcryptjs'
import crypto from 'crypto'

// Constants
const TOKEN_EXPIRY_DAYS = parseInt(process.env.MAX_OFFLINE_SESSION_DAYS || '10', 10)
const SESSION_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_dev_key_replace_in_production'

// Interface for authenticated user data
interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  hospitalId?: string
  offlineAccess: boolean
  offlineExpiry?: Date
}

/**
 * Attempt to authenticate a user offline 
 * @param email User email
 * @param password User password
 * @returns Authentication result with user data and token if successful
 */
export async function authenticateOffline(email: string, password: string): Promise<{ 
  success: boolean,
  user?: AuthUser,
  token?: string, 
  message?: string 
}> {
  try {
    // First try online authentication if available
    const online = await isOnline()
    if (online) {
      // Delegate to online authentication
      console.log('Online authentication available, using server-side auth')
      return { success: false, message: 'Online authentication required' }
    }
    
    // When offline, check the local database
    console.log('Attempting offline authentication')
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    // Check if user exists and has offline access
    if (!user) {
      return { success: false, message: 'Invalid credentials' }
    }
    
    // Verify password using bcrypt
    const passwordValid = await compare(password, user.password)
    if (!passwordValid) {
      return { success: false, message: 'Invalid credentials' }
    }
    
    // Check if offline access is enabled for this user
    if (!user.offlineAccess) {
      return { success: false, message: 'Offline access not enabled for this user' }
    }
    
    // Check if offline access has expired
    if (user.offlineExpiry && new Date(user.offlineExpiry) < new Date()) {
      return { 
        success: false, 
        message: 'Offline access has expired. Please connect to the internet to re-authenticate.' 
      }
    }
    
    // Generate a session token
    const token = generateOfflineToken()
    const hashedToken = hashToken(token)
    
    // Save the offline session
    await prisma.offlineSession.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      }
    })
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })
    
    // Return authenticated user
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
        hospitalId: user.hospitalId || undefined,
        offlineAccess: user.offlineAccess,
        offlineExpiry: user.offlineExpiry || undefined
      },
      token
    }
  } catch (error) {
    console.error('Offline authentication error:', error)
    return { success: false, message: 'Authentication failed' }
  }
}

/**
 * Verify an offline session token 
 * @param token The session token to verify
 * @returns User data if valid, null if invalid
 */
export async function verifyOfflineToken(token: string): Promise<AuthUser | null> {
  try {
    const hashedToken = hashToken(token)
    
    // Find the session
    const session = await prisma.offlineSession.findUnique({
      where: { token: hashedToken }
    })
    
    // Check if session exists and is valid
    if (!session || session.expiresAt < new Date() || session.isRevoked) {
      return null
    }
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })
    
    if (!user || !user.offlineAccess) {
      return null
    }
    
    // Update last active time
    await prisma.offlineSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    })
    
    // Return user data
    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      hospitalId: user.hospitalId || undefined,
      offlineAccess: user.offlineAccess,
      offlineExpiry: user.offlineExpiry || undefined
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

/**
 * End an offline session (logout)
 * @param token Session token to invalidate
 */
export async function revokeOfflineSession(token: string): Promise<boolean> {
  try {
    const hashedToken = hashToken(token)
    
    // Find and revoke the session
    await prisma.offlineSession.updateMany({
      where: { token: hashedToken },
      data: { isRevoked: true }
    })
    
    return true
  } catch (error) {
    console.error('Error revoking session:', error)
    return false
  }
}

/**
 * Generate secure random token for offline sessions
 */
function generateOfflineToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return crypto
    .createHmac('sha256', SESSION_ENCRYPTION_KEY)
    .update(token)
    .digest('hex')
}

/**
 * Clean up expired offline sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.offlineSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true }
        ]
      }
    })
    
    return result.count
  } catch (error) {
    console.error('Error cleaning up sessions:', error)
    return 0
  }
}
