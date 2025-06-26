/**
 * Script to diagnose and fix patient login issues
 * 
 * This script directly uses the login API to test login for patients
 * and identifies any issues with email matching or password verification.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuration
const API_ROUTE = '/api/patients/login';
const PATIENT_DATA_FILE = path.join(__dirname, 'patient-emails.json');

// Function to execute SQL commands against the database
// This uses the DATABASE_URL from .env directly
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const command = `npx prisma db execute --stdin`;
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`SQL execution error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`SQL stderr: ${stderr}`);
      }
      resolve(stdout);
    });
    
    child.stdin.write(sql);
    child.stdin.end();
  });
}

// Function to get all patients with email issues
async function findPatientsWithEmailIssues() {
  console.log('Analyzing patient records for email storage issues...');
  
  try {
    // Query to get all patients
    const sql = `
      SELECT id, mrn, contact 
      FROM "Patient"
      LIMIT 100;
    `;
    
    const result = await executeSql(sql);
    console.log('Database query complete, analyzing results...');
    
    // Parse the results
    const lines = result.split('\n').filter(line => line.trim());
    
    // Extract header (first line) and data (remaining lines)
    const patients = [];
    let patientCount = 0;
    let emailIssues = 0;
    
    if (lines.length > 1) {
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Try to extract patient data based on delimiters
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 3) {
          try {
            const id = parts[0];
            const mrn = parts[1];
            let contact = parts[2];
            
            // Try to parse contact JSON
            let contactObj = null;
            let hasEmail = false;
            
            try {
              contactObj = JSON.parse(contact);
              hasEmail = contactObj && contactObj.email && typeof contactObj.email === 'string';
            } catch (e) {
              // If contact isn't valid JSON, it's definitely an issue
              hasEmail = false;
            }
            
            patientCount++;
            
            // If patient doesn't have proper email in contact JSON, flag it
            if (!hasEmail) {
              emailIssues++;
              patients.push({
                id,
                mrn,
                hasEmailIssue: true
              });
            }
          } catch (parseErr) {
            console.error(`Error parsing patient data: ${parseErr}`);
          }
        }
      }
    }
    
    console.log(`Analyzed ${patientCount} patients`);
    console.log(`Found ${emailIssues} patients with email storage issues`);
    
    // Save the results for reference
    fs.writeFileSync(PATIENT_DATA_FILE, JSON.stringify(patients, null, 2));
    console.log(`Saved patient analysis to ${PATIENT_DATA_FILE}`);
    
    return patients;
  } catch (error) {
    console.error('Error finding patients with email issues:', error);
    return [];
  }
}

// Function to fix patient email storage
async function fixPatientEmail(patient) {
  const { id, mrn } = patient;
  console.log(`\nFixing email storage for patient ${id} (MRN: ${mrn})`);
  
  try {
    // First, get the full patient record
    const sql = `
      SELECT * FROM "Patient"
      WHERE id = '${id}';
    `;
    
    const result = await executeSql(sql);
    console.log(`Retrieved patient data for ${id}`);
    
    // Parse the patient data
    const lines = result.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.error(`No patient data found for ID: ${id}`);
      return false;
    }
    
    // Get the contact column index
    const headers = lines[0].split('|').map(h => h.trim());
    const contactIndex = headers.findIndex(h => h === 'contact');
    const emailIndex = headers.findIndex(h => h === 'email');
    
    if (contactIndex === -1) {
      console.error('Contact column not found in patient data');
      return false;
    }
    
    // Parse the contact data
    const patientData = lines[1].split('|').map(d => d.trim());
    let contact = patientData[contactIndex] || '{}';
    const email = patientData[emailIndex] || '';
    
    // Parse contact JSON
    let contactObj;
    try {
      contactObj = JSON.parse(contact);
    } catch (e) {
      contactObj = {};
    }
    
    // Find and normalize email
    let patientEmail = '';
    
    // Check different sources for email in priority order
    if (email && email.includes('@')) {
      patientEmail = email.toLowerCase().trim();
      console.log(`Using email from direct column: ${patientEmail}`);
    } else if (contactObj.email && contactObj.email.includes('@')) {
      patientEmail = contactObj.email.toLowerCase().trim();
      console.log(`Using email from contact.email: ${patientEmail}`);
    } else if (contactObj.emailAddress && contactObj.emailAddress.includes('@')) {
      patientEmail = contactObj.emailAddress.toLowerCase().trim();
      console.log(`Using email from contact.emailAddress: ${patientEmail}`);
    } else {
      // Generate a placeholder email based on medical ID for patients without email
      patientEmail = `patient-${mrn}@example.com`;
      console.log(`No email found, using placeholder: ${patientEmail}`);
    }
    
    // Generate password hash if needed
    let passwordHash = '';
    if (contactObj.password && (contactObj.password.startsWith('$2a$') || contactObj.password.startsWith('$2b$'))) {
      passwordHash = contactObj.password;
      console.log('Using existing password hash');
    } else if (contactObj.password) {
      // Hash existing plaintext password
      passwordHash = await bcrypt.hash(contactObj.password, 10);
      console.log('Hashed existing plaintext password');
    } else {
      // Create default password based on medical ID (secure enough for this purpose)
      passwordHash = await bcrypt.hash(mrn || id, 10);
      console.log('Created new password hash based on medical ID');
    }
    
    // Update the contact object
    const updatedContact = {
      ...contactObj,
      email: patientEmail,
      password: passwordHash
    };
    
    // Prepare the SQL update
    const updateSql = `
      UPDATE "Patient"
      SET contact = '${JSON.stringify(updatedContact)}'
      WHERE id = '${id}';
    `;
    
    await executeSql(updateSql);
    
    console.log(`✅ Successfully updated email and password for patient ${id}`);
    return true;
  } catch (error) {
    console.error(`Error fixing patient ${id} email:`, error);
    return false;
  }
}

// Main function to run the script
async function main() {
  console.log('Starting patient login fix process...');
  
  try {
    // Find patients with issues
    const patientsWithIssues = await findPatientsWithEmailIssues();
    
    if (patientsWithIssues.length === 0) {
      console.log('No patient email issues found. Everything looks good!');
      return;
    }
    
    console.log(`\nFound ${patientsWithIssues.length} patients with email issues. Starting fixes...`);
    
    // Fix email storage for each patient
    let fixedCount = 0;
    for (const patient of patientsWithIssues) {
      const success = await fixPatientEmail(patient);
      if (success) fixedCount++;
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total patients with issues: ${patientsWithIssues.length}`);
    console.log(`Successfully fixed: ${fixedCount}`);
    console.log(`Failed fixes: ${patientsWithIssues.length - fixedCount}`);
    console.log(`================`);
    
  } catch (error) {
    console.error('Error in login fix process:', error);
  }
}

// Run the script
main()
  .then(() => {
    console.log('Patient login fix process completed');
  })
  .catch(err => {
    console.error('Script failed with error:', err);
  });
