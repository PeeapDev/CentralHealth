/**
 * Patient Contact Migration Script
 * 
 * This script migrates contact information from the legacy JSON contact field 
 * to the dedicated PatientEmail and PatientPhone tables. This ensures:
 * 
 * 1. Email addresses are properly stored for authentication flows (login, password reset)
 * 2. Phone numbers are accessible for notifications and verification
 * 3. Primary contact methods are properly marked
 * 4. Data can be properly queried without JSON parsing
 * 
 * This migration supports the CentralHealth mandate to maintain accurate patient records
 * while preserving all permanent patient identifiers.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migratePatientContacts() {
  console.log('Starting patient contact migration...');
  
  // Get all patients that might have contact data to migrate
  const patients = await prisma.patient.findMany({
    include: {
      // Include existing emails and phones to avoid duplicates
      Emails: true,
      Phones: true
    }
  });
  
  console.log(`Found ${patients.length} patients to process`);
  
  let migratedEmailCount = 0;
  let migratedPhoneCount = 0;
  let errorCount = 0;

  for (const patient of patients) {
    try {
      // Skip patients without an MRN - medical IDs are mandatory per hospital policy
      if (!patient.mrn) {
        console.warn(`Patient ${patient.id} has no medical ID (MRN), skipping`);
        continue;
      }

      // Process contact field if it exists
      let contactData: any[] = [];
      if (patient.contact) {
        try {
          contactData = typeof patient.contact === 'string' 
            ? JSON.parse(patient.contact)
            : patient.contact;
            
          if (!Array.isArray(contactData)) {
            contactData = [];
            console.warn(`Patient ${patient.mrn}: Contact data is not an array, skipping`);
          }
        } catch (parseError) {
          console.error(`Patient ${patient.mrn}: Failed to parse contact JSON:`, parseError);
          contactData = [];
        }
      }

      // Process emails - following hospital policy to never lose patient data
      const emailEntries = contactData.filter(entry => entry && entry.system === 'email');
      const existingEmails = patient.Emails.map(e => e.email.toLowerCase());
      
      for (const emailEntry of emailEntries) {
        if (!emailEntry.value || !emailEntry.value.includes('@')) {
          continue; // Skip invalid emails
        }
        
        const email = emailEntry.value.toLowerCase().trim();
        
        // Skip if this email is already in the dedicated table
        if (existingEmails.includes(email)) {
          continue;
        }
        
        // Add to the PatientEmail table
        await prisma.patientEmail.create({
          data: {
            patientId: patient.id,
            email: email,
            primary: emailEntry.use === 'primary',
            verified: false // Default to unverified since we're migrating
          }
        });
        
        migratedEmailCount++;
      }
      
      // Process phones - following hospital policy to never lose patient data
      const phoneEntries = contactData.filter(entry => entry && entry.system === 'phone');
      const existingPhones = patient.Phones.map(p => p.phone);
      
      for (const phoneEntry of phoneEntries) {
        if (!phoneEntry.value) {
          continue; // Skip invalid phones
        }
        
        // Normalize phone number by removing non-numeric characters
        const phoneRaw = phoneEntry.value.trim();
        
        // Skip if this phone is already in the dedicated table
        if (existingPhones.includes(phoneRaw)) {
          continue;
        }
        
        // Add to the PatientPhone table
        await prisma.patientPhone.create({
          data: {
            patientId: patient.id,
            phone: phoneRaw,
            type: phoneEntry.use === 'mobile' ? 'mobile' : 'home',
            primary: phoneEntry.use === 'primary',
            verified: false // Default to unverified since we're migrating
          }
        });
        
        migratedPhoneCount++;
      }
      
      // Set a primary email and phone if none exists yet
      if (patient.Emails.length > 0 && !patient.Emails.some(e => e.primary)) {
        await prisma.patientEmail.update({
          where: { id: patient.Emails[0].id },
          data: { primary: true }
        });
      }
      
      if (patient.Phones.length > 0 && !patient.Phones.some(p => p.primary)) {
        await prisma.patientPhone.update({
          where: { id: patient.Phones[0].id },
          data: { primary: true }
        });
      }

    } catch (error) {
      console.error(`Error migrating patient ${patient.mrn || patient.id}:`, error);
      errorCount++;
    }
  }

  // Print summary
  console.log('Migration complete!');
  console.log(`- Migrated ${migratedEmailCount} emails`);
  console.log(`- Migrated ${migratedPhoneCount} phone numbers`);
  console.log(`- Encountered ${errorCount} errors`);
}

// Run the migration
migratePatientContacts()
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma connection
    await prisma.$disconnect();
  });
