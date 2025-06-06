import { PrismaClient } from '@/lib/generated/prisma';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function linkUsersToPatients() {
  try {
    console.log('Starting user-patient linking process...');
    
    // 1. Get all patients that don't have userId set
    const patients = await prisma.patient.findMany({
      where: {
        email: { not: null }
      },
      select: {
        id: true,
        email: true,
        name: true,
        medicalNumber: true
      }
    });
    
    console.log(`Found ${patients.length} patients to process`);
    
    // 2. For each patient, find a matching user by email and create the relationship
    let linked = 0;
    let failed = 0;
    
    for (const patient of patients) {
      try {
        if (!patient.email) {
          console.log(`Patient ${patient.id} has no email, skipping`);
          continue;
        }
        
        // Find a matching user with the same email
        const matchingUser = await prisma.user.findUnique({
          where: { email: patient.email }
        });
        
        if (matchingUser) {
          try {
            // Update the patient record to include userId (execute raw SQL to bypass schema limitations)
            await prisma.$executeRaw`UPDATE "Patient" SET "userId" = ${matchingUser.id} WHERE id = ${patient.id}`;
            
            console.log(`✅ Linked patient ${patient.id} to user ${matchingUser.id}`);
            linked++;
          } catch (updateError) {
            console.error(`Failed to update patient ${patient.id}:`, updateError);
            failed++;
          }
        } else {
          console.log(`❌ No matching user found for patient ${patient.id} with email ${patient.email}`);
          failed++;
        }
      } catch (patientError) {
        console.error(`Error processing patient ${patient.id}:`, patientError);
        failed++;
      }
    }
    
    console.log(`Linking complete: ${linked} patients linked, ${failed} failures`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
linkUsersToPatients()
  .catch(console.error)
  .finally(() => process.exit());
