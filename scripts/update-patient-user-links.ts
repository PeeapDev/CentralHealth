import { prisma } from '../lib/prisma';

/**
 * This script links existing Patient records with User records 
 * where emails match between the two tables.
 */
async function linkPatientsToUsers() {
  console.log('Starting patient-user linking script...');
  
  try {
    // 1. Get all patients without a userId set
    const patientsWithoutUser = await prisma.patient.findMany({
      where: {
        userId: null,
        email: { not: null }, // Only consider patients with email addresses
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    console.log(`Found ${patientsWithoutUser.length} patients without userId and with email`);
    
    // 2. For each patient, find a matching user by email and update the patient record
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const patient of patientsWithoutUser) {
      if (!patient.email) continue; // Skip patients without email (shouldn't happen due to the query)
      
      // Find user with matching email
      const matchingUser = await prisma.user.findUnique({
        where: {
          email: patient.email
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
      
      if (matchingUser) {
        // Update the patient record with userId
        await prisma.patient.update({
          where: { id: patient.id },
          data: { userId: matchingUser.id }
        });
        
        updatedCount++;
        console.log(`Linked patient ${patient.id} with user ${matchingUser.id} (email: ${patient.email})`);
      } else {
        notFoundCount++;
        console.log(`No matching user found for patient ${patient.id} with email ${patient.email}`);
      }
    }
    
    console.log('\nSummary:');
    console.log(`Total patients processed: ${patientsWithoutUser.length}`);
    console.log(`Successfully linked: ${updatedCount}`);
    console.log(`No matching user found: ${notFoundCount}`);
    
  } catch (error) {
    console.error('Error linking patients to users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
linkPatientsToUsers()
  .then(() => console.log('Patient-user linking script completed.'))
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  });
