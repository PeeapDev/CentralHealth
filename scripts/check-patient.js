// Script to check specific patient data
const { prisma } = require('../lib/database/prisma-client');

async function checkPatient() {
  const patientId = '5b06892e-7a84-4802-8f45-a48d01c5b1eb';
  
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        User: true,
        Emails: true,
        Phones: true,
        ProfilePicture: true
      }
    });
    
    console.log('PATIENT DATA:');
    console.log(JSON.stringify(patient, null, 2));
    
  } catch (error) {
    console.error('Error fetching patient:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPatient();
