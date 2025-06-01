import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ hospitalName: string }> }
) {
  try {
    // Await the params in Next.js 15
    const params = await context.params;
    const { hospitalName } = params;
    
    // Find the hospital by subdomain in the database
    const hospital = await prisma.hospital.findUnique({
      where: { subdomain: hospitalName },
      select: {
        id: true,
        name: true,
        subdomain: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        branding: true,
        // Don't include users for security
      }
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Format the data to match the frontend expectations
    const settings = hospital.settings as any;
    const branding = hospital.branding as any || {};
    
    const formattedHospital = {
      id: hospital.id,
      name: hospital.name,
      subdomain: hospital.subdomain,
      description: hospital.description || 'A modern healthcare facility committed to providing excellent medical care',
      tagline: branding?.tagline || 'Your Health, Our Priority',
      logo: branding?.logo || '/placeholder.svg?height=80&width=80',
      email: settings?.admin_email || '',
      phone: settings?.phone || '',
      address: settings?.address || '',
      city: settings?.city || '',
      state: settings?.state || '',
      country: settings?.country || 'Sierra Leone',
      zip: settings?.zip || '',
      status: settings?.status || 'Active',
      package: settings?.package || 'Basic',
      website: settings?.website || '',
      modules: settings?.modules || ['billing', 'appointment'],
      // Additional fields for the hospital home page
      established: settings?.established || '2020',
      beds: settings?.beds || '100+',
      doctors: settings?.doctors || '25+',
      departments: settings?.departments || '10+',
      rating: settings?.rating || 4.5,
      accreditation: settings?.accreditation || ['MOH Certified', 'ISO 9001:2015'],
      specialties: settings?.specialties || [
        'General Medicine', 
        'Pediatrics', 
        'Obstetrics', 
        'Surgery', 
        'Radiology', 
        'Pathology'
      ],
      services: [
        { name: 'OPD Services', description: 'Comprehensive outpatient care' },
        { name: 'IPD Services', description: '24/7 inpatient care' },
        { name: 'Pharmacy', description: 'Full-service pharmacy' },
        { name: 'Laboratory', description: 'Advanced diagnostic tests' },
        { name: 'Radiology', description: 'Digital imaging services' },
        { name: 'Emergency', description: '24/7 emergency services' },
      ],
      hours: {
        emergency: '24/7',
        opd: settings?.opd_hours || '8:00 AM - 8:00 PM',
        pharmacy: settings?.pharmacy_hours || '8:00 AM - 10:00 PM',
      },
      branches: settings?.branches || [],
      created_at: hospital.createdAt.toISOString(),
      updated_at: hospital.updatedAt.toISOString()
    };

    return NextResponse.json(formattedHospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ hospitalName: string }> }
) {
  try {
    // Await the params in Next.js 15
    const params = await context.params;
    const { hospitalName } = params;
    
    // Get the request body
    const body = await req.json();
    
    // Validate token for authentication
    const token = req.cookies.get('hospitalToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Find the hospital by subdomain
    const hospital = await prisma.hospital.findUnique({
      where: { subdomain: hospitalName }
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }
    
    // Get current settings and branding
    const currentSettings = hospital.settings as any || {};
    const currentBranding = hospital.branding as any || {};
    
    // Prepare updated settings
    const updatedSettings = {
      ...currentSettings,
      admin_email: body.admin_email || currentSettings.admin_email,
      phone: body.phone || currentSettings.phone,
      address: body.address || currentSettings.address,
      city: body.city || currentSettings.city,
      state: body.state || currentSettings.state,
      country: body.country || currentSettings.country,
      zip: body.zip || currentSettings.zip,
      website: body.website || currentSettings.website,
      branches: body.branches || currentSettings.branches
    };
    
    // Prepare updated branding
    const updatedBranding = {
      ...currentBranding,
      logo: body.logo || currentBranding.logo
    };
    
    // Update the hospital
    const updatedHospital = await prisma.hospital.update({
      where: { id: hospital.id },
      data: {
        name: body.name || hospital.name,
        description: body.description || hospital.description,
        settings: updatedSettings,
        branding: updatedBranding
      }
    });
    
    return NextResponse.json({
      message: 'Hospital updated successfully',
      hospital: {
        id: updatedHospital.id,
        name: updatedHospital.name,
        subdomain: updatedHospital.subdomain,
        description: updatedHospital.description,
        // Include other formatted fields as needed
      }
    });
  } catch (error) {
    console.error('Error updating hospital:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
