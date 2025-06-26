/**
 * Fix Name-Derived Medical IDs Script
 * 
 * This script identifies and fixes non-compliant medical IDs in the database,
 * specifically targeting name-derived formats like "MOHAM" that violate the
 * CentralHealth system rules requiring mixed alphanumeric formats.
 * 
 * IMPORTANT: This script follows the principles of CentralHealth System:
 * - Medical IDs are permanent and should only be fixed if non-compliant
 * - All medical IDs must follow NHS-style 5-character alphanumeric format
 * - Medical IDs must contain a mix of letters and numbers
 * - Confusing characters must be excluded (i, l, 1, o, 0)
 * - Full audit trail is maintained for all changes
 * 
 * Usage:
 *   npx ts-node scripts/fix-name-derived-medical-ids.ts
 */

const fs = require('fs');
const path = require('path');

// Import Prisma client from the project's location
const { prisma } = require('../lib/prisma');

// Import medical ID utilities
const { generateMedicalID, isValidMedicalID } = require('../utils/medical-id');


// Define colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Audit log file setup
const auditLogPath = path.join(process.cwd(), 'logs');
const auditLogFile = path.join(auditLogPath, `medical-id-fixes-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Ensure logs directory exists
if (!fs.existsSync(auditLogPath)) {
  fs.mkdirSync(auditLogPath, { recursive: true });
}

/**
 * Log a message to both console and audit log file
 */
function log(message: string, level: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
  // Get current time for timestamp
  const timestamp = new Date().toISOString();
  
  // Format the log message with appropriate color for console
  let consoleMessage: string;
  switch (level) {
    case 'warning':
      consoleMessage = `${colors.yellow}[WARNING]${colors.reset} ${message}`;
      break;
    case 'error':
      consoleMessage = `${colors.red}[ERROR]${colors.reset} ${message}`;
      break;
    case 'success':
      consoleMessage = `${colors.green}[SUCCESS]${colors.reset} ${message}`;
      break;
    case 'info':
    default:
      consoleMessage = `${colors.blue}[INFO]${colors.reset} ${message}`;
  }
  
  // Log to console
  console.log(consoleMessage);
  
  // Log to audit file (without colors)
  fs.appendFileSync(auditLogFile, `${timestamp} [${level.toUpperCase()}] ${message}\n`);
}

/**
 * Check if a medical ID appears to be name-derived 
 * (all letters, no numbers, which violates system rules)
 */
function isNameDerivedMedicalID(id: string | null): boolean {
  if (!id) return false;
  return /^[A-Z]+$/i.test(id);
}

/**
 * Fix non-compliant medical IDs in the database
 */
async function fixNameDerivedMedicalIDs() {
  log(`Starting medical ID audit and fix process`, 'info');
  log(`Following CentralHealth medical ID requirements: NHS-style 5-character alphanumeric IDs`, 'info');
  log(`Audit log will be saved to: ${auditLogFile}`, 'info');
  
  try {
    // Get all patients from the database
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        mrn: true,
        name: true
      }
    });
    
    log(`Found ${patients.length} total patients in database`, 'info');
    
    // Track statistics
    const stats = {
      total: patients.length,
      compliant: 0,
      nonCompliant: 0,
      nameDerived: 0,
      fixed: 0,
      errors: 0
    };
    
    // Process each patient
    for (const patient of patients) {
      // In this schema, medical ID is stored in mrn field
      const medicalId = patient.mrn;
      const displayName = patient.name || `Patient ${patient.id}`;
          
      if (!medicalId) {
        log(`Patient ${displayName} (${patient.id}) has no medical ID assigned`, 'warning');
        stats.nonCompliant++;
        
        // Generate a new compliant medical ID
        const newMedicalId = generateMedicalID();
        
        try {
          // Update the patient with the new medical ID
          await prisma.patient.update({
            where: { id: patient.id },
            data: { 
              mrn: newMedicalId
            }
          });
          
          log(`Added missing medical ID for patient ${displayName}: "${newMedicalId}"`, 'success');
          stats.fixed++;
        } catch (error) {
          log(`Failed to update missing medical ID for patient ${displayName}: ${error}`, 'error');
          stats.errors++;
        }
        
        continue;
      }
      
      // Check if the medical ID is compliant with our validation rules
      if (isValidMedicalID(medicalId)) {
        log(`Patient ${displayName}: Medical ID "${medicalId}" is compliant`, 'info');
        stats.compliant++;
        continue;
      }
      
      stats.nonCompliant++;
      
      // Check if it's a name-derived ID (all letters)
      if (isNameDerivedMedicalID(medicalId)) {
        log(`Patient ${displayName}: Medical ID "${medicalId}" appears to be name-derived (all letters)`, 'warning');
        stats.nameDerived++;
      } else {
        log(`Patient ${displayName}: Medical ID "${medicalId}" is non-compliant`, 'warning');
      }
      
      // Generate a new compliant medical ID
      const newMedicalId = generateMedicalID();
      
      try {
        // Verify the new ID isn't already in use (extremely unlikely but possible)
        const existingPatient = await prisma.patient.findFirst({
          where: { mrn: newMedicalId },
          select: { id: true }
        });
        
        if (existingPatient) {
          log(`Generated ID ${newMedicalId} already exists in database, skipping update for ${displayName}`, 'error');
          stats.errors++;
          continue;
        }
        
        // Update the patient with the new medical ID
        await prisma.patient.update({
          where: { id: patient.id },
          data: { mrn: newMedicalId }
        });
        
        log(`Fixed patient ${displayName}: Old ID "${medicalId}" → New ID "${newMedicalId}"`, 'success');
        stats.fixed++;
      } catch (error) {
        log(`Failed to update medical ID for patient ${displayName}: ${error}`, 'error');
        stats.errors++;
      }
    }
    
    // Print summary statistics
    log("\n======= MEDICAL ID AUDIT SUMMARY =======", 'info');
    log(`Total patients processed: ${stats.total}`, 'info');
    log(`Compliant medical IDs: ${stats.compliant}`, 'info');
    log(`Non-compliant medical IDs: ${stats.nonCompliant}`, 'info');
    log(`Name-derived medical IDs: ${stats.nameDerived}`, 'info');
    log(`Medical IDs fixed: ${stats.fixed}`, 'success');
    log(`Errors encountered: ${stats.errors}`, stats.errors > 0 ? 'error' : 'info');
    log("=======================================\n", 'info');
    
    log(`Audit log saved to: ${auditLogFile}`, 'info');
    
  } catch (error) {
    log(`Fatal error in medical ID fix process: ${error}`, 'error');
    process.exit(1);
  }
}

// Run the fix process
fixNameDerivedMedicalIDs()
  .then(() => {
    log("Medical ID fix process completed", 'success');
    process.exit(0);
  })
  .catch(error => {
    log(`Unhandled error: ${error}`, 'error');
    process.exit(1);
  });
