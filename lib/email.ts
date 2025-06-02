import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'

// SMTP settings file path
const SMTP_SETTINGS_FILE = path.join(process.cwd(), 'smtp-settings.json')

// Default SMTP settings
const DEFAULT_SMTP_SETTINGS = {
  host: '',
  port: '587',
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'Hospital Management System',
  encryption: 'tls',
  enabled: false
}

// Get SMTP settings from file
async function getSmtpSettings() {
  try {
    // Check if the settings file exists
    const data = await fs.readFile(SMTP_SETTINGS_FILE, 'utf8')
    const smtpConfig = JSON.parse(data)
    
    if (!smtpConfig.enabled) {
      throw new Error('SMTP is disabled in system settings')
    }
    
    return smtpConfig
  } catch (error) {
    throw new Error('SMTP settings not configured')
  }
}

// Create nodemailer transporter
async function createTransporter() {
  const { host, port, username, password, encryption } = await getSmtpSettings()

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: encryption === 'ssl',
    auth: {
      user: username,
      pass: password,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
    },
  })
}

// Send email with admin credentials
export async function sendAdminCredentials({
  hospitalName,
  adminEmail,
  adminPassword,
  hospitalSubdomain,
  adminName = 'Hospital Admin',
}: {
  hospitalName: string
  adminEmail: string
  adminPassword: string
  hospitalSubdomain: string
  adminName?: string
}) {
  try {
    const { fromEmail, fromName } = await getSmtpSettings()
    const transporter = await createTransporter()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const hospitalUrl = `${baseUrl}/${hospitalSubdomain}/auth/login`

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: adminEmail,
      subject: `Your Admin Account for ${hospitalName}`,
      text: `
Dear ${adminName},

Your admin account for ${hospitalName} has been created successfully.

Login Details:
Email: ${adminEmail}
Password: ${adminPassword}

You can access your hospital dashboard at:
${hospitalUrl}

Please change your password after the first login for security reasons.

Regards,
Hospital Management System
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Hospital Management System</h2>
          <p>Dear ${adminName},</p>
          <p>Your admin account for <strong>${hospitalName}</strong> has been created successfully.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <h3 style="margin-top: 0;">Login Details</h3>
            <p><strong>Email:</strong> ${adminEmail}</p>
            <p><strong>Password:</strong> ${adminPassword}</p>
            <p><strong>Login URL:</strong> <a href="${hospitalUrl}">${hospitalUrl}</a></p>
          </div>
          
          <p><em>Please change your password after the first login for security reasons.</em></p>
          
          <p>Regards,<br>Hospital Management System</p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending admin credentials email:', error)
    throw error
  }
}

// Check if SMTP is configured and enabled
export async function isSmtpConfigured() {
  try {
    // Check if the settings file exists
    const data = await fs.readFile(SMTP_SETTINGS_FILE, 'utf8')
    const smtpConfig = JSON.parse(data)
    return smtpConfig.enabled
  } catch (error) {
    console.error('Error checking SMTP configuration:', error)
    return false
  }
}

// Save SMTP settings to file
export async function saveSmtpSettings(settings: any) {
  try {
    await fs.writeFile(SMTP_SETTINGS_FILE, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Error saving SMTP settings:', error)
    return false
  }
}

// Get SMTP settings (used by settings page)
export async function getStoredSmtpSettings() {
  try {
    const data = await fs.readFile(SMTP_SETTINGS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading SMTP settings:', error)
    return DEFAULT_SMTP_SETTINGS
  }
}

// Send email verification code to patient
// Send welcome email with health card details after onboarding completion
export async function sendWelcomeEmail({
  patientEmail,
  patientName,
  medicalId,
  bloodGroup,
  gender,
  dateOfBirth,
  photoUrl
}: {
  patientEmail: string
  patientName: string
  medicalId: string
  bloodGroup?: string
  gender?: string
  dateOfBirth?: string
  photoUrl?: string
}) {
  try {
    const { fromEmail, fromName } = await getSmtpSettings()
    const transporter = await createTransporter()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const healthCardUrl = `${baseUrl}/patient/health-card`
    
    // Calculate age if date of birth provided
    let age = ''
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      age = String(today.getFullYear() - birthDate.getFullYear())
    }
    
    // Format gender for display
    const formattedGender = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Not specified'
    
    // Calculate card expiry (5 years from now)
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 5)
    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: patientEmail,
      subject: `Welcome to Sierra Leone National Health Service - Your Health Card`,
      text: `
Dear ${patientName},

Thank you for completing your onboarding with the Sierra Leone National Health Service.

Your medical ID is: ${medicalId}

Health Card Details:
- Name: ${patientName}
- Medical ID: ${medicalId}
- Blood Group: ${bloodGroup || 'Not specified'}
- Gender: ${formattedGender}
- Age: ${age || 'Not specified'}
- Expiry Date: ${formattedExpiryDate}

You can access your digital health card at:
${healthCardUrl}

Please keep your Medical ID secure as you will need it for all hospital visits.

Regards,
Sierra Leone National Health Service
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Sierra Leone National Health Service</h2>
          <p>Dear ${patientName},</p>
          <p>Thank you for completing your onboarding with the Sierra Leone National Health Service.</p>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #0369a1;">Your Health Card</h3>
            
            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                  <h4 style="margin: 0 0 5px 0; color: #0c4a6e;">Sierra Leone NHS</h4>
                  <p style="margin: 0; font-size: 12px; color: #64748b;">Patient Health Card</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; font-size: 12px; color: #64748b;">Expires</p>
                  <p style="margin: 0; font-weight: bold; color: #334155;">${formattedExpiryDate}</p>
                </div>
              </div>
              
              <div style="display: flex; gap: 15px;">
                ${photoUrl ? `<div style="width: 80px; height: 80px; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
                  <img src="${photoUrl}" alt="Patient Photo" style="width: 100%; height: 100%; object-fit: cover;">
                </div>` : `<div style="width: 80px; height: 80px; background-color: #f1f5f9; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #94a3b8;">No Photo</span>
                </div>`}
                
                <div style="flex-grow: 1;">
                  <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 16px; color: #0f172a;">${patientName}</p>
                  <p style="margin: 0 0 3px 0; font-size: 14px; color: #334155;"><strong>Medical ID:</strong> ${medicalId}</p>
                  <p style="margin: 0 0 3px 0; font-size: 14px; color: #334155;"><strong>Blood Group:</strong> ${bloodGroup || 'Not specified'}</p>
                  <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Gender:</strong> ${formattedGender}${age ? `, <strong>Age:</strong> ${age}` : ''}</p>
                </div>
              </div>
            </div>
            
            <p style="margin-bottom: 0;">Access your digital health card <a href="${healthCardUrl}" style="color: #2563eb; font-weight: bold;">here</a>.</p>
          </div>
          
          <p style="font-weight: bold; color: #dc2626;">Please keep your Medical ID secure as you will need it for all hospital visits.</p>
          
          <p><em>This is an automatically generated email. Please do not reply.</em></p>
          
          <p>Regards,<br>Sierra Leone National Health Service</p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}

export async function sendVerificationEmail({
  patientEmail,
  patientName,
  verificationCode,
  medicalNumber
}: {
  patientEmail: string
  patientName: string
  verificationCode: string
  medicalNumber: string
}) {
  try {
    const { fromEmail, fromName } = await getSmtpSettings()
    const transporter = await createTransporter()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/verify-email?code=${verificationCode}&email=${encodeURIComponent(patientEmail)}`

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: patientEmail,
      subject: `Verify Your Email Address`,
      text: `
Dear ${patientName},

Thank you for registering with the Sierra Leone National Health Service.

Your medical number is: ${medicalNumber}

Please verify your email address by entering the following verification code:
${verificationCode}

Or click the link below to verify your email directly:
${verificationUrl}

This code is valid for 24 hours.

If you did not register for an account, please ignore this email.

Regards,
Sierra Leone National Health Service
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Sierra Leone National Health Service</h2>
          <p>Dear ${patientName},</p>
          <p>Thank you for registering with the Sierra Leone National Health Service.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <h3 style="margin-top: 0;">Your Medical Number</h3>
            <p style="font-size: 18px; font-weight: bold;">${medicalNumber}</p>
          </div>
          
          <p>Please verify your email address by entering the verification code below:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <div style="font-size: 24px; letter-spacing: 5px; font-weight: bold; padding: 15px; background-color: #e5e7eb; border-radius: 5px;">
              ${verificationCode}
            </div>
          </div>
          
          <p>Or <a href="${verificationUrl}" style="color: #3b82f6;">click here</a> to verify your email directly.</p>
          
          <p><em>This code is valid for 24 hours. If you did not register for an account, please ignore this email.</em></p>
          
          <p>Regards,<br>Sierra Leone National Health Service</p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}
