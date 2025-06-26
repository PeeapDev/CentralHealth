// Simple API test script for patient registration
const fetch = require('node-fetch');

// Generate valid NHS-style medical ID (letters and numbers, excluding confusing chars)
function generateMedicalId() {
  const allowedChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
  }
  return result;
}

async function testRegistrationApi() {
  const medicalId = generateMedicalId();
  console.log('Testing registration with medical ID:', medicalId);
  
  try {
    const response = await fetch('http://localhost:3002/api/patients/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        step: 'basic',
        firstName: 'Test',
        lastName: 'Patient',
        email: `test${Date.now()}@example.com`,
        password: 'Password123!',
        medicalId: medicalId,
        phone: '+23276123456',
        gender: 'male',
        birthDate: '1990-01-01'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is HTML
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.error('SERVER ERROR: Received HTML response instead of JSON');
      const text = await response.text();
      console.error('HTML preview:', text.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testRegistrationApi();
