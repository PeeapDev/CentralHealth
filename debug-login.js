const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Create a simple express server to debug login issues
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Debug endpoint to view email formats in patient records
app.get('/debug/patients', async (req, res) => {
  try {
    // Get all patients with their contact data
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        mrn: true,
        name: true,
        contact: true,
        medicalHistory: true,
        createdAt: true
      },
      take: 20 // Limit to 20 most recent
    });

    // Format the results to show email data
    const formattedPatients = patients.map(p => {
      const contact = typeof p.contact === 'string' ? JSON.parse(p.contact) : p.contact;
      return {
        id: p.id,
        mrn: p.mrn,
        name: p.name,
        contactType: typeof p.contact,
        hasEmail: !!contact?.email,
        email: contact?.email || 'N/A',
        contactKeys: contact ? Object.keys(contact) : []
      };
    });

    res.json({ patients: formattedPatients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Debug login attempt
app.post('/debug/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password required' 
      });
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Attempting login with ${normalizedEmail}`);
    
    // Try to find patient by email using raw SQL
    const patientsWithEmail = await prisma.$queryRaw`
      SELECT id, mrn, "contact", "medicalHistory", "name"
      FROM "Patient" 
      WHERE "contact"::jsonb ->> 'email' = ${normalizedEmail}
      LIMIT 1
    `;

    // If not found with SQL, try JSON contains
    let patient = null;
    if (Array.isArray(patientsWithEmail) && patientsWithEmail.length > 0) {
      patient = patientsWithEmail[0];
      console.log('Found patient with SQL query');
    } else {
      // Manual search through all recent patients
      console.log('SQL query found no results, trying manual search');
      const allPatients = await prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          mrn: true,
          name: true,
          contact: true,
          medicalHistory: true
        },
        take: 50
      });
      
      for (const p of allPatients) {
        try {
          const contact = typeof p.contact === 'string' ? JSON.parse(p.contact) : p.contact;
          if (contact?.email && contact.email.toLowerCase() === normalizedEmail) {
            patient = p;
            console.log(`Found matching email for patient ${p.id}`);
            break;
          }
        } catch (e) {
          console.error(`Error parsing contact for patient ${p.id}:`, e);
        }
      }
    }

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        error: 'No patient found with this email',
        errorCode: 'patient_not_found'
      });
    }
    
    // Extract authentication data
    const contactData = typeof patient.contact === 'string' ? 
      JSON.parse(patient.contact) : patient.contact;
    
    const medicalHistory = typeof patient.medicalHistory === 'string' ?
      JSON.parse(patient.medicalHistory) : patient.medicalHistory;
      
    // Get stored password
    const storedPassword = contactData?.password || medicalHistory?.password;
    
    if (!storedPassword) {
      return res.status(401).json({
        success: false,
        error: 'No password set for this account',
        errorCode: 'no_password'
      });
    }
    
    // Verify password
    let passwordValid = false;
    
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
      // Bcrypt hash
      passwordValid = await bcrypt.compare(password, storedPassword);
    } else {
      // Plain text comparison (legacy)
      passwordValid = storedPassword === password;
    }
    
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        errorCode: 'invalid_password'
      });
    }
    
    // Success!
    return res.json({
      success: true,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        email: contactData?.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Start the server
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Debug server running at http://localhost:${PORT}`);
  console.log(`- View patients: http://localhost:${PORT}/debug/patients`);
  console.log(`- Test login: POST to http://localhost:${PORT}/debug/login`);
});
