import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffAuth } from '@/lib/staff-auth';

/**
 * GET handler for staff profile
 * Returns the profile information for the authenticated staff member
 * Follows Hospital Staff Management Security Policy:
 * - Maintains strict separation between admin and staff accounts
 * - Prevents unauthorized staff from accessing admin resources
 * - Enforces proper role-based authorization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    const hospitalName = params.hospitalName;

    // Verify staff authentication
    const authResult = await verifyStaffAuth(request, hospitalName);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Get staff profile with hospital information
    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Hospital: true,
        StaffProfile: true,
        DepartmentMemberships: {
          include: {
            department: true
          }
        }
      }
    });

    if (!userWithProfile) {
      return NextResponse.json(
        { error: 'Staff profile not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const { password, ...sanitizedUser } = userWithProfile;

    // Get recent appointments if doctor
    type Appointment = {
      id: string;
      date: Date;
      status: string;
      Patient?: {
        id: string;
        firstName?: string;
        lastName?: string;
        mrn?: string;
      };
      // Add other appointment fields as needed
    };
    
    let recentAppointments: Appointment[] = [];
    if (userWithProfile.role === 'DOCTOR') {
      recentAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: userId,
          date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
          }
        },
        include: {
          Patient: true
        },
        orderBy: {
          date: 'desc'
        },
        take: 5
      });
    }

    // Get any active tasks assigned to this staff member
    type Task = {
      id: string;
      title: string;
      dueDate?: Date;
      status: string;
      priority?: string;
    };
    
    // Try to get tasks if the Task model exists in the schema
    let tasks: Task[] = [];
    try {
      // Check if Task model exists in Prisma schema
      if ('task' in prisma) {
        tasks = await prisma.$queryRaw`
          SELECT id, title, dueDate, status, priority 
          FROM Task 
          WHERE assignedToId = ${userId} AND status != 'COMPLETED'
          ORDER BY dueDate ASC
          LIMIT 10
        `;
      }
    } catch (err) {
      console.log('Task model may not exist yet:', err);
      // Silent fail - tasks will remain an empty array
    }

    // Create audit log of profile view
    await prisma.securityAuditLog.create({
      data: {
        action: 'STAFF_PROFILE_VIEW',
        userId: userId,
        success: true,
        details: `Staff profile viewed by owner`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        requestPath: request.nextUrl.pathname,
      }
    }).catch(err => console.error('Failed to log security event:', err));

    // Return the staff profile with additional data
    return NextResponse.json({
      success: true,
      data: {
        ...sanitizedUser,
        appointments: recentAppointments,
        tasks: tasks
      },
    });

  } catch (error) {
    console.error('Error fetching staff profile:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching staff profile' },
      { status: 500 }
    );
  }
}
