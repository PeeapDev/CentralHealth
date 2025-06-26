const { PrismaClient } = require('@prisma/client')

// Use a different variable name to avoid redeclaration conflicts
const prismaClient = new PrismaClient()

async function seedHospital() {
  console.log('Starting hospital seeding operation...')
  
  // Create a demo hospital if none exists
  const existingHospitals = await prismaClient.hospital.findMany({
    where: {
      subdomain: {
        not: 'system' // Exclude the system hospital
      }
    }
  })
  
  if (existingHospitals.length === 0) {
    console.log('No hospitals found. Creating demonstration hospital...')
    
    try {
      // Create a real hospital based on proper structured data
      const hospital = await prismaClient.hospital.create({
        data: {
          name: 'City Medical Center',
          subdomain: 'city-medical',
          description: 'Full-service medical facility providing comprehensive healthcare',
          updatedAt: new Date(), // Add the required updatedAt field
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
      })
      
      console.log('Hospital created successfully with ID:', hospital.id)
      console.log('Subdomain:', hospital.subdomain)
      console.log('You can now access the admin dashboard at /city-medical/admin')
      
    } catch (error) {
      console.error('Error creating hospital:', error)
    }
  } else {
    console.log(`${existingHospitals.length} hospitals already exist in the database:`)
    existingHospitals.forEach((h: any) => {
      console.log(`- ${h.name} (${h.subdomain})`)
    })
  }
  
  console.log('Hospital seeding completed')
}

seedHospital()
  .catch((e) => {
    console.error('Error during hospital seeding:', e)
  })
  .finally(async () => {
    await prismaClient.$disconnect()
  })
