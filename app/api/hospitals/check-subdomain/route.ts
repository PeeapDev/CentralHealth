import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to check if a hospital subdomain is available
 * GET /api/hospitals/check-subdomain?subdomain=example
 */
export async function GET(req: NextRequest) {
  try {
    // Get subdomain from query parameters
    const url = new URL(req.url);
    const subdomain = url.searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain parameter is required' }, { status: 400 });
    }

    if (subdomain.length < 3) {
      return NextResponse.json({ 
        available: false, 
        message: 'Subdomain must be at least 3 characters long' 
      }, { status: 200 });
    }

    // Check if subdomain already exists in the database
    const existingHospital = await prisma.hospital.findUnique({
      where: { subdomain: subdomain },
      select: { id: true }
    });

    // Return availability status
    return NextResponse.json({
      available: !existingHospital,
      message: existingHospital ? 'Subdomain is already taken' : 'Subdomain is available'
    });
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
