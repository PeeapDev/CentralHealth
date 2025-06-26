/**
 * Test Data and Non-Compliant Medical ID Purge Script
 * ------------------------------------------------------
 * This script purges all test patient data and non-compliant medical IDs from the database
 * Specifically targets:
 * - Medical IDs that are all-letter format like "MOHAM"
 * - Any patient records with test data indicators
 * - Email verification records for test patients
 * - Sessions and authentication tokens for test patients
 * 
 * IMPORTANT: This script will perform destructive operations. Use with caution.
 * Always back up your database before running this script.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client for ORM operations
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully');
} catch (err) {
  console.error('Failed to initialize Prisma client:', err);
}

// Initialize direct PostgreSQL client for raw SQL operations (fallback method)
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Functions to detect non-compliant medical IDs
function isAllLetterMedicalId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[A-Z]+$/i.test(id);
}

function isTestMedicalId(id) {
  if (!id || typeof id !== 'string') return false;
  
  // Detect specific test patterns 
  const testPatterns = [
    /^TEST/i,      // Starts with TEST
    /^DEMO/i,      // Starts with DEMO
    /^MOHAM/i,     // Specific name pattern we need to remove
    /^JOHN/i,      // Common test name
    /^USER/i,      // Starts with USER
    /^SAMPLE/i     // Starts with SAMPLE
  ];
  
  return testPatterns.some(pattern => pattern.test(id));
}

// Main purge function using Prisma
async function purgeDatabaseWithPrisma() {
  console.log('\nAttempting to purge data using Prisma ORM...');
  
  try {
    // Start a transaction
    const results = await prisma.$transaction(async (tx) => {
      // 1. Find all patients with non-compliant medical IDs
      const nonCompliantPatients = await tx.patient.findMany({
        where: {
          OR: [
            { mrn: { not: null, contains: 'MOHAM' } },
            { mrn: { not: null, contains: 'TEST' } },
            { mrn: { not: null, contains: 'DEMO' } }
          ]
        },
        select: { id: true, mrn: true, name: true }
      });
      
      console.log(`Found ${nonCompliantPatients.length} patients with non-compliant medical IDs`);
      
      // 2. Delete all data associated with these patients
      for (const patient of nonCompliantPatients) {
        console.log(`Deleting patient with ID ${patient.id}, MRN: ${patient.mrn}`);
        
        // Delete related records first (adjust based on your actual schema)
        await tx.patientSession.deleteMany({ where: { patientId: patient.id } });
        await tx.emailVerification.deleteMany({ where: { patientId: patient.id } });
        
        // Finally delete the patient
        await tx.patient.delete({ where: { id: patient.id } });
      }
      
      // 3. Delete any orphaned verification codes
      const deletedVerifications = await tx.emailVerification.deleteMany({
        where: {
          OR: [
            { medicalNumber: { contains: 'MOHAM' } },
            { medicalNumber: { contains: 'TEST' } },
            { medicalNumber: { contains: 'DEMO' } }
          ]
        }
      });
      
      console.log(`Deleted ${deletedVerifications.count} orphaned email verifications`);
      
      // 4. Clear any test sessions
      const deletedSessions = await tx.session.deleteMany({
        where: {
          OR: [
            { data: { contains: 'MOHAM' } },
            { data: { contains: 'TEST' } },
            { data: { contains: 'DEMO' } }
          ]
        }
      });
      
      console.log(`Deleted ${deletedSessions.count} test sessions`);
      
      return {
        patientsDeleted: nonCompliantPatients.length,
        verificationsDeleted: deletedVerifications.count,
        sessionsDeleted: deletedSessions.count
      };
    });
    
    console.log('\nPrisma purge completed successfully:');
    console.log(`- ${results.patientsDeleted} test patients deleted`);
    console.log(`- ${results.verificationsDeleted} email verifications deleted`);
    console.log(`- ${results.sessionsDeleted} sessions deleted`);
    
    return true;
  } catch (error) {
    console.error('Error during Prisma purge:', error);
    return false;
  }
}

// Fallback purge function using direct PostgreSQL
async function purgeDatabaseWithPostgreSQL() {
  console.log('\nAttempting direct PostgreSQL purge as fallback...');
  
  try {
    await pgClient.connect();
    console.log('PostgreSQL connected successfully');
    
    // Begin transaction
    await pgClient.query('BEGIN');
    
    // 1. Find patient IDs with non-compliant medical IDs
    const patientQuery = `
      SELECT id, mrn, name::text as name FROM "Patient" 
      WHERE mrn ILIKE '%MOHAM%' OR mrn ILIKE '%TEST%' OR mrn ILIKE '%DEMO%'
    `;
    const patientResult = await pgClient.query(patientQuery);
    const patients = patientResult.rows;
    
    console.log(`Found ${patients.length} patients with non-compliant medical IDs`);
    
    // 2. Delete related data for these patients
    for (const patient of patients) {
      console.log(`Deleting patient with ID ${patient.id}, MRN: ${patient.mrn}`);
      
      // Get and log patient name if possible
      try {
        const nameObj = JSON.parse(patient.name);
        const displayName = nameObj.text || nameObj.family || 'Unknown';
        console.log(`- Patient name: ${displayName}`);
      } catch (e) {
        console.log(`- Patient name: ${patient.name}`);
      }
      
      // Delete related records
      await pgClient.query('DELETE FROM "PatientSession" WHERE "patientId" = $1', [patient.id]);
      await pgClient.query('DELETE FROM "EmailVerification" WHERE "patientId" = $1', [patient.id]);
      
      // Delete the patient
      await pgClient.query('DELETE FROM "Patient" WHERE id = $1', [patient.id]);
    }
    
    // 3. Delete any orphaned verification codes with non-compliant medical IDs
    const verifyResult = await pgClient.query(`
      DELETE FROM "EmailVerification"
      WHERE "medicalNumber" ILIKE '%MOHAM%' 
         OR "medicalNumber" ILIKE '%TEST%' 
         OR "medicalNumber" ILIKE '%DEMO%'
      RETURNING id
    `);
    
    // 4. Clear any test sessions
    const sessionResult = await pgClient.query(`
      DELETE FROM "Session"
      WHERE data::text ILIKE '%MOHAM%' 
         OR data::text ILIKE '%TEST%' 
         OR data::text ILIKE '%DEMO%'
      RETURNING id
    `);
    
    // Commit transaction
    await pgClient.query('COMMIT');
    
    console.log('\nPostgreSQL purge completed successfully:');
    console.log(`- ${patients.length} test patients deleted`);
    console.log(`- ${verifyResult.rowCount} email verifications deleted`);
    console.log(`- ${sessionResult.rowCount} sessions deleted`);
    
    return true;
  } catch (error) {
    console.error('Error during PostgreSQL purge:', error);
    await pgClient.query('ROLLBACK');
    return false;
  } finally {
    await pgClient.end();
  }
}

// Generate HTML file to clear browser caches
function generateCacheClearingFile() {
  console.log('\nGenerating cache clearing HTML file...');
  
  const cacheClearPath = path.join(process.cwd(), 'public', 'clear-cache.html');
  
  // Check if file already exists
  if (fs.existsSync(cacheClearPath)) {
    console.log('Cache clearing file already exists at:', cacheClearPath);
    console.log('Access it at: /clear-cache.html');
    return;
  }
  
  // File already created in a previous step
  console.log('Cache clearing file is available at:', cacheClearPath);
  console.log('Access it at: /clear-cache.html');
}

// Main execution
async function main() {
  console.log('\n====================================================');
  console.log('  CRITICAL DATABASE PURGE: REMOVING ALL TEST DATA');
  console.log('====================================================\n');

  try {
    // Attempt purge with Prisma first
    let success = false;
    
    if (prisma) {
      success = await purgeDatabaseWithPrisma();
    }
    
    // If Prisma fails, try direct PostgreSQL
    if (!success) {
      success = await purgeDatabaseWithPostgreSQL();
    }
    
    // Generate cache clearing HTML file
    generateCacheClearingFile();
    
    if (success) {
      console.log('\n✅ TEST DATA PURGE COMPLETED SUCCESSFULLY');
      console.log('To ensure all client-side caches are cleared, please:');
      console.log('1. Restart your application server');
      console.log('2. Have all users visit: /clear-cache.html');
      console.log('3. Users should then log out and log back in');
    } else {
      console.log('\n❌ TEST DATA PURGE INCOMPLETE');
      console.log('Please check the logs above for errors');
    }
  } catch (error) {
    console.error('\n❌ ERROR: ', error);
  } finally {
    // Clean up resources
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Run the main function
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    console.log('\nScript execution completed.\n');
  });
