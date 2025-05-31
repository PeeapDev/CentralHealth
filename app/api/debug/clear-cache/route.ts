import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// A simple API route to clear Next.js cache for specific paths
export async function GET(request: Request) {
  try {
    // Revalidate the patients and hospitals pages
    revalidatePath('/api/patients');
    revalidatePath('/api/hospitals');
    revalidatePath('/superadmin/users/patient');
    revalidatePath('/superadmin/hospitals');
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared for patients and hospitals paths' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cache' 
    }, { status: 500 });
  }
}
