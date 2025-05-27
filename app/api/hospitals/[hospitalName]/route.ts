import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest, 
  context: { params: { hospitalName: string } }
) {
  try {
    const { hospitalName } = context.params;
    
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
      description: hospital.description,
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
      modules: settings?.modules || ['billing', 'appointment'],
      admin_email: settings?.admin_email || '',
      branches: settings?.branches || [],
      created_at: hospital.createdAt.toISOString(),
      updated_at: hospital.updatedAt.toISOString(),
      logo: branding?.logo || '/placeholder.svg?height=40&width=40'
    };

    return NextResponse.json(formattedHospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
