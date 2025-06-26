// Script to update patient records with sample contact information
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all patients
    const patients = await prisma.patient.findMany();
    console.log(`Found ${patients.length} patients in the database`);

    // Update each patient with sample contact information
    for (const patient of patients) {
      // Create sample contact information in FHIR format
      const contactInfo = {
        telecom: [
          {
            system: 'phone',
            value: '+1 (555) 123-4567',
            use: 'mobile'
          },
          {
            system: 'email',
            value: `${patient.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            use: 'work'
          }
        ],
        address: [
          {
            use: 'home',
            line: ['123 Medical Drive'],
            city: 'Healthcare City',
            state: 'HC',
            postalCode: '12345',
            country: 'United States'
          }
        ]
      };

      // Update the patient record
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          contact: contactInfo
        }
      });

      console.log(`Updated contact info for patient: ${patient.name} (${patient.mrn})`);
    }

    console.log('Successfully updated all patient records with contact information');
  } catch (error) {
    console.error('Error updating patient records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
