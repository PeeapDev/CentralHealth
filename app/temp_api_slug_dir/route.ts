import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    console.log(`Fetching hospital with slug: ${slug}`);
    
    // For development, we'll use mock data instead of connecting to the backend
    // This allows us to test the hospital landing page without authentication issues
    
    // Define a global type for TypeScript
    declare global {
      var mockHospitals: Record<string, any>;
    }

    // Default hospitals if global state is not initialized
    if (!global.mockHospitals) {
      global.mockHospitals = {
        'medicore': {
          id: '1',
          name: 'MediCore Hospital',
          subdomain: 'medicore',
          email: 'admin@medicore.com',
          phone: '555-123-4567',
          address: '789 Healthcare Blvd',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          zip: '94103',
          status: 'Active',
          package: 'Enterprise',
          website: 'https://medicore.health',
          description: 'Leading the future of healthcare with innovation and compassionate care',
          modules: ['billing', 'appointment', 'pharmacy', 'telemedicine', 'labs'],
          admin_email: 'admin@medicore.com',
          branches: ['Main Campus', 'North Wing', 'South Wing', 'Children\'s Center'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          logo: '/placeholder.svg?height=56&width=56'
        },
        'city-general': {
          id: '2',
          name: 'City General Hospital',
          subdomain: 'city-general',
          email: 'admin@citygeneral.com',
          phone: '123-456-7890',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zip: '10001',
          status: 'Active',
          package: 'Premium',
          website: 'https://citygeneral.com',
          description: 'A leading healthcare provider in the city',
          modules: ['billing', 'appointment', 'pharmacy'],
          admin_email: 'admin@citygeneral.com',
          branches: ['Downtown', 'Uptown'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          logo: '/placeholder.svg?height=56&width=56'
        },
        'best': {
          id: '3',
          name: 'Best Care Medical',
          subdomain: 'best',
          email: 'admin@bestcare.com',
          phone: '987-654-3210',
          address: '456 Health Ave',
          city: 'Boston',
          state: 'MA',
          country: 'USA',
          zip: '02108',
          status: 'Active',
          package: 'Basic',
          website: 'https://bestcare.com',
          description: 'Quality healthcare for everyone',
          modules: ['billing', 'appointment'],
          admin_email: 'admin@bestcare.com',
          branches: ['Main'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          logo: '/placeholder.svg?height=56&width=56'
        }
      };
    }
    
    console.log(`Available hospitals: ${Object.keys(global.mockHospitals).join(', ')}`);
    const hospital = global.mockHospitals[slug];
    
    if (!hospital) {
      console.log(`Hospital not found with slug: ${slug}`);
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }
    
    console.log(`Found hospital: ${hospital.name}`);
    return NextResponse.json(hospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
