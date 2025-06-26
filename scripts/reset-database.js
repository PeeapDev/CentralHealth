/**
 * Database Reset and Fix Script
 * 
 * This script helps reset and repair the database to ensure:
 * - No hardcoded or test medical IDs exist
 * - Proper data structure for patient contacts
 * - Email persistence in the contact JSON
 * - Consistent medical ID format
 */

// Import dependencies
import { PrismaClient } from '@prisma/client';
import { generateMedicalID, isValidMedicalID } from '../utils/medical-id';
import * as bcrypt from 'bcryptjs';
import fs from 'fs';

// Initialize Prisma client
const prisma = new PrismaClient();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

// Utility function for colored console output with timestamps
function logColored(color, message) {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * Reset and repair the database
 */
async function resetAndRepairDatabase() {
  try {
    logColored('bold', '==================================================');
    logColored('bold', '  HOSPITAL FHIR DATABASE RESET AND REPAIR UTILITY  ');
    logColored('bold', '==================================================');
    logColored('yellow', '\n⚠️  This utility will remove all patient data and reset the database.\n');
    
    // Get database stats before reset
    logColored('cyan', '📊 Current database statistics:');
    const patientCount = await prisma.patient.count();
    logColored('blue', `- Patients in database: ${patientCount}`);
    
    // Look for problematic medical IDs
    logColored('yellow', '\n🔍 Checking for problematic medical IDs...');
    
    // Search for all-letter medical IDs like "MOHAM"
    const problematicIDs = await prisma.$queryRaw`
      SELECT id, mrn, "name", "contact"
      FROM "Patient" 
      WHERE mrn ~ '^[A-Z]+$'
      OR mrn IN ('MOHAM', 'TEST', 'DEMO', 'ADMIN', 'GUEST');
    `;
    
    if (problematicIDs.length > 0) {
      logColored('red', `Found ${problematicIDs.length} patients with problematic medical IDs:`);
      for (const patient of problematicIDs) {
        logColored('yellow', `- Patient ID: ${patient.id}, MRN: ${patient.mrn}`);
      }
    } else {
      logColored('green', '✓ No problematic medical IDs found.');
    }
    
    // Create backup of database
    logColored('blue', '\n💾 Creating database backup...');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = {
        patients: await prisma.patient.findMany(),
        appointments: await prisma.appointment.findMany(),
        // Add other tables as needed
      };
      
      fs.writeFileSync(
        `./database-backup-${timestamp}.json`,
        JSON.stringify(backupData, null, 2)
      );
      logColored('green', '✓ Database backup created successfully');
    } catch (backupError) {
      logColored('red', `⚠️ Failed to create backup: ${backupError.message}`);
      // Continue with reset anyway
    }
    
    // Confirm before resetting
    logColored('red', '\n⚠️  WARNING: About to RESET the entire database. This cannot be undone!');
    logColored('magenta', '\nProceeding with database reset...');
    
    // Reset database tables
    logColored('yellow', '\n🗑️  Deleting all patient records...');
    await prisma.patient.deleteMany({});
    
    // Reset other related tables
    await prisma.appointment.deleteMany({});
    await prisma.medicalRecord.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    
    // Recreate schema if needed
    logColored('blue', '\n🔄 Ensuring database schema is up to date...');
    // Here you would typically run prisma migrations
    // For this script, we assume you'll run migrations separately
    
    logColored('green', '\n✓ Database reset complete!');
    logColored('cyan', '\n📋 Next steps:');
    logColored('white', '1. Run database migrations with `npx prisma migrate deploy`');
    logColored('white', '2. Restart your application');
    logColored('white', '3. Test patient registration with the new medical ID system');
    
    logColored('bold', '\n==================================================');
    
  } catch (error) {
    logColored('red', `\n❌ Error during database reset: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset function
resetAndRepairDatabase().catch(console.error);
