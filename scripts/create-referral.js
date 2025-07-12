// Script to create a referral for patient with MRN RVV76
const fetch = require('node-fetch');

async function createReferral() {
  try {
    // First, we need to find the patient ID using the MRN
    console.log('Fetching patient with MRN: RVV76');
    const patientResponse = await fetch('http://localhost:3000/api/patients/RVV76');
    
    if (!patientResponse.ok) {
      throw new Error(`Failed to fetch patient: ${patientResponse.status} ${patientResponse.statusText}`);
    }
    
    const patientData = await patientResponse.json();
    console.log('Patient found:', patientData);
    
    if (!patientData.id) {
      throw new Error('Patient ID not found in response');
    }
    
    // Next, we need to get the hospital IDs
    console.log('Fetching hospitals');
    const hospitalsResponse = await fetch('http://localhost:3000/api/hospitals');
    
    if (!hospitalsResponse.ok) {
      throw new Error(`Failed to fetch hospitals: ${hospitalsResponse.status} ${hospitalsResponse.statusText}`);
    }
    
    const hospitalsData = await hospitalsResponse.json();
    const hospitals = hospitalsData.hospitals || [];
    
    if (hospitals.length < 2) {
      throw new Error('Need at least two hospitals to create a referral');
    }
    
    // Use the first hospital as the referring hospital and the second as the receiving hospital
    const referringHospital = hospitals[0];
    const receivingHospital = hospitals[1];
    
    console.log(`Creating referral from ${referringHospital.name} to ${receivingHospital.name}`);
    
    // Create the referral
    const referralData = {
      patientId: patientData.id,
      toHospitalId: receivingHospital.id,
      reason: "Medical consultation required",
      notes: "Created via API for patient with MRN RVV76",
      priority: "ROUTINE",
      requiresAmbulance: false,
      referringDoctorId: 'dev_doctor_001' // This will be overridden by the server in production
    };
    
    console.log('Sending referral data:', referralData);
    
    const referralResponse = await fetch(`http://localhost:3000/api/hospitals/${referringHospital.subdomain}/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(referralData),
    });
    
    if (!referralResponse.ok) {
      const errorText = await referralResponse.text();
      throw new Error(`Failed to create referral: ${referralResponse.status} ${referralResponse.statusText}\n${errorText}`);
    }
    
    const referralResult = await referralResponse.json();
    console.log('Referral created successfully:', referralResult);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createReferral();
