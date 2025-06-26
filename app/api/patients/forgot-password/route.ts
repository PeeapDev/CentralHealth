import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestIdentifier, rateLimit } from '@/lib/rate-limiting';
import { getPatientEmail } from '@/lib/patient-data-utils';
import crypto from 'crypto';
import { createTransport } from 'nodemailer';
import { Patient, PatientEmail } from '@/lib/generated/prisma';

interface AuditLogData {
  action: string;
  ipAddress?: string;
  details?: string | object;
  userId?: string;
  patientId?: string;
  success?: boolean;
}

interface EmailResult {
  success: boolean;
  message?: string;
  devModeInfo?: any;
}

async function logSecurityEvent(data: AuditLogData): Promise<void> {
  try {
    const details = typeof data.details === 'string' 
      ? data.details 
      : JSON.stringify(data.details || {});
      
    // Include patient ID in details field if present, since securityAuditLog doesn't have a direct patientId field
    const detailsWithPatient = data.patientId ? 
      {...JSON.parse(details), patientId: data.patientId} : 
      JSON.parse(details);
      
    await prisma.securityAuditLog.create({
      data: {
        action: data.action,
        ipAddress: data.ipAddress || null,
        details: JSON.stringify(detailsWithPatient),
        userId: data.userId || '00000000-0000-0000-0000-000000000000', // Default system user ID when none provided
        success: data.success ?? false,
        // Let Prisma handle these default values
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error instanceof Error ? error.message : String(error));
  }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<EmailResult> {
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (smtpConfigured) {
    try {
      const transport = createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      await transport.sendMail({
        from: process.env.SMTP_FROM_EMAIL || 'noreply@centralhealthsystem.org',
        to,
        subject,
        html
      });
      
      return { success: true };
    } catch (error) {
      if (isDev) {
        return {
          success: false, 
          message: 'Email sending failed but development mode is active',
          devModeInfo: { to, subject, htmlPreview: html.substring(0, 500) + '...' }
        };
      }
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error sending email' };
    }
  } else if (isDev) {
    return { 
      success: true, 
      message: 'Email sending simulated in development mode',
      devModeInfo: { to, subject, htmlPreview: html.substring(0, 500) + '...' }
    };
  }
  return { success: false, message: 'Email service not configured' };
}

export async function POST(request: Request) {
  const identifier = await getRequestIdentifier() || 'unknown';
  
  try {
    const rateLimitResult = await rateLimit(identifier, 'PASSWORD_RESET');
    if (rateLimitResult) {
      await logSecurityEvent({
        action: 'PASSWORD_RESET_RATE_LIMIT',
        ipAddress: identifier,
        details: { message: 'Rate limit exceeded for password reset' },
        success: false
      });
      return rateLimitResult;
    }

    const body = await request.json();
    const { medicalNumber, email } = body;

    if (!medicalNumber && !email) {
      return NextResponse.json(
        { success: false, message: 'Email or medical number is required' },
        { status: 400 }
      );
    }

    // Use proper type annotation to include the Emails relation
    // Search for patient with medical number or email in the Emails relation
    // This follows CentralHealth System principles for email-based authentication
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { mrn: medicalNumber || '' },
          ...(email ? [
            {
              Emails: {
                some: {
                  email: email,
                }
              }
            }
            // No fallback to JSON contains as that's not supported by the Prisma schema
            // We rely on the properly structured email field in the Emails relation
          ] : []),
        ],
      },
      include: {
        Emails: {
          where: { primary: true },
          take: 1
        }
      }
    }) as (Patient & { Emails: PatientEmail[] }) | null;
    
    // Try to get email from relation first, then fall back to related user's email
    // Note: We no longer use the contact JSON field for email storage
    let primaryEmail = '';
    
    // First check Emails relation if it exists
    if (patient?.Emails?.[0]?.email) {
      primaryEmail = patient.Emails[0].email;
    } 
    // Then check if we can get a related user
    else if (patient?.userId) {
      try {
        const userData = await prisma.user.findUnique({
          where: { id: patient.userId },
          select: { email: true }
        });
        if (userData?.email) {
          primaryEmail = userData.email;
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    }
    
    const hasEmail = primaryEmail.trim().length > 0;

    if (!patient) {
      await logSecurityEvent({
        action: 'PASSWORD_RESET_NO_PATIENT_FOUND',
        ipAddress: identifier,
        details: {
          searchCriteria: { medicalNumber, email },
          message: 'No patient found matching the provided criteria'
        },
        success: false
      });
      
      return NextResponse.json(
        { success: true, message: 'If an account exists, password reset instructions will be sent' },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    const passwordReset = await prisma.passwordReset.create({
      data: {
        token,
        expiresAt: expirationDate,
        patientId: patient.id
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?id=${passwordReset.id}&token=${token}&medicalNumber=${encodeURIComponent(patient.mrn || '')}`;

    if (!hasEmail) {
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          success: true,
          message: 'Development mode: No email found for this medical number, but reset link is available.',
          debug: {
            resetUrl,
            resetToken: token.substring(0, 8) + '...',
            expiresIn: '15 minutes',
            resetId: passwordReset.id,
            emailSent: false,
            noEmailAvailable: true,
            medicalNumber: patient.mrn
          }
        });
      }
      
      await logSecurityEvent({
        action: 'PASSWORD_RESET_NO_EMAIL',
        patientId: patient.id,
        ipAddress: identifier,
        details: {
          message: 'Password reset requested but no email available',
          medicalNumber: patient.mrn
        },
        success: false
      });
      
      return NextResponse.json(
        { success: true, message: 'If an account exists, password reset instructions will be sent' },
        { status: 200 }
      );
    }

    const emailSubject = 'Password Reset - CentralHealth System';
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3b82f6;">Reset Your Password</h2>
        </div>
        <p>Hello,</p>
        <p>We received a request to reset your password for your CentralHealth patient account.</p>
        <p>Your Medical ID: <strong>${patient.mrn || 'Not Available'}</strong></p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset My Password</a>
        </div>
        <p>This link will expire in 15 minutes for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact hospital administration if you have concerns.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated message from the CentralHealth System. Please do not reply to this email.
        </p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: primaryEmail,
      subject: emailSubject,
      html: emailContent,
    });
    
    if (emailResult.success) {
      await logSecurityEvent({
        action: 'PASSWORD_RESET_EMAIL_SENT',
        patientId: patient.id,
        ipAddress: identifier,
        details: { resetId: passwordReset.id },
        success: true
      });

      const isDev = process.env.NODE_ENV !== 'production';
      return NextResponse.json({
        success: true,
        message: 'Password reset instructions sent to your email.',
        ...(isDev && {
          debug: {
            resetUrl,
            resetToken: token.substring(0, 8) + '...',
            expiresIn: '15 minutes',
            resetId: passwordReset.id,
            emailSent: true,
            emailDestination: primaryEmail,
            ...(emailResult.devModeInfo || {})
          }
        })
      });
    } else {
      await logSecurityEvent({
        action: 'PASSWORD_RESET_EMAIL_FAILED',
        patientId: patient.id,
        ipAddress: identifier,
        details: {
          error: emailResult.message || 'Unknown error',
          resetId: passwordReset.id,
          emailDestination: primaryEmail
        },
        success: false
      });
      
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        return NextResponse.json({
          success: true,
          message: 'Email sending failed, but development mode is active. Password reset URL is available below.',
          details: emailResult.message || 'Email configuration issue',
          debug: {
            resetUrl,
            resetToken: token.substring(0, 8) + '...',
            expiresIn: '15 minutes',
            resetId: passwordReset.id,
            emailSent: false,
            emailDestination: primaryEmail,
            noEmailAvailable: !hasEmail,
            manualResetInstructions: 'Copy the resetUrl directly in your browser to reset the password',
            ...(emailResult.devModeInfo || {})
          }
        }, { status: 200 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'If the provided information matches our records, you will receive password reset instructions.',
      });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    
    await logSecurityEvent({
      action: 'PASSWORD_RESET_REQUEST_ERROR',
      ipAddress: identifier,
      details: { error: error instanceof Error ? error.message : String(error) },
      success: false
    });
    
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}