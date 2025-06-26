// Script to normalize patient email storage to ensure login works properly
// This fixes issues with inconsistent email storage in the contact JSON field

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalizePatientEmails() {
  console.log('Starting patient email normalization...');
  
  try {
    // Get all patients from the database
    const patients = await prisma.patient.findMany();
    console.log(`Found ${patients.length} total patients`);
    
    let updatedCount = 0;
    
    for (const patient of patients) {
      let updated = false;
      let contactData;
      
      // Parse contact data
      try {
        contactData = typeof patient.contact === 'string' ? 
          JSON.parse(patient.contact) : 
          (patient.contact || {});
      } catch(e) {
        console.error(`Error parsing contact for patient ${patient.id}:`, e);
        contactData = {};
      }
      
      // Find email in various locations
      let email = null;
      
      // Check potential email locations in contact object
      const emailFields = ['email', 'emailAddress', 'userEmail', 'patientEmail'];
      
      for (const field of emailFields) {
        if (contactData[field] && typeof contactData[field] === 'string' && contactData[field].includes('@')) {
          email = contactData[field].toLowerCase().trim();
          if (field !== 'email') {
            console.log(`Patient ${patient.id}: Found email in ${field} field: ${email}`);
            updated = true;
          }
          break;
        }
      }
      
      // If no email found in contact, check if it might be in a nested object
      if (!email) {
        // Convert to string and look for email pattern
        const contactStr = JSON.stringify(contactData);
        const emailMatch = contactStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          email = emailMatch[0].toLowerCase().trim();
          console.log(`Patient ${patient.id}: Found email in nested object: ${email}`);
          updated = true;
        }
      }
      
      // If we still have no email, check the medical history
      if (!email && patient.medicalHistory) {
        try {
          const medicalData = typeof patient.medicalHistory === 'string' ?
            JSON.parse(patient.medicalHistory) :
            (patient.medicalHistory || {});
            
          // Look for email in medical history
          for (const field of ['email', 'contactEmail', 'patientEmail']) {
            if (medicalData[field] && typeof medicalData[field] === 'string' && medicalData[field].includes('@')) {
              email = medicalData[field].toLowerCase().trim();
              console.log(`Patient ${patient.id}: Found email in medicalHistory.${field}: ${email}`);
              updated = true;
              break;
            }
          }
        } catch (e) {
          console.error(`Error parsing medicalHistory for patient ${patient.id}:`, e);
        }
      }
      
      // If we found an email, ensure it's stored properly in contact.email
      if (email) {
        // Normalize the existing contact data structure
        if (!contactData.email || contactData.email !== email) {
          contactData.email = email;
          updated = true;
        }
        
        // Save updated contact data if anything changed
        if (updated) {
          try {
            await prisma.patient.update({
              where: { id: patient.id },
              data: { contact: contactData }
            });
            console.log(`Updated patient ${patient.id} with normalized email: ${email}`);
            updatedCount++;
          } catch(e) {
            console.error(`Failed to update patient ${patient.id}:`, e);
          }
        }
      } else {
        console.log(`Patient ${patient.id} has no email address`);
      }
    }
    
    console.log(`\nNormalization complete: Updated ${updatedCount} out of ${patients.length} patients`);
  } catch (error) {
    console.error('Error in email normalization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the normalization function
normalizePatientEmails()
  .then(() => console.log('Email normalization process complete'))
  .catch(e => console.error('Normalization process failed:', e));
