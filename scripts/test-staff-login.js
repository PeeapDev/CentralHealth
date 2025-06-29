/**
 * This script tests the staff login functionality and validates that cookies are properly set.
 * It helps troubleshoot authentication issues with the hospital staff API.
 */
const { exec } = require('child_process');
const fetch = require('node-fetch');

async function testStaffLogin() {
  console.log('Testing staff login functionality...');
  
  // Lifecare hospital credentials (should match what's in create-lifecare-staff.js)
  const loginData = {
    hospitalSlug: 'lifecare',
    email: 'admin@lifecare.com',
    password: 'admin123'
  };

  console.log(`Attempting to login with ${loginData.email} at ${loginData.hospitalSlug}`);

  try {
    // Make the login request
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();
    
    console.log('Login response:', JSON.stringify(data, null, 2));
    
    // Check response headers for Set-Cookie
    const setCookieHeader = response.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader || 'No cookie set');
    
    if (data.success) {
      console.log('✅ Login successful');
      console.log('User role:', data.data.user.role);
      console.log('Hospital:', data.data.user.hospital.name);
      
      // Now make a request to staff API to test if cookie authentication works
      console.log('\nTesting authenticated staff API access...');
      
      // Extract the actual auth_token value from the Set-Cookie header
      const authTokenMatch = setCookieHeader?.match(/auth_token=([^;]+)/); 
      const authToken = authTokenMatch ? authTokenMatch[1] : null;
      
      if (!authToken) {
        console.log('❌ Could not extract auth_token from cookie header');
        return;
      }
      
      console.log(`Using auth_token: ${authToken.substring(0, 20)}...`);
      
      const staffResponse = await fetch(`http://localhost:3000/api/hospitals/${loginData.hospitalSlug}/staff`, {
        headers: {
          Cookie: `auth_token=${authToken}`
        }
      });
      
      const staffData = await staffResponse.json();
      console.log(`Staff API response (${staffResponse.status}):`, 
        staffResponse.status === 200 
          ? `Successfully retrieved ${staffData.data?.length || 0} staff members` 
          : JSON.stringify(staffData, null, 2)
      );
      
      if (staffResponse.status === 200) {
        console.log('✅ Authentication fixed! The cookie is working properly.');
      } else {
        console.log('❌ Authentication still has issues. Cookie might not be working.');
      }
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Run the test
testStaffLogin();
