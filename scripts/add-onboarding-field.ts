// One-time script to add onboardingCompleted field to Patient table
import { PrismaClient } from '../lib/generated/prisma/index'

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Running Prisma migration to add onboardingCompleted field...')
    
    // Use Prisma's executeRaw to run SQL directly
    const result = await prisma.$executeRaw`
      ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true;
    `
    
    console.log('Migration completed successfully. Affected rows:', result)
    console.log('Now updating all existing patients to have onboardingCompleted = true')
    
    // Update all patients to ensure onboardingCompleted is true for existing records
    const updateResult = await prisma.patient.updateMany({
      data: {
        onboardingCompleted: true
      },
      where: {}
    })
    
    console.log('Updated patients:', updateResult.count)
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
