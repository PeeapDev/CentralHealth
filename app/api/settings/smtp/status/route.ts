import { NextResponse } from 'next/server'
import { isSmtpConfigured } from '@/lib/email'

// Check if SMTP is configured and enabled
export async function GET() {
  try {
    // Get SMTP status from the file-based storage
    const enabled = await isSmtpConfigured()
    return NextResponse.json({ enabled })
  } catch (error) {
    console.error('Error checking SMTP status:', error)
    return NextResponse.json({ enabled: false })
  }
}
