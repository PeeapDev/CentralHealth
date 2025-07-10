import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { verifyToken } from '@/lib/auth/jwt';
import { isSmtpConfigured, sendAdminCredentials } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify superadmin role
    let payload;
    try {
      payload = await verifyToken(token);
      if (payload.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 });
      }
    } catch (error) {
      console.error('Token verification failed:', error instanceof Error ? error.message : String(error));
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Use the authenticated session user
    // The JWT payload might contain either sub or userId as the identifier
    const session = { 
      user: { 
        email: payload.email, 
        role: payload.role, 
        id: payload.sub || payload.userId || '' 
      }
    };

    // Get the email from the request body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if SMTP is configured
    const smtpEnabled = await isSmtpConfigured();
    if (!smtpEnabled) {
      return NextResponse.json({ 
        error: 'SMTP is not configured. Cannot reset password without email capability.' 
      }, { status: 400 });
    }

    // Find the user by email
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        Hospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });
    
    // Rename the Hospital property to hospital for easier access
    // This is needed because Prisma uses capitalized relation names
    const userWithHospital = user ? {
      ...user,
      hospital: user.Hospital
    } : null;

    if (!user || !userWithHospital) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user role matches 'ADMIN' from UserRole enum
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'This endpoint is only for resetting hospital admin passwords' }, { status: 400 });
    }

    // Generate a new secure random password
    const newPassword = crypto.randomBytes(8).toString('base64').replace(/[/+=]/g, '$');

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Send the new credentials to the admin's email
    if (userWithHospital.hospital) {
      try {
        console.log('Attempting to send admin credentials email to', userWithHospital.email);
        
        // NEVER store plain text passwords - this violates CentralHealth security policy
        // The hashed password was already stored above
        
        let emailResult;
        try {
          // Try to send email if SMTP is configured
          emailResult = await sendAdminCredentials({
            hospitalName: userWithHospital.hospital.name,
            adminEmail: userWithHospital.email,
            adminPassword: newPassword,
            hospitalSubdomain: userWithHospital.hospital.subdomain,
            adminName: userWithHospital.name || 'Hospital Administrator'
          });
        } catch (emailError: unknown) {
          console.error('Failed to send email:', emailError);
          emailResult = { success: false, error: emailError instanceof Error ? emailError.message : String(emailError) };
        }

        // No passwords should be logged, even in development
        console.log(`Password reset completed for ${userWithHospital.email}`);

        if (!emailResult?.success) {
          // Even though we updated the password, the email failed to send
          // We should inform the superadmin so they can communicate the password manually
          return NextResponse.json({
            success: true,
            warning: 'Password was reset but the email failed to send. Contact the admin with the password below.',
            temporaryPasswordLength: newPassword.length // NEVER return actual passwords in API responses
          });
        }
      } catch (error) {
        console.error('Failed to send admin credentials email:', error);
        return NextResponse.json({
          success: true,
          warning: 'Password was reset but the email failed to send. Please contact IT support.',
          temporaryPasswordLength: newPassword.length // NEVER return actual passwords in API responses
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset and sent to the admin email'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
