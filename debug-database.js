const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * This script diagnoses patient data structure issues
 * especially focusing on email storage and login problems
 */
async function debugDatabase() {
  try {
    console.log('====== PATIENT DATABASE DIAGNOSTIC ======');
    
    // Get all patients
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10 // Just get the most recent 10 for diagnosis
    });
    
    console.log(`Found ${patients.length} recent patients`);
    
    // For each patient, analyze their structure
    patients.forEach((patient, index) => {
      console.log(`\n----- PATIENT ${index + 1} -----`);
      console.log(`ID: ${patient.id}`);
      console.log(`MRN: ${patient.mrn || 'MISSING'}`);
      
      // Parse contact JSON
      let contactData;
      try {
        if (typeof patient.contact === 'string') {
          contactData = JSON.parse(patient.contact || '{}');
          console.log('Contact (parsed from string):', contactData);
        } else {
          contactData = patient.contact || {};
          console.log('Contact (object):', contactData);
        }
      } catch (e) {
        console.log('Failed to parse contact:', patient.contact);
        contactData = {};
      }
      
      // Parse medical history JSON
      let medicalData;
      try {
        if (typeof patient.medicalHistory === 'string') {
          medicalData = JSON.parse(patient.medicalHistory || '{}');
          console.log('MedicalHistory (parsed from string):', 
            medicalData.password ? {...medicalData, password: '********'} : medicalData);
        } else {
          medicalData = patient.medicalHistory || {};
          console.log('MedicalHistory (object):', 
            medicalData.password ? {...medicalData, password: '********'} : medicalData);
        }
      } catch (e) {
        console.log('Failed to parse medicalHistory:', patient.medicalHistory);
        medicalData = {};
      }
      
      // Analyze email storage
      const possibleEmails = {
        'contact.email': contactData.email,
        'contact.emailAddress': contactData.emailAddress,
        'medicalHistory.email': medicalData.email,
        'stringSearch': typeof patient.contact === 'string' ? 
          patient.contact.includes('@') ? 'contains @ symbol' : 'no @ symbol' : 'not a string'
      };
      
      console.log('Possible email locations:', possibleEmails);
    });
    
    // Try to look up a specific test email
    const testEmail = 'mary@peeap.com';
    console.log(`\n====== SEARCHING FOR TEST EMAIL: ${testEmail} ======`);
    
    // Method 1: SQL raw query
    console.log('\nMethod 1: SQL raw query');
    try {
      const sqlResult = await prisma.$queryRaw`
        SELECT id, mrn, "contact", "medicalHistory"
        FROM "Patient" 
        WHERE "contact"::jsonb ->> 'email' = ${testEmail}
        LIMIT 1
      `;
      console.log('SQL query result:', sqlResult);
    } catch (e) {
      console.log('SQL query error:', e.message);
    }
    
    // Method 2: Manual search through all patients
    console.log('\nMethod 2: Manual email search');
    const allPatients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mrn: true,
        contact: true,
        medicalHistory: true
      },
      take: 50
    });
    
    const matchingPatients = [];
    
    for (const p of allPatients) {
      try {
        // Try to find email in contact
        let contactData = p.contact;
        if (typeof contactData === 'string') {
          try { contactData = JSON.parse(contactData); } catch (e) { contactData = {}; }
        }
        
        // Try to find email in medicalHistory
        let medicalData = p.medicalHistory;
        if (typeof medicalData === 'string') {
          try { medicalData = JSON.parse(medicalData); } catch (e) { medicalData = {}; }
        }
        
        // Check if any email field matches
        const foundEmail = contactData?.email?.toLowerCase() === testEmail.toLowerCase() || 
                          contactData?.emailAddress?.toLowerCase() === testEmail.toLowerCase() ||
                          medicalData?.email?.toLowerCase() === testEmail.toLowerCase();
        
        if (foundEmail) {
          matchingPatients.push({
            id: p.id,
            mrn: p.mrn,
            contact: contactData,
            medicalHistory: medicalData ? 
              (medicalData.password ? {...medicalData, password: '*******'} : medicalData) : null
          });
        }
      } catch (e) {
        console.log(`Error checking patient ${p.id}:`, e.message);
      }
    }
    
    console.log('Manual search results:', matchingPatients);
    
    // Method 3: Try exact search with filter
    console.log('\nMethod 3: JSON contains search');
    const exactMatches = await prisma.patient.findMany({
      where: {
        contact: {
          contains: testEmail
        }
      },
      select: {
        id: true,
        mrn: true
      },
      take: 5
    });
    
    console.log('JSON contains results:', exactMatches);
    
    // Method 4: Email output format in registration route
    console.log('\nMethod 4: Analyzing how emails are stored during registration:');
    
    // Find the most recently registered patients
    const recentPatients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    if (recentPatients.length > 0) {
      const latestPatient = recentPatients[0];
      console.log('Latest registered patient:');
      console.log(`ID: ${latestPatient.id}`);
      console.log(`MRN: ${latestPatient.mrn}`);
      console.log(`Created: ${latestPatient.createdAt}`);
      
      try {
        // Examine contact structure
        const contact = typeof latestPatient.contact === 'string' ?
          JSON.parse(latestPatient.contact || '{}') : latestPatient.contact || {};
          
        console.log('Contact structure:', contact);
        
        if (contact.email) {
          console.log('Email properly stored in contact.email:', contact.email);
        } else {
          console.log('WARNING: No email in contact.email field');
          
          // Deep search for any email-like string
          const contactStr = JSON.stringify(contact);
          const emailMatches = contactStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (emailMatches) {
            console.log('Found potential emails in contact:', emailMatches);
          } else {
            console.log('No email-like strings in contact');
          }
        }
      } catch (e) {
        console.log('Error parsing latest patient contact:', e.message);
      }
    }
    
  } catch (error) {
    console.error('Database diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
debugDatabase()
  .then(() => console.log('\nDatabase diagnostic complete'))
  .catch(error => console.error('Diagnostic failed:', error));
