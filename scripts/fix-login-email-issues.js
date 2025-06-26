/**
 * Fix Login Email Issues Script
 * 
 * This script addresses issues where users can register but can't log in with the same email address.
 * It ensures that emails are consistently stored in the contact JSON field with proper case normalization.
 */

const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables first
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import directly from @prisma/client for standalone scripts
const { PrismaClient } = require('@prisma/client');

// Initialize prisma with the loaded environment variables
const prisma = new PrismaClient();

/**
 * Safe JSON parser that handles both string and object inputs
 */
function safeParseJson(jsonData) {
  if (!jsonData) return {};
  
  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return {};
    }
  } 
  
  return jsonData;
}

/**
 * Normalize an email address for consistent matching
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}

/**
 * Update a patient's contact information with consistent email 
 */
async function updatePatientContact(patient, normalizedEmail) {
  try {
    // Get current contact data
    let contact = safeParseJson(patient.contact);
    const medicalHistory = safeParseJson(patient.medicalHistory);
    
    // Check if we need to update the email
    const currentEmail = normalizeEmail(contact.email);
    let emailUpdated = false;
    
    // Check if email is missing or not normalized in contact
    if (!contact.email || currentEmail !== normalizedEmail) {
      contact.email = normalizedEmail;
      emailUpdated = true;
      console.log(`[Patient ${patient.id}] Updating contact.email to ${normalizedEmail}`);
    }
    
    // Make sure password exists in contact JSON
    let passwordUpdated = false;
    if (!contact.password && medicalHistory && medicalHistory.password) {
      // Move password from medicalHistory to contact
      contact.password = medicalHistory.password;
      passwordUpdated = true;
      console.log(`[Patient ${patient.id}] Moving password from medicalHistory to contact`);
    }
    
    // Hash password if it's plaintext
    if (contact.password && !contact.password.startsWith('$2')) {
      console.log(`[Patient ${patient.id}] Hashing plaintext password`);
      contact.password = await bcrypt.hash(contact.password, 10);
      passwordUpdated = true;
    }
    
    // Update the patient record if changes were made
    if (emailUpdated || passwordUpdated) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          contact: JSON.stringify(contact)
        }
      });
      console.log(`[Patient ${patient.id}] Updated with normalized email and proper password`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating patient ${patient.id}:`, error);
    return false;
  }
}

/**
 * Main function to fix all patient email issues
 */
async function fixAllPatientEmails() {
  console.log('Starting email fix process...');
  let processed = 0;
  let updated = 0;
  let errors = 0;
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        mrn: true,
        contact: true,
        medicalHistory: true,
      }
    });
    
    console.log(`Found ${patients.length} patients to process`);
    
    // Process each patient
    for (const patient of patients) {
      processed++;
      
      try {
        // Get contact data
        const contact = safeParseJson(patient.contact);
        const medicalHistory = safeParseJson(patient.medicalHistory);
        
        // Find all potential email fields
        const potentialEmails = [
          contact.email,
          contact.emailAddress,
          contact.userEmail,
          medicalHistory.email,
          medicalHistory.emailAddress,
          medicalHistory.userEmail
        ].filter(Boolean);
        
        if (potentialEmails.length > 0) {
          // Take first email and normalize it
          const normalizedEmail = normalizeEmail(potentialEmails[0]);
          if (normalizedEmail) {
            // Update patient with consistent email
            const wasUpdated = await updatePatientContact(patient, normalizedEmail);
            if (wasUpdated) updated++;
          }
        }
      } catch (patientError) {
        console.error(`Error processing patient ${patient.id}:`, patientError);
        errors++;
      }
      
      // Log progress
      if (processed % 100 === 0) {
        console.log(`Progress: ${processed}/${patients.length} patients processed`);
      }
    }
    
    console.log(`
Email fix process completed:
- Total patients processed: ${processed}
- Patients updated: ${updated}
- Errors encountered: ${errors}
    `);
  } catch (error) {
    console.error('Fatal error in fixAllPatientEmails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix function
fixAllPatientEmails()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
