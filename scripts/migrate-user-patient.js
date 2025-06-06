// Script to link existing User and Patient records
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUserPatient() {
  console.log('Starting User-Patient migration...');
  
  try {
    // Find all patients with email that matches a user email
    const patients = await prisma.patient.findMany({
      where: { 
        email: { not: null },
        userId: null // Only process patients that aren't linked yet
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    console.log(`Found ${patients.length} patients to process`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const patient of patients) {
      try {
        if (!patient.email) {
          console.log(`Patient ${patient.id} has no email, skipping`);
          continue;
        }
        
        // Find matching user
        const user = await prisma.user.findUnique({
          where: { email: patient.email },
          select: { id: true, email: true }
        });
        
        if (user) {
          // Update the patient with userId
          await prisma.patient.update({
            where: { id: patient.id },
            data: { userId: user.id }
          });
          
          console.log(`✅ Linked patient ${patient.id} to user ${user.id}`);
          successCount++;
        } else {
          console.log(`❌ No matching user found for patient ${patient.id} (${patient.email})`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error updating patient ${patient.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration complete: ${successCount} linked, ${errorCount} errors`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateUserPatient()
  .catch(console.error)
  .finally(() => console.log('Migration script completed'));
