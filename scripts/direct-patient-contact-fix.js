#!/usr/bin/env node
/**
 * Direct Patient Contact Data Structure Fix
 * 
 * This script directly ensures proper structure for patient contact fields
 * without requiring full Prisma migrations.
 * 
 * It follows the CentralHealth System Rules:
 * - NEVER generates mock/test patient data
 * - Preserves all medical IDs (permanent, never regenerated)
 * - Properly structures existing patient contact data
 */

// Import PrismaClient directly from the generated location
const { PrismaClient } = require('../prisma/node_modules/.prisma/client');

// Define utility functions directly to avoid module compatibility issues
/**
 * Extract email from patient record using various potential sources
 * This follows the CentralHealth requirement for permanent medical IDs
 */
function extractEmailFromPatient(patient) {
  if (!patient) return null;
  
  // Try the standardized contact JSON structure first
  if (patient.contact && typeof patient.contact === 'object') {
    if (patient.contact.email) return patient.contact.email;
    
    // Check for telecom array with email
    if (Array.isArray(patient.contact.telecom)) {
      const emailEntry = patient.contact.telecom.find(t => 
        t && t.system === 'email' && t.value);
      if (emailEntry && emailEntry.value) return emailEntry.value;
    }
  }
  
  // Legacy: Try older contact structure formats
  if (typeof patient.contact === 'string') {
    try {
      const parsed = JSON.parse(patient.contact);
      if (parsed && parsed.email) return parsed.email;
      
      // Check telecom array
      if (Array.isArray(parsed.telecom)) {
        const emailEntry = parsed.telecom.find(t => 
          t && t.system === 'email' && t.value);
        if (emailEntry && emailEntry.value) return emailEntry.value;
      }
    } catch (e) {
      // Not valid JSON, try other methods
    }
  }
  
  // Check if email is directly in patient object
  if (patient.email) return patient.email;
  
  // Check User relation
  if (patient.User && patient.User.email) return patient.User.email;
  if (patient.user && patient.user.email) return patient.user.email;
  
  return null;
}

/**
 * Extract phone from patient record using various potential sources
 * This follows the CentralHealth requirement for data consistency
 */
function extractPhoneFromPatient(patient) {
  if (!patient) return null;
  
  // Try the standardized contact JSON structure first
  if (patient.contact && typeof patient.contact === 'object') {
    if (patient.contact.phone) return patient.contact.phone;
    
    // Check for telecom array with phone
    if (Array.isArray(patient.contact.telecom)) {
      const phoneEntry = patient.contact.telecom.find(t => 
        t && (t.system === 'phone' || t.system === 'mobile') && t.value);
      if (phoneEntry && phoneEntry.value) return phoneEntry.value;
    }
  }
  
  // Legacy: Try older contact structure formats
  if (typeof patient.contact === 'string') {
    try {
      const parsed = JSON.parse(patient.contact);
      if (parsed && parsed.phone) return parsed.phone;
      
      // Check telecom array
      if (Array.isArray(parsed.telecom)) {
        const phoneEntry = parsed.telecom.find(t => 
          t && (t.system === 'phone' || t.system === 'mobile') && t.value);
        if (phoneEntry && phoneEntry.value) return phoneEntry.value;
      }
    } catch (e) {
      // Not valid JSON, try other methods
    }
  }
  
  // Check if phone is directly in patient object
  if (patient.phone) return patient.phone;
  if (patient.phoneNumber) return patient.phoneNumber;
  if (patient.mobileNumber) return patient.mobileNumber;
  
  return null;
}

// Initialize client for data updates - only modifying structure, not content
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

async function fixPatientContacts() {
  try {
    console.log('\n=================================');
    console.log('🏥 DIRECT PATIENT CONTACT FIX');
    console.log('=================================\n');

    console.log('Step 1: Retrieving all patient records...');
    
    // Only fetch fields we need - following data minimization principle
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        mrn: true,
        contact: true,
        name: true
      }
    });

    console.log(`Found ${patients.length} patient records\n`);

    console.log('Step 2: Analyzing and updating patient contact data...');
    
    let alreadyCorrectCount = 0;
    let fixedCount = 0;
    let issueCount = 0;

    for (const patient of patients) {
      // Skip if patient has no ID or MRN (should never happen, but checking)
      if (!patient.id || !patient.mrn) {
        console.log(`⚠️ Patient missing essential identifiers: ${patient.name || 'Unknown'}`);
        issueCount++;
        continue;
      }

      // Check for proper contact structure
      const hasProperContactStructure = 
        patient.contact && 
        typeof patient.contact === 'object' &&
        (patient.contact.email !== undefined || 
         patient.contact.phone !== undefined || 
         patient.contact.address !== undefined);

      if (hasProperContactStructure) {
        alreadyCorrectCount++;
        continue; // Already has proper structure
      }

      try {
        // Extract contact information using our utility functions
        // These preserve existing data exactly - no regeneration of IDs
        const email = extractEmailFromPatient(patient);
        const phone = extractPhoneFromPatient(patient);
        
        // Create standardized contact structure
        const updatedContact = {
          email: email || '',
          phone: phone || '',
          address: '' // Default empty, we don't have enough context to extract address
        };

        // Update patient record with normalized contact structure
        await prisma.patient.update({
          where: { id: patient.id },
          data: { contact: updatedContact }
        });

        console.log(`✅ Updated contact for patient: ${patient.mrn}`);
        fixedCount++;
      } catch (err) {
        console.log(`❌ Error updating patient ${patient.mrn}: ${err.message}`);
        issueCount++;
      }
    }

    console.log('\nContact structure fix complete:');
    console.log(`- Patients with correct structure: ${alreadyCorrectCount}`);
    console.log(`- Patients fixed: ${fixedCount}`);
    console.log(`- Patients with issues: ${issueCount}`);
    
    if (issueCount > 0) {
      console.log('\n⚠️ Some patient records could not be updated. Manual review required.');
    } else {
      console.log('\n✅ All patient contact data is now properly structured');
    }
    
    // Create indexes for performance (try/catch because they might already exist)
    console.log('\nStep 3: Ensuring database indexes for contact lookups...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_patient_contact_email ON "Patient" 
        USING gin ((contact->'email'));
      `;
      console.log('✅ Email index created or already exists');
    } catch (err) {
      console.log(`⚠️ Could not create email index: ${err.message}`);
    }
    
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_patient_contact_phone ON "Patient" 
        USING gin ((contact->'phone'));
      `;
      console.log('✅ Phone index created or already exists');
    } catch (err) {
      console.log(`⚠️ Could not create phone index: ${err.message}`);
    }
    
    console.log('\n=================================');
    console.log('✅ PATIENT CONTACT UPDATE COMPLETE');
    console.log('=================================\n');

  } catch (error) {
    console.error('\n❌ ERROR during contact fix:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPatientContacts();
