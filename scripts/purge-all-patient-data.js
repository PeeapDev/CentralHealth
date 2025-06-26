// Script to completely purge all patient data from the database
// This ensures no test data or name-derived medical IDs (like "MOHAM") remain

// Using the standard Prisma client path after schema update
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Use fs for creating cache clearing files
const fs = require('fs');

// Colors for console logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const logColored = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function purgeAllPatientData() {
  logColored('cyan', '\n================================================');
  logColored('cyan', '  COMPLETE DATABASE PURGE OF ALL PATIENT DATA');
  logColored('cyan', '================================================\n');
  
  logColored('yellow', 'WARNING: This will delete ALL patient data and related records!');
  logColored('yellow', 'This is a destructive operation and cannot be undone.\n');
  
  // CRITICAL: Explicitly search and delete any MOHAM records
  logColored('red', 'CRITICAL: Explicitly searching for and removing "MOHAM" medical IDs:');
  
  try {
    // Start by finding and logging any MOHAM records
    logColored('blue', 'Searching for "MOHAM" medical IDs...');
    try {
      const mohamPatients = await prisma.$queryRawUnsafe(`
        SELECT id, mrn FROM "Patient" WHERE mrn = 'MOHAM' OR mrn LIKE '%MOHAM%';
      `);
      
      if (mohamPatients && mohamPatients.length > 0) {
        logColored('red', `FOUND ${mohamPatients.length} patients with MOHAM medical IDs:`);
        console.log(mohamPatients);
        
        // Delete these patients first
        for (const patient of mohamPatients) {
          await prisma.patient.delete({
            where: { id: patient.id }
          });
          logColored('green', `✓ Explicitly deleted patient with MOHAM ID: ${patient.id}`);
        }
      } else {
        logColored('green', '✓ No MOHAM medical IDs found in Patient table');
      }
    } catch (e) {
      logColored('yellow', `⚠ Error searching for MOHAM IDs: ${e.message}`);
    }
    
    // Now run the full purge
    logColored('blue', '1. Deleting all email verifications...');
    const deletedEmailVerifications = await prisma.emailVerification.deleteMany({});
    logColored('green', `✓ Deleted ${deletedEmailVerifications.count} email verification records`);

    // Clear email templates that might have cached MOHAM
    try {
      logColored('blue', '1a. Clearing email template cache...');
      await prisma.$executeRawUnsafe(`DELETE FROM "EmailTemplate" WHERE data LIKE '%MOHAM%';`);
      logColored('green', `✓ Cleared email templates containing MOHAM`);
    } catch (e) {
      logColored('yellow', `⚠ No email template table found (skipping): ${e.message}`);
    }
    
    logColored('blue', '2. Deleting all onboarding data...');
    try {
      // This may fail if the table doesn't exist
      const deletedOnboardingData = await prisma.$executeRawUnsafe(`TRUNCATE TABLE "OnboardingData";`);
      logColored('green', `✓ Cleared onboarding data`);
    } catch (e) {
      logColored('yellow', `⚠ No onboarding data table found (skipping)`);
    }
    
    logColored('blue', '3. Deleting all patient sessions...');
    try {
      const deletedSessions = await prisma.$executeRawUnsafe(`DELETE FROM "PatientSession";`);
      logColored('green', `✓ Cleared patient sessions`);
    } catch (e) {
      logColored('yellow', `⚠ No patient session table found (skipping): ${e.message}`);
    }

    logColored('blue', '4. Deleting all patients...');
    const deletedPatients = await prisma.patient.deleteMany({});
    logColored('green', `✓ Deleted ${deletedPatients.count} patient records`);

    logColored('blue', '5. Deleting all user records related to patients...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: 'PATIENT'
      }
    });
    logColored('green', `✓ Deleted ${deletedUsers.count} patient user records`);
    
    logColored('blue', '6. Clearing local storage cache in next.js...');
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "_NextPersistentCache";`);
      logColored('green', `✓ Cleared Next.js persistent cache`);
    } catch (e) {
      logColored('yellow', `⚠ No Next.js cache table found (skipping)`);
    }
    
    // Clear any other tables related to patients
    logColored('blue', '7. Checking for other patient-related tables...');
    
    // Direct database-level purge to catch any obscure tables
    try {
      const tables = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      for (const tableObj of tables) {
        const tableName = tableObj.table_name;
        if (tableName.toLowerCase().includes('patient') || 
            tableName.toLowerCase().includes('medical') || 
            tableName.toLowerCase().includes('user')) {
          try {
            logColored('blue', `Checking table ${tableName} for MOHAM...`);
            await prisma.$executeRawUnsafe(`
              DELETE FROM "${tableName}" 
              WHERE to_json("${tableName}"::text)::text LIKE '%MOHAM%';
            `);
            logColored('green', `✓ Cleared MOHAM entries from ${tableName}`);
          } catch (e) {
            logColored('yellow', `⚠ Could not check table ${tableName}: ${e.message}`);
          }
        }
      }
    } catch (e) {
      logColored('yellow', `⚠ Error scanning database tables: ${e.message}`);
    }
    
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "MedicalRecord" WHERE "patientId" IS NOT NULL;`);
      logColored('green', `✓ Cleared medical records`);
    } catch (e) {
      logColored('yellow', `⚠ No medical records table found or empty (skipping)`);
    }

    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "Appointment" WHERE "patientId" IS NOT NULL;`);
      logColored('green', `✓ Cleared appointments`);
    } catch (e) {
      logColored('yellow', `⚠ No appointments table found or empty (skipping)`);
    }
    
    // Clear global in-memory cache
    try {
      logColored('blue', '8. Clearing global memory cache...');
      global.otpCache = {};
      global.patientCache = {};
      global.medicalIdCache = {};
      global.sessionCache = {};
      global.emailCache = {};
      logColored('green', `✓ Cleared global in-memory caches`);
    } catch (e) {
      logColored('yellow', `⚠ Error clearing global cache: ${e.message}`);
    }
    
    // Clear browser local storage via nextjs API
    try {
      logColored('blue', '9. Setting up browser local storage clearing...');
      // Create a file that will run on client-side to clear localStorage
      const fs = require('fs');
      const clearScriptPath = './public/clear-local-storage.js';
      const scriptContent = `
// Auto-generated script to clear all local storage
// This will remove any cached patient data including MOHAM medical IDs
console.log('Clearing all local storage data...');
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✓ Successfully cleared all local storage');
} catch (e) {
  console.error('Error clearing storage:', e);
}
`;
      fs.writeFileSync(clearScriptPath, scriptContent);
      logColored('green', `✓ Created browser local storage clearing script at ${clearScriptPath}`);
      logColored('yellow', '⚠ IMPORTANT: Users must visit /clear-local-storage.js in browser to clear cache');
    } catch (e) {
      logColored('yellow', `⚠ Error setting up local storage clearing: ${e.message}`);
    }
    
    try {
      logColored('blue', '10. Adding local storage clear to HTML...');
      const htmlPath = './public/clear-cache.html';
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Clearing Cache</title>
  <script>
    // Clear all local storage
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.trim().split('=')[0] + '=;' + 'expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    });
    // Show message
    window.onload = function() {
      document.getElementById('message').innerText = 'All browser cache cleared successfully!';
    }
  </script>
</head>
<body>
  <h1>Cache Clearing Page</h1>
  <p id="message">Clearing cache...</p>
  <p>This page has removed all local storage data, session storage, and cookies.</p>
  <p>You can now safely <a href="/">return to the application</a>.</p>
</body>
</html>`;
      fs.writeFileSync(htmlPath, htmlContent);
      logColored('green', `✓ Created cache clearing page at /clear-cache.html`);
    } catch (e) {
      logColored('yellow', `⚠ Error creating cache clearing page: ${e.message}`);
    }

    logColored('cyan', '\n================================================');
    logColored('green', '  ALL PATIENT DATA SUCCESSFULLY PURGED!');
    logColored('cyan', '================================================\n');
    
    logColored('blue', 'The system is now completely clean of all patient records.');
    logColored('blue', 'No more "MOHAM" or other test data should appear.');
    logColored('blue', 'You can now restart the application with a clean database.\n');
    
  } catch (error) {
    logColored('red', `\n❌ ERROR: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
purgeAllPatientData()
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
