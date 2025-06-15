import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Extract and validate email parameter
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email')?.trim();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email parameter is required', 
        exists: false // Include exists=false even for errors to maintain consistent interface
      }, { status: 400 });
    }
    
    // Simple regex validation before hitting the database
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
        exists: false
      }, { status: 400 });
    }
    
    try {
      // Check if patient with this email exists - with timeout protection
      const existingPatient = await Promise.race([
        prisma.patient.findFirst({
          where: { email: email }, // Using findFirst instead of findUnique since email may not be a unique field
          select: { id: true } // Only select ID field for performance
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        )
      ]) as { id: string } | null;
      
      return NextResponse.json({
        success: true,
        exists: !!existingPatient
      });
    } catch (dbError) {
      // Log the error safely without assuming its type
      console.error('Database error checking email:', dbError);
      
      // Generic database error response
      return NextResponse.json({ 
        success: false, 
        error: 'Unable to verify email at this time', 
        exists: false,
        details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
      }, { status: 503 }); // Service Unavailable is better than 500 for temporary DB issues
    }
  } catch (error) {
    // Catch-all for any other unexpected errors
    console.error('Unexpected error in check-email API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process request',
      exists: false
    }, { status: 500 });
  }
}
