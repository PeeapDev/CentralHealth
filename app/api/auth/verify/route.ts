import { NextRequest, NextResponse } from 'next/server';

// Mock user data for development
const MOCK_USERS = {
  'superadmin@medicore.com': {
    role: 'superadmin',
    token: 'mock-superadmin-token'
  },
  'admin@smarthospital.com': {
    role: 'admin',
    token: 'mock-admin-token'
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Find user by token
    const user = Object.values(MOCK_USERS).find(u => u.token === token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json({ role: user.role })
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
