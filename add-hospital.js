// Simple Node.js script to add a hospital
const { PrismaClient } = require('./prisma/node_modules/.prisma/client');
const prisma = new PrismaClient();

async function addHospital() {
  console.log('Creating test hospital for development...');
  
  try {
    // Check if hospital already exists
    const existing = await prisma.hospital.findUnique({
      where: { subdomain: 'city-medical' }
    });
    
    if (existing) {
      console.log('Hospital already exists with ID:', existing.id);
      return existing;
    }
    
    // Create hospital if it doesn't exist
    const hospital = await prisma.hospital.create({
      data: {
        name: 'City Medical Center',
        subdomain: 'city-medical',
        description: 'Full-service medical facility providing comprehensive healthcare',
        updatedAt: new Date(),
        settings: JSON.stringify({
          admin_email: 'admin@citymedical.org',
          phone: '+232 76 123 4567',
          address: '25 Independence Avenue',
          city: 'Freetown',
          state: 'Western Area',
          country: 'Sierra Leone',
          zip: '00233',
          status: 'Active',
          package: 'Premium',
          website: 'https://citymedical.org',
          established: '2010',
          beds: '250',
          doctors: '45',
          departments: '12',
          modules: [
            'appointment', 
            'billing', 
            'pharmacy', 
            'pathology',
            'radiology', 
            'bloodbank',
            'ambulance',
            'neonatal',
            'antenatal'
          ]
        }),
        branding: JSON.stringify({
          logo: '/city-medical-logo.svg',
          tagline: 'Advanced Care for All',
          colors: {
            primary: '#0070f3',
            secondary: '#0ea5e9'
          }
        })
      }
    });
    
    console.log('Created hospital successfully:');
    console.log('- ID:', hospital.id);
    console.log('- Name:', hospital.name);
    console.log('- Subdomain:', hospital.subdomain);
    console.log('Access at: http://localhost:3002/city-medical/admin');
    
    return hospital;
  } catch (error) {
    console.error('Error creating hospital:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addHospital()
  .catch(console.error);
