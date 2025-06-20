// Simple script to check for patients in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Count total patients
    const count = await prisma.patient.count();
    console.log(`Total patients in database: ${count}`);
    
    // If we have patients, get a sample
    if (count > 0) {
      const patients = await prisma.patient.findMany({
        take: 2,
        select: {
          id: true,
          medicalNumber: true,
          medicalId: true,
          email: true,
          name: true,
          telecom: true,
          hospitalId: true,
          extension: true,
          active: true,
          gender: true
        }
      });
      
      console.log('Sample patient records:');
      console.log(JSON.stringify(patients, null, 2));
      
      // Check for specific medical ID
      const testId = 'CGD2B';
      console.log(`\nSearching for patient with medical ID ${testId}...`);
      const matchingPatient = await prisma.patient.findFirst({
        where: {
          OR: [
            { medicalNumber: { contains: testId, mode: 'insensitive' } },
            { medicalId: { contains: testId, mode: 'insensitive' } },
            { name: { contains: testId, mode: 'insensitive' } },
            { telecom: { contains: testId, mode: 'insensitive' } },
            { email: { contains: testId, mode: 'insensitive' } },
          ]
        }
      });
      
      if (matchingPatient) {
        console.log('Found matching patient:', JSON.stringify(matchingPatient, null, 2));
      } else {
        console.log('No patient found with that ID');
      }
    } else {
      console.log('No patients in the database.');
    }
    
    // List all hospitals
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true
      }
    });
    
    console.log(`\nTotal hospitals: ${hospitals.length}`);
    console.log('Hospitals:', JSON.stringify(hospitals, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
