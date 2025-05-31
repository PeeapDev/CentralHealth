import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone parameter is required' 
      }, { status: 400 });
    }
    
    // Check if patient with this phone exists
    // Note: This is more complex as phone is stored in the telecom array
    const existingPatients = await prisma.patient.findMany({
      where: {
        telecom: {
          path: ['$[*].value'],
          equals: phone
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      exists: existingPatients.length > 0
    });
    
  } catch (error) {
    console.error('Check phone error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check phone'
    }, { status: 500 });
  }
}
