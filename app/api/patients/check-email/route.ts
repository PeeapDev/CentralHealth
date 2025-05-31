import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email parameter is required' 
      }, { status: 400 });
    }
    
    // Check if patient with this email exists
    const existingPatient = await prisma.patient.findUnique({
      where: { email }
    });
    
    return NextResponse.json({
      success: true,
      exists: !!existingPatient
    });
    
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check email'
    }, { status: 500 });
  }
}
