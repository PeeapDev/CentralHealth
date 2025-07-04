import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * API endpoint to schedule notifications for patients
 * Handles both in-app notifications and SMS/email notifications if configured
 */
export async function POST(request: Request) {
  try {
    // Ensure authenticated user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { patientId, notifications } = await request.json();
    
    if (!patientId || !notifications || !Array.isArray(notifications)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Get patient to ensure they exist and we have their permanent medical ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { 
        id: true, 
        mrn: true,  // Permanent medical ID
        name: true,
        phone: true,
        email: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Create notifications in database
    const createdNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const newNotification = await prisma.notification.create({
          data: {
            patientId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            scheduledFor: new Date(notification.scheduledFor),
            status: 'scheduled',
            createdBy: session.user?.id || 'system'
          }
        });

        return newNotification;
      })
    );

    // If patient has phone number or email, schedule external notifications too
    // This would integrate with SMS or email service in a real implementation
    const contactMethods = [];
    if (patient.phone) contactMethods.push('sms');
    if (patient.email || patient.User?.email) contactMethods.push('email');

    if (contactMethods.length > 0) {
      console.log(`Would send external notifications to patient ${patient.name} via: ${contactMethods.join(', ')}`);
      // In a real implementation, this would call SMS/email services
    }

    return NextResponse.json({
      success: true,
      message: `${createdNotifications.length} notifications scheduled successfully`,
      notifications: createdNotifications
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return NextResponse.json({ error: 'Failed to schedule notifications' }, { status: 500 });
  }
}
