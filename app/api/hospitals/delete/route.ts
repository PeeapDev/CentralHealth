import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth/jwt';

/**
 * API endpoint to delete a hospital by ID (POST method)
 * Only accessible by superadmins
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Hospital deletion request received');
    
    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    if (!token) {
      console.log('Authentication required - no token found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify the token to ensure superadmin access only
    try {
      const payload = await verifyToken(token);
      console.log('Token verified, user role:', payload.role, 'for user:', payload.email || payload.userId);
      
      // Only superadmin can delete any hospital
      // Admin can only delete their own hospital
      if (payload.role !== 'superadmin') {
        console.log('Non-superadmin deletion attempt:', payload.role, 'for user:', payload.email);
        return NextResponse.json({ error: 'Only superadmin can delete hospitals' }, { status: 403 });
      }
      
      console.log('Superadmin authorization successful for hospital deletion');
      
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the hospital ID from the request body
    const body = await req.json();
    const hospitalId = body.hospitalId;
    
    console.log('Delete request body:', body);
    
    if (!hospitalId) {
      console.log('Hospital ID is missing in request');
      return NextResponse.json({ error: 'Hospital ID is required' }, { status: 400 });
    }
    
    // Validate that the hospital ID is a valid format
    if (typeof hospitalId !== 'string' || hospitalId.trim() === '') {
      console.log('Invalid hospital ID format:', hospitalId);
      return NextResponse.json({ error: 'Invalid hospital ID format' }, { status: 400 });
    }
    
    console.log('Attempting to delete hospital with ID:', hospitalId);
    
    // First, delete all related records to avoid foreign key constraint errors
    try {
      // Start a transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        console.log('Starting hospital deletion transaction for ID:', hospitalId);
        
        // Find the hospital to confirm it exists
        const hospital = await tx.hospital.findUnique({
          where: { id: hospitalId },
          select: { id: true, name: true, subdomain: true }
        });
        
        if (!hospital) {
          console.log('Hospital not found:', hospitalId);
          throw new Error('Hospital not found');
        }
        
        console.log('Deleting related records for hospital:', hospital.name);
        
        // Delete users associated with the hospital
        const deletedUsers = await tx.user.deleteMany({
          where: { hospitalId: hospitalId }
        });
        
        console.log(`Deleted ${deletedUsers.count} users for hospital:`, hospitalId);
        
        // Delete any patients associated with the hospital
        const deletedPatients = await tx.patient.deleteMany({
          where: { hospitalId: hospitalId }
        });
        
        console.log(`Deleted ${deletedPatients.count} patients for hospital:`, hospitalId);
        
        // Delete any appointments associated with the hospital
        const deletedAppointments = await tx.appointment.deleteMany({
          where: { hospitalId: hospitalId }
        });
        
        console.log(`Deleted ${deletedAppointments.count} appointments for hospital:`, hospitalId);
        
        // Delete any medical records associated with the hospital
        const deletedRecords = await tx.medicalRecord.deleteMany({
          where: { hospitalId: hospitalId }
        });
        
        console.log(`Deleted ${deletedRecords.count} medical records for hospital:`, hospitalId);
        
        // Delete the hospital itself
        console.log('Deleting hospital:', hospital.name, hospital.subdomain);
        return await tx.hospital.delete({
          where: { id: hospitalId }
        });
      });
      
      console.log('Hospital deleted successfully:', result.id, result.name, result.subdomain);
      
      return NextResponse.json({
        success: true,
        message: 'Hospital deleted successfully'
      });
    } catch (dbError) {
      console.error('Database error during hospital deletion:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      return NextResponse.json({ 
        error: 'Failed to delete hospital', 
        detail: errorMessage 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting hospital:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: 'Failed to delete hospital', 
      detail: errorMessage 
    }, { status: 500 });
  }
}
