// Direct script to purge MOHAM and all test patient data
// Uses the project's database connection to ensure compatibility

const { Client } = require('pg');
require('dotenv').config();

// Colors for console logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const logColored = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function purgeAllPatients() {
  logColored('cyan', '\n====================================================');
  logColored('cyan', '  CRITICAL DATABASE PURGE: REMOVING ALL TEST DATA');
  logColored('cyan', '====================================================\n');
  
  // Connect directly to the database using connection string from .env
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    logColored('green', '✓ Connected to database');
    
    // First check for and report any MOHAM records
    logColored('blue', '\n1. Checking for "MOHAM" medical IDs...');
    
    const mohamCheck = await client.query(`
      SELECT id, mrn FROM "Patient" WHERE mrn = 'MOHAM' OR mrn LIKE '%MOHAM%';
    `);
    
    if (mohamCheck.rows.length > 0) {
      logColored('red', `! FOUND ${mohamCheck.rows.length} patients with MOHAM medical IDs!`);
      console.log(mohamCheck.rows);
      
      // Delete these explicitly 
      logColored('red', '\nDELETING ALL MOHAM RECORDS:');
      await client.query(`DELETE FROM "Patient" WHERE mrn = 'MOHAM' OR mrn LIKE '%MOHAM%';`);
      logColored('green', '✓ Deleted all MOHAM records');
    } else {
      logColored('green', '✓ No MOHAM medical IDs found');
    }
    
    // Now perform the complete purge of all patient data
    logColored('blue', '\n2. Deleting all email verification data...');
    try {
      const emailRes = await client.query(`DELETE FROM "EmailVerification";`);
      logColored('green', `✓ Cleared email verification data`);
    } catch (e) {
      logColored('yellow', `⚠ Error clearing email data: ${e.message}`);
    }
    
    logColored('blue', '\n3. Clearing patient sessions...');
    try {
      await client.query(`DELETE FROM "PatientSession";`);
      logColored('green', `✓ Cleared patient sessions`);
    } catch (e) {
      logColored('yellow', `⚠ No patient session table or error: ${e.message}`);
    }

    logColored('blue', '\n4. Clearing appointments...');
    try {
      await client.query(`DELETE FROM "Appointment" WHERE "patientId" IS NOT NULL;`);
      logColored('green', `✓ Cleared appointments`);
    } catch (e) {
      logColored('yellow', `⚠ No appointments table or error: ${e.message}`);
    }
    
    logColored('blue', '\n5. Clearing medical records...');
    try {
      await client.query(`DELETE FROM "MedicalRecord" WHERE "patientId" IS NOT NULL;`);
      logColored('green', `✓ Cleared medical records`);
    } catch (e) {
      logColored('yellow', `⚠ No medical records table or error: ${e.message}`);
    }

    logColored('blue', '\n6. Purging ALL patient data...');
    try {
      const patientRes = await client.query(`DELETE FROM "Patient";`);
      logColored('green', `✓ Purged all patient records`);
    } catch (e) {
      logColored('red', `❌ Error clearing patient data: ${e.message}`);
    }
    
    logColored('blue', '\n7. Removing patient users...');
    try {
      const userRes = await client.query(`DELETE FROM "User" WHERE role = 'PATIENT';`);
      logColored('green', `✓ Removed all patient users`);
    } catch (e) {
      logColored('red', `❌ Error clearing users: ${e.message}`);
    }
    
    // Create browser clearCache.html file
    try {
      logColored('blue', '\n8. Creating browser cache clearing file...');
      const fs = require('fs');
      const path = require('path');
      const clearCachePath = path.join(__dirname, '..', 'public', 'clear-cache.html');
      
      const clearCacheContent = `<!DOCTYPE html>
<html>
<head>
  <title>Clearing Cache</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #0070f3; }
    .success { color: #00a550; font-weight: bold; }
    .box {
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
      background: #f9f9f9;
    }
  </style>
  <script>
    function clearAllStorage() {
      // Clear localStorage
      localStorage.clear();
      document.getElementById('localStorage').textContent = '✓ Cleared';
      
      // Clear sessionStorage
      sessionStorage.clear();
      document.getElementById('sessionStorage').textContent = '✓ Cleared';
      
      // Clear cookies
      document.cookie.split(';').forEach(function(c) {
        document.cookie = c.trim().split('=')[0] + '=;' + 'expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });
      document.getElementById('cookies').textContent = '✓ Cleared';
      
      document.getElementById('clearBtn').disabled = true;
      document.getElementById('message').className = 'success';
      document.getElementById('message').textContent = 'All browser storage successfully cleared!';
    }
  </script>
</head>
<body>
  <h1>Cache Clearing Page</h1>
  <p id="message">Click the button below to clear all browser storage.</p>
  
  <div class="box">
    <h3>Storage Status:</h3>
    <p><strong>LocalStorage:</strong> <span id="localStorage">Pending</span></p>
    <p><strong>SessionStorage:</strong> <span id="sessionStorage">Pending</span></p>
    <p><strong>Cookies:</strong> <span id="cookies">Pending</span></p>
    <button id="clearBtn" onclick="clearAllStorage()">Clear All Browser Storage</button>
  </div>
  
  <p>After clearing the cache, you can <a href="/">return to the application</a>.</p>
  <p><em>This will ensure no test data remains in your browser storage.</em></p>
</body>
</html>`;

      fs.writeFileSync(clearCachePath, clearCacheContent);
      logColored('green', `✓ Created browser cache clearing page at /clear-cache.html`);
      logColored('yellow', '⚠ IMPORTANT: Users should visit /clear-cache.html to clear browser storage');
    } catch (e) {
      logColored('yellow', `⚠ Error creating cache page: ${e.message}`);
    }
    
    // Verify no MOHAM remains
    const finalCheck = await client.query(`
      SELECT COUNT(*) FROM "Patient" WHERE mrn = 'MOHAM' OR mrn LIKE '%MOHAM%';
    `);
    
    if (parseInt(finalCheck.rows[0].count) === 0) {
      logColored('cyan', '\n=====================================================');
      logColored('green', '  SUCCESS: ALL PATIENT DATA AND MOHAM IDs REMOVED!');
      logColored('cyan', '=====================================================\n');
    } else {
      logColored('red', '\n! WARNING: Some MOHAM records may still exist !');
    }
    
    logColored('green', '✓ Database purge completed successfully');
    logColored('yellow', '\nIMPORTANT NEXT STEPS:');
    logColored('yellow', '1. Restart your application server');
    logColored('yellow', '2. Clear your browser cache by visiting /clear-cache.html');
    logColored('yellow', '3. The system should now be free of all test data\n');
    
  } catch (e) {
    logColored('red', `\n❌ ERROR: ${e.message}`);
    console.error(e);
  } finally {
    await client.end();
  }
}

// Execute the purge
purgeAllPatients().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
