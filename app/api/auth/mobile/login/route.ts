import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

/**
 * Mobile-optimized login endpoint
 * Used by the Flutter mobile app to authenticate users
 * Returns token as part of the response body, not as an HTTP-only cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, hospitalId } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }
    
    console.log(`Mobile login attempt for ${email}${hospitalId ? ` at hospital ${hospitalId}` : ''}`);
    
    // Find the user in the database
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        ...(hospitalId ? { hospitalId } : {})
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });
    
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Generate JWT token with user information
    const token = await signToken({
      userId: user.id,
      hospitalId: user.hospitalId,
      role: user.role,
      email: user.email
    });
    
    console.log(`Mobile login successful for user: ${user.email}, role: ${user.role}`);
    
    // Return JSON response with token in the body for mobile clients
    return NextResponse.json({
      success: true,
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role,
      access_token: token,
      refresh_token: token, // In a real app, you'd generate a separate refresh token
      hospital: user.hospital ? {
        id: user.hospital.id,
        name: user.hospital.name,
        subdomain: user.hospital.subdomain
      } : null
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
