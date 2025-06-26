// Script to verify all medical IDs in the database
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

// Log with color
function logColored(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyMedicalIDs() {
  logColored('cyan', '\n========================================');
  logColored('cyan', '  MEDICAL ID VERIFICATION REPORT');
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

    logColored('blue', `Found ${patients.length} patient records to check\n`);
    
    logColored('cyan', 'MEDICAL ID SUMMARY:');
    logColored('cyan', '------------------------');
    
    // Group and analyze medical IDs
    const mrnCounts = {};
    const mrnPatterns = {
      nameDerived: [],
      validMixed: [],
      tooShort: [],
      tooLong: [],
      null: [],
      other: []
    };
    
    patients.forEach(patient => {
      const mrn = patient.mrn;
      
      // Count unique MRNs
      if (mrn) {
        mrnCounts[mrn] = (mrnCounts[mrn] || 0) + 1;
      }
      
      // Categorize MRN patterns
      if (!mrn) {
        mrnPatterns.null.push(patient);
      } else if (mrn.length !== 5) {
        if (mrn.length < 5) {
          mrnPatterns.tooShort.push(patient);
        } else {
          mrnPatterns.tooLong.push(patient);
        }
      } else if (/^[A-Z]+$/i.test(mrn)) {
        mrnPatterns.nameDerived.push(patient);
      } else if (/^[A-Z0-9]*$/i.test(mrn) && /[A-Z]/i.test(mrn) && /[0-9]/.test(mrn)) {
        mrnPatterns.validMixed.push(patient);
      } else {
        mrnPatterns.other.push(patient);
      }
    });
    
    // Report findings
    logColored('blue', `Total unique MRNs: ${Object.keys(mrnCounts).length}`);
    
    const duplicateMRNs = Object.entries(mrnCounts)
      .filter(([mrn, count]) => count > 1)
      .map(([mrn, count]) => ({ mrn, count }));
    
    if (duplicateMRNs.length > 0) {
      logColored('red', `\nWARNING: Found ${duplicateMRNs.length} duplicate MRNs:`);
      duplicateMRNs.forEach(dup => {
        logColored('yellow', `  - MRN "${dup.mrn}" is used by ${dup.count} patients`);
      });
    } else {
      logColored('green', `\nNo duplicate MRNs found (good)`);
    }
    
    // Report MRN pattern findings
    logColored('cyan', '\nMEDICAL ID FORMAT ANALYSIS:');
    logColored('cyan', '------------------------');
    
    logColored('green', `Valid mixed alphanumeric IDs (5 chars): ${mrnPatterns.validMixed.length}`);
    
    if (mrnPatterns.nameDerived.length > 0) {
      logColored('red', `\n⚠️ Name-derived IDs (like "MOHAM"): ${mrnPatterns.nameDerived.length}`);
      mrnPatterns.nameDerived.forEach(p => {
        logColored('yellow', `  - Patient ${p.name || p.id}: MRN = "${p.mrn}"`);
      });
    } else {
      logColored('green', `No name-derived IDs found (good)`);
    }
    
    if (mrnPatterns.tooShort.length > 0) {
      logColored('yellow', `\nToo short MRNs (<5 chars): ${mrnPatterns.tooShort.length}`);
      mrnPatterns.tooShort.slice(0, 5).forEach(p => {
        logColored('yellow', `  - Patient ${p.name || p.id}: MRN = "${p.mrn}"`);
      });
      if (mrnPatterns.tooShort.length > 5) {
        logColored('yellow', `  - ... and ${mrnPatterns.tooShort.length - 5} more`);
      }
    }
    
    if (mrnPatterns.tooLong.length > 0) {
      logColored('yellow', `\nToo long MRNs (>5 chars): ${mrnPatterns.tooLong.length}`);
      mrnPatterns.tooLong.slice(0, 5).forEach(p => {
        logColored('yellow', `  - Patient ${p.name || p.id}: MRN = "${p.mrn}"`);
      });
      if (mrnPatterns.tooLong.length > 5) {
        logColored('yellow', `  - ... and ${mrnPatterns.tooLong.length - 5} more`);
      }
    }
    
    if (mrnPatterns.null.length > 0) {
      logColored('red', `\n⚠️ Missing MRNs (null): ${mrnPatterns.null.length}`);
      mrnPatterns.null.slice(0, 5).forEach(p => {
        logColored('yellow', `  - Patient ${p.name || p.id} has no MRN`);
      });
      if (mrnPatterns.null.length > 5) {
        logColored('yellow', `  - ... and ${mrnPatterns.null.length - 5} more`);
      }
    }
    
    if (mrnPatterns.other.length > 0) {
      logColored('yellow', `\nOther non-standard MRNs: ${mrnPatterns.other.length}`);
      mrnPatterns.other.slice(0, 5).forEach(p => {
        logColored('yellow', `  - Patient ${p.name || p.id}: MRN = "${p.mrn}"`);
      });
      if (mrnPatterns.other.length > 5) {
        logColored('yellow', `  - ... and ${mrnPatterns.other.length - 5} more`);
      }
    }
    
    // Final summary
    logColored('cyan', '\n========================================');
    logColored('cyan', '  COMPLIANCE SUMMARY');
    logColored('cyan', '========================================');
    
    const compliantCount = mrnPatterns.validMixed.length;
    const totalCount = patients.length;
    const complianceRate = totalCount > 0 ? (compliantCount / totalCount * 100).toFixed(1) : 0;
    
    if (complianceRate >= 99) {
      logColored('green', `\n✅ EXCELLENT: ${complianceRate}% of medical IDs are compliant`);
      logColored('green', '   (5-char mixed alphanumeric with letters and numbers)');
    } else if (complianceRate >= 90) {
      logColored('yellow', `\n⚠️ GOOD: ${complianceRate}% of medical IDs are compliant, but some need fixing`);
    } else {
      logColored('red', `\n❌ POOR: Only ${complianceRate}% of medical IDs are compliant`);
      logColored('red', '   Significant remediation needed');
    }
    
  } catch (error) {
    logColored('red', "Error verifying Medical IDs:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyMedicalIDs()
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
