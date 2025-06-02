import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to check if a phone number exists
async function checkPhoneExists(phone: string) {
  if (!phone) return false;
  
  // Clean the phone number format to ensure consistent matching
  const cleanedPhone = phone.trim();
  
  // Check if patient with this phone exists
  const existingPatients = await prisma.patient.findMany({
    where: {
      telecom: {
        path: ['$[*].value'],
        equals: cleanedPhone
      }
    }
  });
  
  return existingPatients.length > 0;
}

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
    
    const exists = await checkPhoneExists(phone);
    
    return NextResponse.json({
      success: true,
      exists
    });
    
  } catch (error) {
    console.error('Check phone error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check phone'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;
    
    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone parameter is required' 
      }, { status: 400 });
    }
    
    const exists = await checkPhoneExists(phone);
    
    return NextResponse.json({
      success: true,
      exists
    });
    
  } catch (error) {
    console.error('Check phone error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check phone'
    }, { status: 500 });
  }
}
