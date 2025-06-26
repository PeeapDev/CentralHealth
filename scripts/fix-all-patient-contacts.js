/**
 * Script to fix all patient contact information for email-based login
 * 
 * This script ensures that all patient records have:
 * 1. Normalized email addresses in the contact JSON field
 * 2. Proper password storage in the contact JSON field 
 * 3. Consistent contact structure for UI display and API access
 * 
 * IMPORTANT: This script only normalizes existing patient data structure
 * and NEVER creates any mock or test data. It maintains each patient's existing
 * permanent medical ID (mrn) and only standardizes the contact information.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Initialize Prisma client with direct connection to avoid nextjs context issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Starting patient contact normalization...');
  
  try {
    // Get all patients from the database
    const patients = await prisma.patient.findMany();
    console.log(`Found ${patients.length} total patients to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const patient of patients) {
      try {
        console.log(`\nProcessing patient: ${patient.id} (MRN: ${patient.mrn})`);
        
        // Preserve the permanent medical ID
        const medicalId = patient.mrn;
        if (!medicalId) {
          console.log(`⚠️ Patient ${patient.id} has no medical ID (mrn), skipping...`);
          skippedCount++;
          continue;
        }
        
        // Parse contact data
        let contactData;
        try {
          contactData = typeof patient.contact === 'string' ? 
            JSON.parse(patient.contact) : 
            (patient.contact || {});
        } catch(e) {
          console.log(`Error parsing contact for patient ${patient.id}, initializing empty object`);
          contactData = {};
        }
        
        // Find email from various potential sources
        let email = null;
        let emailSource = '';
        
        // 1. Check contact.email (primary location)
        if (contactData.email && typeof contactData.email === 'string' && contactData.email.includes('@')) {
          email = contactData.email.toLowerCase().trim();
          emailSource = 'contact.email';
        }
        // 2. Check other common contact fields
        else if (contactData.emailAddress && typeof contactData.emailAddress === 'string') {
          email = contactData.emailAddress.toLowerCase().trim();
          emailSource = 'contact.emailAddress';
        }
        // 3. Check patient.email directly
        else if (patient.email && typeof patient.email === 'string') {
          email = patient.email.toLowerCase().trim();
          emailSource = 'patient.email';
        }
        // 4. Check medical history JSON
        else if (patient.medicalHistory) {
          try {
            const medicalData = typeof patient.medicalHistory === 'string' ?
              JSON.parse(patient.medicalHistory) :
              (patient.medicalHistory || {});
              
            // Check common fields in medical history
            for (const field of ['email', 'contactEmail', 'patientEmail']) {
              if (medicalData[field] && typeof medicalData[field] === 'string' && medicalData[field].includes('@')) {
                email = medicalData[field].toLowerCase().trim();
                emailSource = `medicalHistory.${field}`;
                break;
              }
            }
          } catch (e) {
            console.log(`Error parsing medicalHistory for patient ${patient.id}`);
          }
        }
        
        // 5. Look for email pattern in all JSON fields as last resort
        if (!email) {
          // Convert any objects to string and look for email pattern
          const patientStr = JSON.stringify(patient);
          const emailMatch = patientStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            email = emailMatch[0].toLowerCase().trim();
            emailSource = 'pattern_match';
          }
        }
        
        if (!email) {
          console.log(`⚠️ No email found for patient ${patient.id}, skipping...`);
          skippedCount++;
          continue;
        }
        
        console.log(`Found email from ${emailSource}: ${email}`);
        
        // Find password or hash one if necessary
        let password = null;
        let passwordSource = '';
        let isHashed = false;
        
        // 1. Check contact.password (preferred location)
        if (contactData.password && typeof contactData.password === 'string') {
          password = contactData.password;
          passwordSource = 'contact.password';
          // Check if already hashed
          isHashed = password.startsWith('$2a$') || password.startsWith('$2b$');
        }
        // 2. Check medical history for password
        else if (patient.medicalHistory) {
          try {
            const medicalData = typeof patient.medicalHistory === 'string' ?
              JSON.parse(patient.medicalHistory) :
              (patient.medicalHistory || {});
              
            if (medicalData.password && typeof medicalData.password === 'string') {
              password = medicalData.password;
              passwordSource = 'medicalHistory.password';
              isHashed = password.startsWith('$2a$') || password.startsWith('$2b$');
            }
          } catch (e) {
            console.log(`Error checking medicalHistory for password: ${patient.id}`);
          }
        }
        
        // If no password found, create a temporary secure one based on their ID
        if (!password) {
          // We'll use a secure hash of their medical ID
          const tempPassword = await bcrypt.hash(medicalId, 10);
          password = tempPassword;
          passwordSource = 'generated';
          isHashed = true;
          console.log(`Created secure password hash for patient ${patient.id}`);
        } else if (!isHashed) {
          // Hash the password if it's not already hashed
          const hashedPassword = await bcrypt.hash(password, 10);
          password = hashedPassword;
          passwordSource = passwordSource + '_hashed';
          isHashed = true;
          console.log(`Hashed existing password from ${passwordSource}`);
        }
        
        // Create normalized contact structure
        const normalizedContact = {
          ...contactData,
          email: email,
          password: password
        };
        
        // Update the patient record with normalized data
        await prisma.patient.update({
          where: { id: patient.id },
          data: {
            contact: normalizedContact
          }
        });
        
        console.log(`✅ Successfully normalized contact data for patient ${patient.id}`);
        updatedCount++;
        
      } catch (patientError) {
        console.error(`Error processing patient ${patient.id}:`, patientError);
        errorCount++;
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total patients: ${patients.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('================');
    
  } catch (error) {
    console.error('Fatal error in normalization process:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Run the script
main()
  .then(() => {
    console.log('Patient email normalization completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed with error:', err);
    process.exit(1);
  });
