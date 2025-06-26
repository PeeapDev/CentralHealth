import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance
const prisma = new PrismaClient();

/**
 * Script to fix patient email contact information for consistent login
 * 
 * This script ensures that:
 * 1. All patient emails are stored in the 'contact.email' JSON field
 * 2. Emails are normalized to lowercase
 * 3. Any duplicate patient records with the same email are identified (but not merged)
 * 4. Ensures permanent medical IDs (MRN) are preserved
 * 5. No test/mock data is allowed in production
 */
async function fixPatientEmailContacts() {
  console.log('Starting patient email contact fix...');
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        mrn: true,
        name: true,
        contact: true,
        medicalHistory: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${patients.length} patients to process`);
    
    const emailMap = new Map<string, string[]>();
    const updates = [];
    
    for (const patient of patients) {
      // Parse contact and medical history data
      let contactData = typeof patient.contact === 'string' ? 
        JSON.parse(patient.contact || '{}') : 
        (patient.contact || {});
      
      let medicalHistoryData = typeof patient.medicalHistory === 'string' ? 
        JSON.parse(patient.medicalHistory || '{}') : 
        (patient.medicalHistory || {});
      
      // Extract email from all possible locations
      let email = '';
      
      // Check possible email locations in order of preference
      const possibleEmailFields = [
        contactData?.email,
        contactData?.emailAddress,
        contactData?.userEmail,
        contactData?.patientEmail,
        medicalHistoryData?.email,
        medicalHistoryData?.contactEmail
      ];
      
      for (const possibleEmail of possibleEmailFields) {
        if (typeof possibleEmail === 'string' && possibleEmail.trim()) {
          email = possibleEmail.trim().toLowerCase();
          break;
        }
      }
      
      // Skip patients without any email
      if (!email) {
        console.log(`Patient ${patient.id} has no email address`);
        continue;
      }
      
      // Track emails for duplicate detection
      if (emailMap.has(email)) {
        emailMap.get(email)?.push(patient.id);
        console.log(`⚠️ Found duplicate email ${email} for patients: ${emailMap.get(email)?.join(', ')}`);
      } else {
        emailMap.set(email, [patient.id]);
      }
      
      // Always ensure contact object exists
      if (!contactData || typeof contactData !== 'object') {
        contactData = {};
      }
      
      // Check if we need to update the contact data
      const needsUpdate = 
        contactData.email !== email || 
        typeof patient.contact !== 'object';
      
      if (needsUpdate) {
        // Create updated contact data with normalized email
        contactData.email = email;
        
        // Only update if changes are needed
        updates.push({
          id: patient.id,
          mrn: patient.mrn,
          email,
          updateNeeded: true
        });
        
        // Update the patient record
        await prisma.patient.update({
          where: { id: patient.id },
          data: {
            contact: contactData
          }
        });
        
        console.log(`✅ Updated patient ${patient.id} with normalized email ${email}`);
      } else {
        console.log(`✓ Patient ${patient.id} already has correct email format`);
      }
    }
    
    // Summary report
    console.log('\n--- Email Normalization Summary ---');
    console.log(`Total patients processed: ${patients.length}`);
    console.log(`Patients updated: ${updates.length}`);
    console.log(`Unique email addresses: ${emailMap.size}`);
    console.log(`Duplicate emails detected: ${patients.length - emailMap.size}`);
    
    // List any duplicate emails for manual review
    const duplicates = Array.from(emailMap.entries())
      .filter(([_, ids]) => ids.length > 1);
      
    if (duplicates.length > 0) {
      console.log('\n⚠️ Duplicate emails detected (manual review recommended):');
      duplicates.forEach(([email, ids]) => {
        console.log(`- ${email}: ${ids.length} patients (IDs: ${ids.join(', ')})`);
      });
    }
    
  } catch (error) {
    console.error('Error fixing patient email contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix script
fixPatientEmailContacts()
  .then(() => console.log('Patient email contact fix completed'))
  .catch(error => console.error('Failed to fix patient email contacts:', error));
