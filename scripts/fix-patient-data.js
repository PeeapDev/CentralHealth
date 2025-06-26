#!/usr/bin/env node
/**
 * Patient Data Structure Fix Script
 * 
 * This script runs the Prisma migration and seeder to fix patient contact data structure.
 * 
 * IMPORTANT: This script follows CentralHealth System rules:
 * - Does NOT create/generate any mock or test patient data
 * - Preserves all existing medical IDs (they remain permanent)
 * - Maintains protected personal data fields
 * - Only structures existing real data in a consistent format
 */

const { execSync } = require('child_process');
const path = require('path');

function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    return false;
  }
}

// Main function
function main() {
  console.log('\n=================================');
  console.log('🏥 PATIENT DATA STRUCTURE FIX');
  console.log('=================================\n');
  
  // Step 1: Apply the migration
  console.log('Step 1/3: Applying database migration...');
  if (runCommand('npx prisma migrate dev --name fix_patient_contact_structure')) {
    console.log('✅ Migration applied successfully');
  } else {
    console.error('❌ Migration failed');
    process.exit(1);
  }
  
  // Step 2: Run the data transformation script
  console.log('\nStep 2/3: Running patient contact data restructuring...');
  if (runCommand('npx ts-node prisma/seed-fix-patient-contact.ts')) {
    console.log('✅ Patient contact data restructured successfully');
  } else {
    console.error('❌ Data restructuring failed');
    process.exit(1);
  }
  
  // Step 3: Generate updated Prisma client
  console.log('\nStep 3/3: Regenerating Prisma client...');
  if (runCommand('npx prisma generate')) {
    console.log('✅ Prisma client regenerated successfully');
  } else {
    console.error('❌ Failed to regenerate Prisma client');
    process.exit(1);
  }
  
  console.log('\n=================================');
  console.log('✅ PATIENT DATA STRUCTURE FIX COMPLETE');
  console.log('=================================');
  console.log('\nImportant next steps:');
  console.log('1. Verify patient contact data structure is correct in the database');
  console.log('2. Check that password reset functionality works properly');
  console.log('3. Confirm that the superadmin dashboard displays patient contact information correctly');
}

// Run the main function
main();
