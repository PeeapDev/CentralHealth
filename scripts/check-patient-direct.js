// Direct database access script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPatient() {
  const patientId = '5b06892e-7a84-4802-8f45-a48d01c5b1eb';
  
  try {
    console.log('Checking patient ID:', patientId);
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        User: true,
        Emails: true,
        Phones: true,
        ProfilePicture: true
      }
    });
    
    if (!patient) {
      console.log('PATIENT NOT FOUND');
      return;
    }
    
    console.log('PATIENT BASIC DATA:');
    console.log({
      id: patient.id,
      mrn: patient.mrn,
      name: patient.name,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth
    });
    
    console.log('\nUSER DATA:');
    console.log(patient.User);
    
    console.log('\nEMAILS:');
    console.log(patient.Emails);
    
    console.log('\nPHONES:');
    console.log(patient.Phones);
    
    console.log('\nPROFILE PICTURE:');
    console.log(patient.ProfilePicture ? 'Has profile picture' : 'No profile picture');
    
  } catch (error) {
    console.error('Error fetching patient:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPatient();
