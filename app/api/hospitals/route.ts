import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { isSmtpConfigured, sendAdminCredentials } from '@/lib/email';
import crypto from 'crypto';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    let isAuthorized = false;
    
    // In development, proceed even without token (for demo/testing)
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing token verification');
      isAuthorized = true;
    } else if (token) {
      // Verify the token to ensure superadmin access only
      try {
        const payload = await verifyToken(token);
        if (payload.role === 'superadmin') {
          isAuthorized = true;
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    if (!isAuthorized) {
      console.warn('Unauthorized access to hospitals API');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Define the hospital type based on prisma selection
    type PrismaHospital = {
      id: string;
      name: string;
      subdomain: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      settings: any;
      branding: any;
    };
    
    // Get all hospitals from the database using Prisma
    let hospitals: PrismaHospital[] = [];
    try {
      hospitals = await prisma.hospital.findMany({
        select: {
          id: true,
          name: true,
          subdomain: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          settings: true,
          branding: true,
          // Don't include users or patients for security
        }
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      
      // Provide demo data for development/testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Using demo hospital data for development');
        hospitals = [
          {
            id: '1',
            name: 'Sierra Leone General Hospital',
            subdomain: 'slgh',
            description: 'Main general hospital in Sierra Leone',
            createdAt: new Date(),
            updatedAt: new Date(),
            settings: { admin_email: 'admin@slgh.org', status: 'Active', package: 'Premium' },
            branding: { logo: '/placeholder.svg?height=56&width=56' },
          },
          {
            id: '2',
            name: 'Freetown Medical Center',
            subdomain: 'fmc',
            description: 'Leading medical center in Freetown',
            createdAt: new Date(),
            updatedAt: new Date(),
            settings: { admin_email: 'admin@fmc.org', status: 'Active', package: 'Basic' },
            branding: { logo: '/placeholder.svg?height=56&width=56' },
          },
          {
            id: '3',
            name: 'Connaught Hospital',
            subdomain: 'connaught',
            description: 'Tertiary referral hospital in Freetown',
            createdAt: new Date(),
            updatedAt: new Date(),
            settings: { admin_email: 'admin@connaught.org', status: 'Active', package: 'Enterprise' },
            branding: { logo: '/placeholder.svg?height=56&width=56' },
          }
        ];
      }
    }

    // Transform the data to match the expected format in the frontend
    const formattedHospitals = hospitals.map(hospital => {
      const settings = hospital.settings as any;
      const branding = hospital.branding as any || {};
      
      return {
        id: hospital.id,
        name: hospital.name,
        subdomain: hospital.subdomain,
        email: settings?.admin_email || '',
        phone: settings?.phone || '',
        address: settings?.address || '',
        city: settings?.city || '',
        state: settings?.state || '',
        country: settings?.country || '',
        zip: settings?.zip || '',
        status: settings?.status || 'Active',
        package: settings?.package || 'Basic',
        website: settings?.website || '',
        description: hospital.description || '',
        modules: settings?.modules || ['billing', 'appointment'],
        admin_email: settings?.admin_email || '',
        branches: settings?.branches || [],
        created_at: hospital.createdAt.toISOString(),
        updated_at: hospital.updatedAt.toISOString(),
        logo: branding?.logo || '/placeholder.svg?height=56&width=56'
      };
    });

    console.log(`Returning ${formattedHospitals.length} hospitals from database`);
    return NextResponse.json({ hospitals: formattedHospitals }, { status: 200 });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Hospital creation request received');
    
    // DEVELOPMENT MODE: Always bypass authentication for hospital creation
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Completely bypassing authentication for hospital creation');
      // Skip all token verification in development mode
    } else {
      // PRODUCTION MODE: Verify token
      // Get token from cookies or Authorization header
      let token = req.cookies.get('token')?.value;
      
      // Check Authorization header if no token in cookies
      if (!token) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7); // Remove 'Bearer ' prefix
          console.log('Using token from Authorization header');
        }
      }
      
      if (!token) {
        console.log('Authentication required - no token found in cookies or Authorization header');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      } else {
        // Verify the token to ensure superadmin access only
        try {
          const payload = await verifyToken(token);
          console.log('Token verified, user role:', payload.role);
          if (payload.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }
    }

    const body = await req.json();
    console.log('Creating hospital with data:', body);

    // Check if SMTP is configured
    const smtpEnabled = await isSmtpConfigured();

    // Basic validation
    if (!body.name || !body.admin_email || (!body.admin_password && !smtpEnabled)) {
      return NextResponse.json(
        { error: smtpEnabled ? 'Missing required fields' : 'Missing required fields. Admin password is required when SMTP is not configured.' },
        { status: 400 }
      );
    }
    
    // Generate a random password if SMTP is enabled and no password was provided
    let adminPassword = body.admin_password;
    if (smtpEnabled && !adminPassword) {
      // Generate a secure random password (12 characters with letters, numbers, and symbols)
      adminPassword = crypto.randomBytes(8).toString('base64').replace(/[/+=]/g, '$');
      console.log('Generated random password for admin');
    }

    // Create subdomain from name if not provided
    if (!body.subdomain) {
      body.subdomain = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    // Check if subdomain is already taken
    const existingHospital = await prisma.hospital.findUnique({
      where: { subdomain: body.subdomain }
    });

    if (existingHospital) {
      return NextResponse.json({ 
        error: 'Subdomain already exists. Please choose another name or specify a different subdomain.' 
      }, { status: 400 });
    }

    // Prepare settings and branding JSON objects according to our schema
    const settings = {
      admin_email: body.admin_email,
      phone: body.phone || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      country: body.country || '',
      zip: body.zip || '',
      status: 'Active',
      package: body.package || 'Basic',
      website: body.website || '',
      modules: body.modules || ['billing', 'appointment'],
      branches: body.branches || []
    };

    const branding = {
      logo: body.logo || '/placeholder.svg?height=56&width=56',
      colors: body.colors || {
        primary: '#0070f3',
        secondary: '#00c853'
      },
      favicon: body.favicon || null
    };

    // Create the hospital in the database with Prisma
    console.log('Attempting to create hospital record:', {
      name: body.name,
      subdomain: body.subdomain,
      email: body.admin_email
    });
    
    let newHospital;
    try {
      newHospital = await prisma.hospital.create({
        data: {
          name: body.name,
          subdomain: body.subdomain,
          description: body.description || '',
          settings: settings,
          branding: branding,
          // Create the admin user for this hospital
          users: {
            create: {
              email: body.admin_email,
              password: await bcryptjs.hash(adminPassword, 10),
              name: body.admin_name || 'Hospital Admin',
              role: 'admin'
            }
          }
        },
        // Include the created user in the response
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              // Don't include password
            }
          }
        }
      });
      console.log('Hospital created successfully with ID:', newHospital.id);
    } catch (prismaError) {
      console.error('Prisma Error during hospital creation:', prismaError);
      return NextResponse.json({ 
        error: 'Database Error: Failed to create hospital', 
        detail: prismaError instanceof Error ? prismaError.message : 'Unknown database error'
      }, { status: 500 });
    }

    // Format the response to match frontend expectations
    const formattedHospital = {
      id: newHospital.id,
      name: newHospital.name,
      subdomain: newHospital.subdomain,
      email: settings.admin_email,
      phone: settings.phone,
      address: settings.address,
      city: settings.city,
      state: settings.state,
      country: settings.country,
      zip: settings.zip,
      status: settings.status,
      package: settings.package,
      website: settings.website,
      description: newHospital.description || '',
      modules: settings.modules,
      admin_email: settings.admin_email,
      branches: settings.branches,
      created_at: newHospital.createdAt.toISOString(),
      updated_at: newHospital.updatedAt.toISOString(),
      logo: branding.logo,
      admin_user: newHospital.users[0]
    };
    
    console.log(`Hospital created: ${body.name} with subdomain ${body.subdomain} and UUID ${newHospital.id}`);
    
    // Send admin credentials via email if SMTP is configured
    let emailStatus = false;
    if (smtpEnabled) {
      try {
        const emailResult = await sendAdminCredentials({
          hospitalName: body.name,
          adminEmail: body.admin_email,
          adminPassword: adminPassword,
          hospitalSubdomain: body.subdomain,
          adminName: body.admin_name || 'Hospital Admin'
        });
        
        if (emailResult.success) {
          console.log(`Admin credentials sent to ${body.admin_email}`);
          emailStatus = true;
        } else {
          // Type assertion to access the error property safely
          const errorResult = emailResult as { success: boolean; error: any };
          console.error('Failed to send admin credentials email:', errorResult.error);
        }
      } catch (error) {
        console.error('Failed to send admin credentials email:', error);
        // Continue anyway, just log the error
      }
    } else {
      console.log('SMTP not configured - not sending admin credentials email');
    }

    return NextResponse.json({
      message: 'Hospital created successfully',
      hospital: formattedHospital,
      credentials_emailed: emailStatus,
      admin_password: smtpEnabled ? undefined : adminPassword // Only return password if email wasn't sent
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    // Provide more detailed error message to help with debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json({ 
      error: 'Failed to create hospital', 
      detail: errorMessage 
    }, { status: 500 });
  }
}
