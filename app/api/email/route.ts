import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/index';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is authorized to send emails (superadmin or hospital admin)
    try {
      const payload = await verifyToken(token);
      if (!payload || (payload.role !== 'superadmin' && payload.role !== 'admin')) {
        return NextResponse.json({ error: 'Unauthorized: Insufficient permissions' }, { status: 403 });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Process email request
    const body = await request.json();
    const { to, subject, text, html, cc, bcc, attachments } = body;

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, and either text or html' }, { status: 400 });
    }

    // Send the email
    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      console.error('Failed to send email:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in email API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Email API is ready' });
}
