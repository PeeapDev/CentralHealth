// Script to synchronize medical IDs from extension.medicalId field to medicalNumber field
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * This script fixes inconsistencies between Medical IDs stored in extension JSON field
 * and the database medicalNumber field:
 * 
 * 1. Finds patients with extension.medicalId value
 * 2. Updates their medicalNumber field to match extension.medicalId
 * 3. Logs changes and statistics
 */
async function syncMedicalIDs() {
  console.log("Starting Medical ID synchronization from extension field...");
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        medicalNumber: true,
        extension: true,
      }
    });

    console.log(`Found ${patients.length} patient records to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let missingExtensionCount = 0;
    let noMedicalIdInExtensionCount = 0;
    let alreadySyncedCount = 0;
    
    for (const patient of patients) {
      // Parse extension data - handle possible null or invalid JSON
      let extensionData = {};
      try {
        if (patient.extension) {
          extensionData = JSON.parse(patient.extension);
        } else {
          missingExtensionCount++;
          console.log(`Patient ${patient.id} has no extension data, skipping`);
          continue;
        }
      } catch (error) {
        console.error(`Failed to parse extension data for patient ${patient.id}:`, error);
        continue;
      }
      
      // Check if extension has medicalId field
      if (!extensionData.medicalId) {
        noMedicalIdInExtensionCount++;
        console.log(`Patient ${patient.id} has no medicalId in extension data, skipping`);
        continue;
      }
      
      // Check if medicalNumber already matches extension.medicalId
      if (patient.medicalNumber === extensionData.medicalId) {
        alreadySyncedCount++;
        console.log(`Patient ${patient.id} already has matching medicalNumber and extension.medicalId: ${patient.medicalNumber}`);
        continue;
      }
      
      // Update the medicalNumber to match the extension.medicalId
      await prisma.patient.update({
        where: { id: patient.id },
        data: { medicalNumber: extensionData.medicalId }
      });
      
      console.log(`Updated patient ${patient.id}: ${patient.medicalNumber || 'missing'} → ${extensionData.medicalId}`);
      updatedCount++;
    }
    
    console.log(`\nMedical ID synchronization complete!`);
    console.log(`- Updated: ${updatedCount} patients (medicalNumber now matches extension.medicalId)`);
    console.log(`- Already synchronized: ${alreadySyncedCount} patients`);
    console.log(`- No extension data: ${missingExtensionCount} patients`);
    console.log(`- No medicalId in extension: ${noMedicalIdInExtensionCount} patients`);
    console.log(`- Total skipped: ${skippedCount + missingExtensionCount + noMedicalIdInExtensionCount + alreadySyncedCount} patients`);
    
  } catch (error) {
    console.error("Error synchronizing Medical IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
syncMedicalIDs()
  .then(() => console.log("Script completed successfully"))
  .catch(console.error);
