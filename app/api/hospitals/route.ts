import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get all hospitals from the database using Prisma
    const hospitals = await prisma.hospital.findMany({
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
    return NextResponse.json({ hospitals: formattedHospitals });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Creating hospital with data:', body);

    // Basic validation
    if (!body.name || !body.admin_email || !body.admin_password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
    const newHospital = await prisma.hospital.create({
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
            password: await bcryptjs.hash(body.admin_password, 10),
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

    return NextResponse.json({
      message: 'Hospital created successfully',
      hospital: formattedHospital
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
