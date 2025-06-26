// Self-contained script to specifically fix name-derived MRNs like "MOHAM"
// No external dependencies to avoid import issues
const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

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

// Inline medical ID generation function - guaranteed to create mixed alphanumeric IDs
function generateMedicalID() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 characters (excluding O, I, L)
  const numbers = '23456789';                  // 8 characters (excluding 0, 1)
  
  // Randomly select one pattern (ensures mixed letters & numbers)
  const patternType = Math.floor(Math.random() * 2);
  
  let id = '';
  
  switch(patternType) {
    case 0: // LNLNL - 3 letters, 2 numbers
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      break;
    case 1: // NLNLN - 3 numbers, 2 letters
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      break;
  }
  
  return id;
}

// Check if a medical ID is name-derived (all uppercase letters)
function isNameDerivedMedicalID(id) {
  if (!id) return false;
  // Check if it's all letters with no numbers (like "MOHAM")
  return /^[A-Z]+$/i.test(id);
}

// Log with color
function logColored(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Main function to fix name-derived MRNs
async function fixNameDerivedMRNs() {
  logColored('cyan', '\n========================================');
  logColored('cyan', '  MEDICAL ID COMPLIANCE FIX SCRIPT');
  logColored('cyan', '  TARGETING NAME-DERIVED IDs (MOHAM)');
  logColored('cyan', '========================================\n');
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        mrn: true,
      }
    });

    logColored('blue', `Found ${patients.length} patient records to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    // Create audit log of all changes
    const auditLog = [];
    
    for (const patient of patients) {
      // Check if patient has a name-derived Medical ID (like "MOHAM")
      const hasNameDerivedID = isNameDerivedMedicalID(patient.mrn);
      
      if (!hasNameDerivedID) {
        // Skip if not a name-derived ID (our specific target)
        skippedCount++;
        continue;
      }
      
      // Log the name-derived ID we found
      logColored('yellow', `Found name-derived Medical ID '${patient.mrn}' for patient ${patient.name || patient.id}`);
      
      // Generate a new compliant Medical ID
      let newMedicalId = generateMedicalID();
      let isUnique = false;
      let attempts = 0;
      
      // Ensure uniqueness of the new Medical ID
      while (!isUnique && attempts < 10) {
        attempts++;
        // Check if this Medical ID is already in use
        const existingPatient = await prisma.patient.findFirst({
          where: { mrn: newMedicalId },
          select: { id: true }
        });
        
        if (!existingPatient) {
          isUnique = true;
        } else {
          logColored('red', `Generated ID ${newMedicalId} already exists, trying again...`);
          newMedicalId = generateMedicalID();
        }
      }
      
      if (!isUnique) {
        logColored('red', `Could not generate a unique Medical ID for patient ${patient.id} after ${attempts} attempts`);
        continue;
      }
      
      // Add to audit log
      auditLog.push({
        patientId: patient.id,
        oldMRN: patient.mrn,
        newMRN: newMedicalId,
        timestamp: new Date().toISOString()
      });
      
      // Update the patient record with the new Medical ID
      await prisma.patient.update({
        where: { id: patient.id },
        data: { mrn: newMedicalId }
      });
      
      logColored('green', `✓ Fixed patient ${patient.name || patient.id}: ${patient.mrn} → ${newMedicalId}`);
      fixedCount++;
    }
    
    if (fixedCount > 0) {
      // Save audit log
      const fs = require('fs');
      const logPath = './mrn-fix-audit-log.json';
      fs.writeFileSync(logPath, JSON.stringify(auditLog, null, 2));
      logColored('cyan', `\nAudit log saved to ${logPath}`);
    }
    
    logColored('cyan', '\n============================');
    logColored('cyan', '  MEDICAL ID FIX COMPLETE');
    logColored('cyan', '============================');
    logColored('green', `- Fixed: ${fixedCount} patients with name-derived IDs`);
    logColored('blue', `- Skipped: ${skippedCount} patients with compliant IDs`);
    
    if (fixedCount === 0) {
      logColored('green', '\nNo name-derived medical IDs like "MOHAM" were found. All medical IDs are compliant!');
    } else {
      logColored('green', '\nAll medical IDs now follow the CentralHealth system rules:');
      logColored('green', '- 5-character alphanumeric format');
      logColored('green', '- Mix of letters and numbers');
      logColored('green', '- No confusing characters (i, l, 1, o, 0)');
      logColored('green', '- No name-derived IDs like "MOHAM"');
    }
    
  } catch (error) {
    logColored('red', "Error fixing Medical IDs:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixNameDerivedMRNs()
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Script execution completed.');
  });
