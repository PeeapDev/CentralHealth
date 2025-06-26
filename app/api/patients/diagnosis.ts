import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is a diagnostic endpoint to help identify database connection issues
export async function GET(request: NextRequest) {
  try {
    // Try to connect to the database and perform a simple query
    console.log('Attempting simple database query...');
    
    // Just count patients - shouldn't break regardless of schema
    const count = await prisma.patient.count();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      patientCount: count
    });
  } catch (error) {
    console.error('Diagnostic API - Database connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
