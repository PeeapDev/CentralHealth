import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed operation...')
  
  // Check if system hospital exists
  const systemHospital = await prisma.hospital.findFirst({
    where: {
      subdomain: 'system'
    }
  })
  
  // If system hospital doesn't exist, create it
  if (!systemHospital) {
    console.log('Creating system hospital for centralized patient management...')
    await prisma.hospital.create({
      data: {
        name: 'Central Patient System',
        subdomain: 'system',
        description: 'Central patient management system - not a physical hospital',
        settings: JSON.stringify({
          isSystemHospital: true,
          features: { appointments: true, records: true }
        }),
        branding: JSON.stringify({
          logo: null,
          colors: { primary: '#0070f3', secondary: '#ff0080' }
        })
      }
    })
    console.log('System hospital created successfully')
  } else {
    console.log('System hospital already exists, skipping creation')
  }
  
  console.log('Seed operation completed')
}

main()
  .catch((e) => {
    console.error('Error during seed operation:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
