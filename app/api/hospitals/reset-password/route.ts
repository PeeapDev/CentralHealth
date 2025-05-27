import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { verifyToken } from '@/lib/auth/jwt';
import { isSmtpConfigured, sendAdminCredentials } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify superadmin role
    try {
      const payload = await verifyToken(token);
      if (payload.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

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
        hospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'admin') {
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
    if (user.hospital) {
      try {
        const emailResult = await sendAdminCredentials({
          hospitalName: user.hospital.name,
          adminEmail: user.email,
          adminPassword: newPassword,
          hospitalSubdomain: user.hospital.subdomain,
          adminName: user.name || 'Hospital Administrator'
        });

        if (!emailResult.success) {
          // Even though we updated the password, the email failed to send
          // We should inform the superadmin so they can communicate the password manually
          return NextResponse.json({
            success: true,
            warning: 'Password was reset but the email failed to send. Please contact the admin manually.',
            password: newPassword // Return the password for manual communication
          });
        }
      } catch (error) {
        console.error('Failed to send admin credentials email:', error);
        return NextResponse.json({
          success: true,
          warning: 'Password was reset but the email failed to send. Please contact the admin manually.',
          password: newPassword // Return the password for manual communication
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
