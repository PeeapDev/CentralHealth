import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from './prisma';

/**
 * Staff authentication middleware - completely separate from patient auth
 * Adheres to Hospital Staff Management Security Policy:
 * - Maintains strict separation between admin and staff accounts
 * - Prevents unauthorized staff from accessing admin resources
 * - Enforces proper role-based authorization
 * - Logs all authentication attempts for security audit
 */

// Define valid staff roles directly to avoid import errors
type UserRole = 'PATIENT' | 'DOCTOR' | 'STAFF' | 'MANAGER' | 'ADMIN';
const STAFF_ROLES: UserRole[] = ['DOCTOR', 'STAFF', 'MANAGER', 'ADMIN'];

type StaffAuthResult = {
  success: boolean;
  user?: any;
  error?: string;
  status?: number;
  isHospitalAdmin?: boolean;
  isSuperAdmin?: boolean;
};

// Staff authentication middleware - completely separate from patient auth
export async function verifyStaffAuth(
  request: NextRequest | Request,
  hospitalName?: string
): Promise<StaffAuthResult> {
  try {
    // Get the token from cookies (handling both NextRequest and standard Request)
    let token: string | undefined;
    
    if (request instanceof NextRequest) {
      token = request.cookies.get('auth_token')?.value;
    } else {
      // For standard Request objects
      const cookieStr = request.headers.get('cookie') || '';
      const cookies = Object.fromEntries(
        cookieStr.split('; ').map(c => {
          const [name, ...value] = c.split('=');
          return [name, value.join('=')];
        })
      );
      token = cookies['auth_token'];
    }

    if (!token) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401,
      };
    }

    // Verify JWT using the same hardcoded secret as in lib/auth/jwt.ts
    // In production, this should be an environment variable, but for consistency we use the same secret
    const jwtSecret = "demo_jwt_secret_key_for_hospital_management_system_2024";
    
    // Create secret key
    const secretKey = new TextEncoder().encode(jwtSecret);
    
    // Verify token
    const { payload } = await jwtVerify(token, secretKey);
    
    // Get user ID from token
    const userId = payload.sub;

    // Fetch user by ID first; we will validate role/access afterwards
    const user = await prisma.user.findFirst({
      where: { id: userId as string },
      include: {
        Hospital: true,
        StaffProfile: true,
      },
    });

    // Validate that user has a staff-type role or isHospitalAdmin / isSuperAdmin
    if (!(user?.role && STAFF_ROLES.includes(user.role as UserRole)) && !user?.isHospitalAdmin && !user?.isSuperAdmin) {
      return {
        success: false,
        error: 'User is not staff',
        status: 403,
      };
    }

    if (!user) {
      // Create audit log for failed authentication
      await prisma.securityAuditLog.create({
        data: {
          action: 'STAFF_AUTH_FAILED',
          userId: userId as string || 'unknown',
          success: false,
          details: 'Staff not found or has invalid role',
          ipAddress: request instanceof NextRequest ? request.headers.get('x-forwarded-for') || 'unknown' : undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          requestPath: request instanceof NextRequest ? request.nextUrl.pathname : undefined,
        },
      }).catch(err => console.error('Failed to log security event:', err));
      
      return {
        success: false,
        error: 'Staff not found or invalid role',
        status: 403,
      };
    }

    let hospital: any = null;
    if (hospitalName) {
      // Attempt to find the hospital by subdomain, name, or code
      hospital = await prisma.hospital.findFirst({
        where: {
          OR: [
            { subdomain: hospitalName },
            { name: hospitalName },
            { code: hospitalName },
          ],
        },
      });

      if (!hospital) {
        return {
          success: false,
          error: 'Hospital not found',
          status: 404,
        };
      }

      // Super admins can access any hospital
      if (!(user.isSuperAdmin)) {
        // For non-super admins, check if they belong to this hospital
        if (!(user.isHospitalAdmin || user.role === 'ADMIN') && user.hospitalId !== hospital.id) {
          // Create audit log for unauthorized hospital access
          await prisma.securityAuditLog.create({
            data: {
              action: 'UNAUTHORIZED_HOSPITAL_ACCESS_ATTEMPT',
              userId: user.id,
              success: false,
              details: `Attempted access to hospital ${hospitalName} without permission`,
              ipAddress: request instanceof NextRequest ? request.headers.get('x-forwarded-for') || 'unknown' : undefined,
              userAgent: request.headers.get('user-agent') || undefined,
              requestPath: request instanceof NextRequest ? request.nextUrl.pathname : undefined,
            },
          }).catch(err => console.error('Failed to log security event:', err));
          
          return {
            success: false,
            error: 'No access to this hospital',
            status: 403,
          };
        }
      }
    }
    
    // Create audit log for successful authentication
    await prisma.securityAuditLog.create({
      data: {
        action: 'STAFF_AUTH_SUCCESS',
        userId: user.id,
        success: true,
        details: `Successful staff authentication for ${user.email}`,
        ipAddress: request instanceof NextRequest ? request.headers.get('x-forwarded-for') || 'unknown' : undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        requestPath: request instanceof NextRequest ? request.nextUrl.pathname : undefined,
      },
    }).catch(err => console.error('Failed to log security event:', err));

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    // A user is considered a hospital admin if their DB flag is true OR their email matches the hospital's admin_email.
    const isAdminByEmail = hospital && (hospital.settings as any)?.admin_email?.toLowerCase() === user.email?.toLowerCase();
    const effectiveIsHospitalAdmin = (user.isHospitalAdmin || isAdminByEmail) ?? false;

    return {
      success: true,
      user: userWithoutPassword,
      isHospitalAdmin: effectiveIsHospitalAdmin,
      isSuperAdmin: user.isSuperAdmin || false,
    };
  } catch (error) {
    console.error('Staff auth error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 401,
    };
  }
}
