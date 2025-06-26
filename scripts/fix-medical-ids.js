// JavaScript version of the medical ID fix script
const { PrismaClient } = require('../lib/generated/prisma');
const medicalIdUtils = require('../utils/medical-id');

const prisma = new PrismaClient();
const { generateMedicalID, isValidMedicalID } = medicalIdUtils;

/**
 * This script fixes inconsistent Medical IDs in the database:
 * 1. Finds patients with missing or invalid Medical IDs (P12345 format)
 * 2. Specifically targets name-derived IDs like "MOHAM" that violate system rules
 * 3. Generates new NHS-style 5-character alphanumeric IDs with mixed letters and numbers
 * 4. Updates the database records to maintain consistency
 * 5. Ensures medical IDs remain permanent after proper assignment
 */
async function fixMedicalIDs() {
  console.log("Starting Medical ID consistency fix script...");
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        mrn: true,
      }
    });

    console.log(`Found ${patients.length} patient records to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const patient of patients) {
      // Check if patient has a valid Medical ID (5 chars, alphanumeric)
      const hasValidID = patient.mrn && isValidMedicalID(patient.mrn);
      
      // Check if patient has name-derived ID that needs to be replaced
      const hasNameDerivedID = patient.mrn && 
                            typeof patient.mrn === 'string' && 
                            /^[A-Z]+$/i.test(patient.mrn);
      
      // Check if patient has a P-prefixed ID that needs to be replaced
      const hasPrefixedID = patient.mrn && 
                            typeof patient.mrn === 'string' && 
                            patient.mrn.startsWith('P') && 
                            patient.mrn.length > 1;
      
      if (hasValidID && !hasPrefixedID && !hasNameDerivedID) {
        // Skip if already has valid ID, not using the old P prefix format, and not using name-derived ID
        skippedCount++;
        console.log(`Patient ${patient.id} already has valid Medical ID: ${patient.mrn}`);
        continue;
      }
      
      // Log specifically when we find a name-derived medical ID (like "MOHAM")
      if (hasNameDerivedID) {
        console.log(`Found name-derived Medical ID '${patient.mrn}' for patient ${patient.name || patient.id} - will replace it with compliant ID`);
      }
      
      // Generate a new consistent Medical ID
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
          console.log(`Generated ID ${newMedicalId} already exists, trying again...`);
          newMedicalId = generateMedicalID();
        }
      }
      
      if (!isUnique) {
        console.error(`Could not generate a unique Medical ID for patient ${patient.id} after ${attempts} attempts`);
        continue;
      }
      
      // Update the patient record with the new Medical ID
      await prisma.patient.update({
        where: { id: patient.id },
        data: { mrn: newMedicalId }
      });
      
      console.log(`Fixed patient ${patient.id}: ${patient.mrn || 'missing'} → ${newMedicalId}`);
      
      // Special log for fixed name-derived IDs like 'MOHAM'
      if (hasNameDerivedID) {
        console.log(`🎉 Successfully replaced name-derived ID '${patient.mrn}' for patient ${patient.name || patient.id}`);
      }
      fixedCount++;
    }
    
    console.log(`
============================
MEDICAL ID FIX COMPLETE
============================
`);
    console.log(`- Fixed: ${fixedCount} patients`);
    console.log(`- Skipped (already valid): ${skippedCount} patients`);
    console.log(`
All medical IDs now follow the CentralHealth system rules:
- 5-character alphanumeric format
- Mix of letters and numbers
- No confusing characters (i, l, 1, o, 0)
- No name-derived IDs like "MOHAM"
`);
    
  } catch (error) {
    console.error("Error fixing Medical IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMedicalIDs().catch(console.error);
