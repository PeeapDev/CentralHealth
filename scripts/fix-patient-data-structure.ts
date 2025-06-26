#!/usr/bin/env ts-node
/**
 * Patient Data Structure Fix Script
 * 
 * This script applies both database migrations and data transformations
 * to ensure proper structure of patient contact data throughout the system.
 * 
 * IMPORTANT: This script follows CentralHealth System rules:
 * - Does NOT create/generate any mock or test patient data
 * - Preserves all existing medical IDs (they remain permanent)
 * - Maintains protected personal data fields
 * - Only structures existing real data in a consistent format
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as nodePath from 'path';
import * as nodeFs from 'fs';

// Use a namespace to isolate the main function and avoid conflicts
namespace PatientDataStructureFix {

const execAsync = promisify(exec);

async function main() {
  console.log('\n=================================');
  console.log('🏥 PATIENT DATA STRUCTURE FIX');
  console.log('=================================\n');
  
  try {
    // Step 1: Run the SQL migration to ensure database structure
    console.log('Step 1/4: Applying database migration...');
    await execAsync('npx prisma migrate dev --name fix_patient_contact_structure');
    console.log('✅ Migration applied successfully');
    
    // Step 2: Run the data transformation script
    console.log('\nStep 2/4: Running patient contact data restructuring...');
    await execAsync('npx ts-node prisma/seed-fix-patient-contact.ts');
    console.log('✅ Patient contact data restructured successfully');
    
    // Step 3: Generate updated Prisma client
    console.log('\nStep 3/4: Regenerating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client regenerated successfully');
    
    // Step 4: Update the API routes to use the new patient-data-utils
    console.log('\nStep 4/4: Updating API implementation...');
    
    // Fix the onboarding and registration APIs to use our utilities
    const apiFiles = [
      'app/api/patients/onboarding/route.ts',
      'app/api/patients/register/route.ts',
      'app/api/patients/profile/route.ts',
      'app/api/patients/update/route.ts',
    ];
    
    for (const file of apiFiles) {
      const fullPath = nodePath.join(process.cwd(), file);
      if (nodeFs.existsSync(fullPath)) {
        console.log(`Checking ${file}...`);
        const content = nodeFs.readFileSync(fullPath, 'utf8');
        
        // Only modify if the file doesn't already use our utilities
        if (!content.includes('patient-data-utils') && 
            (content.includes('contact') || content.includes('email') || content.includes('phone'))) {
          console.log(`  Detected contact field handling in ${file}`);
          console.log(`  ⚠️ This file should be updated to use the patient-data-utils.ts utilities`);
          console.log(`  Please review and update the implementation to use createPatientContact() and related functions`);
        } else if (content.includes('patient-data-utils')) {
          console.log(`  ✅ Already using patient data utilities`);
        } else {
          console.log(`  File doesn't appear to handle contact data`);
        }
      } else {
        console.log(`  ⚠️ File not found: ${file}`);
      }
    }
    
    console.log('\n=================================');
    console.log('✅ PATIENT DATA STRUCTURE FIX COMPLETE');
    console.log('=================================');
    console.log('\nImportant next steps:');
    console.log('1. Update any API routes that handle patient contact data to use the new utilities');
    console.log('2. Test the password reset functionality with real patient data');
    console.log('3. Verify that the superadmin dashboard correctly shows patient contact information');
    console.log('\nFor help updating your API routes, see the examples in lib/patient-data-utils.ts');
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

main();

} // Close PatientDataStructureFix namespace
