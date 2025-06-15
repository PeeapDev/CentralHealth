import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    let isAuthorized = false;
    
    // In development, proceed even without token (for demo/testing)
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing token verification');
      isAuthorized = true;
    } else if (token) {
      // Verify the token to ensure superadmin access only
      try {
        const payload = await verifyToken(token);
        if (payload.role === 'superadmin') {
          isAuthorized = true;
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get total number of patients
    const totalPatients = await prisma.patient.count();
    
    // Get gender distribution
    const malePatients = await prisma.patient.count({
      where: {
        gender: {
          equals: 'male',
          mode: 'insensitive', // Case insensitive
        },
      },
    });
    
    const femalePatients = await prisma.patient.count({
      where: {
        gender: {
          equals: 'female',
          mode: 'insensitive', // Case insensitive
        },
      },
    });
    
    // Other genders (not male or female)
    const otherPatients = totalPatients - malePatients - femalePatients;
    
    // Prepare summary statistics 
    const stats = {
      total: totalPatients,
      male: malePatients,
      female: femalePatients,
      other: otherPatients,
      // Add additional statistics as needed
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error retrieving patient statistics:', error);
    return NextResponse.json({ error: 'Failed to retrieve patient statistics' }, { status: 500 });
  }
}
