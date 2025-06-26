/**
 * Script to fix patient contact information display issues
 * 
 * This script directly updates the patient records to ensure contact information
 * is properly stored in a standardized format that will display correctly.
 * 
 * IMPORTANT: This script only updates the structure of existing patient data
 * and NEVER creates any mock or test data. It maintains the patient's existing
 * permanent medical ID and only standardizes the contact information format.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get patient ID from command line arguments
  const patientId = process.argv[2];
  
  if (!patientId) {
    console.error('Error: Patient ID is required');
    console.log('Usage: npx ts-node scripts/fix-contact-data.ts <patientId>');
    process.exit(1);
  }

  console.log(`Fixing contact data structure for patient with ID: ${patientId}`);
  
  try {
    // Find the patient using their permanent medical ID
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: patientId },
          { mrn: patientId } // NHS-style medical ID field
        ]
      },
      include: {
        User: true
      }
    });

    if (!patient) {
      console.error(`Error: Patient not found with ID: ${patientId}`);
      process.exit(1);
    }

    console.log(`Found patient record: ${patient.id}`);
    
    // Get actual email from patient record or related user
    let actualEmail = '';
    if (patient.email) {
      actualEmail = patient.email;
      console.log(`Using existing email from patient record: ${actualEmail}`);
    } else if (patient.User?.email) {
      actualEmail = patient.User.email;
      console.log(`Using email from User relation: ${actualEmail}`);
    }
    
    // Get actual phone from patient record
    let actualPhone = patient.phone || '';
    console.log(`Using existing phone from patient record: ${actualPhone}`);
    
    // Get existing contact data
    let contactData: Record<string, any> = {};
    if (patient.contact) {
      try {
        if (typeof patient.contact === 'string') {
          contactData = JSON.parse(patient.contact);
        } else {
          contactData = patient.contact as Record<string, any>;
        }
      } catch (e) {
        console.log('Error parsing existing contact data:', e);
        contactData = {};
      }
    }
    
    // Create a standardized contact object preserving existing data
    const contactObject = {
      email: actualEmail || contactData.email || '',
      phone: actualPhone || contactData.phone || '',
      address: contactData.address || ''
    };
    
    // Stringify for database storage
    const contactJson = JSON.stringify(contactObject);
    
    console.log('Standardized contact structure:', contactObject);
    
    // Update the patient with standardized contact structure
    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        email: contactObject.email,
        phone: contactObject.phone,
        contact: contactJson
      }
    });
    
    console.log('Patient contact data structure standardized successfully:');
    console.log({
      id: updated.id,
      mrn: updated.mrn, // Permanent medical ID
      email: updated.email,
      phone: updated.phone,
      contact: updated.contact
    });
    
  } catch (error) {
    console.error('Error updating patient contact structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
