// Script to add onboardingCompleted column directly
import { PrismaClient } from '../lib/generated/prisma'

async function main() {
  console.log('Adding onboardingCompleted column to Patient table...')
  const prisma = new PrismaClient()
  
  try {
    // First, check if the column already exists
    try {
      // Try to select the column - if it doesn't exist, this will fail
      await prisma.$queryRaw`SELECT "onboardingCompleted" FROM "Patient" LIMIT 1`
      console.log('Column already exists, no need to add it')
    } catch (error) {
      // Column doesn't exist, so add it
      console.log('Column not found, adding it now')
      
      // Add the column with default value true
      const result = await prisma.$executeRaw`
        ALTER TABLE "Patient" 
        ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true
      `
      
      console.log(`Column added successfully. Affected: ${result}`)
    }
    
    // Now update schema.prisma to include the column again
    console.log('\nDon\'t forget to update your schema.prisma to add back:')
    console.log('  onboardingCompleted Boolean @default(true)')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
