/**
 * Medical ID Validator
 * This script detects and removes non-compliant medical IDs from browser storage
 * It targets particularly the "MOHAM" pattern and other test-style IDs
 * Run this script on every page load to ensure no invalid IDs persist
 */

(function() {
  // List of known test ID patterns to remove
  const testPatterns = [
    /^TEST/i,      // Starts with TEST
    /^DEMO/i,      // Starts with DEMO
    /^MOHAM/i,     // Specific name pattern we need to remove
    /^JOHN/i,      // Common test name
    /^USER/i,      // Starts with USER
    /^SAMPLE/i     // Starts with SAMPLE
  ];

  // Check if a string is a valid medical ID
  // Must be 5 characters, mixed alphanumeric 
  // (at least one letter and one number)
  // Cannot be all letters
  function isValidMedicalID(id) {
    if (!id || typeof id !== 'string') return false;
    if (id.length !== 5) return false;

    // Check for mixed alphanumeric (at least one letter and one number)
    const hasLetter = /[A-Z]/i.test(id);
    const hasNumber = /[0-9]/.test(id);
    
    // Check if it's all letters (invalid format)
    const isAllLetters = /^[A-Z]+$/i.test(id);
    
    // Check against test patterns
    const isTestPattern = testPatterns.some(pattern => pattern.test(id));
    
    return hasLetter && hasNumber && !isAllLetters && !isTestPattern;
  }

  // Function to scan and clean localStorage
  function cleanLocalStorage() {
    try {
      const keys = Object.keys(localStorage);
      let removed = 0;
      
      for (const key of keys) {
        try {
          // Parse the stored value as JSON if possible
          let value = localStorage.getItem(key);
          let parsedValue = null;
          
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            // Not valid JSON, leave as string
          }
          
          // Check if the value contains a medical ID field
          if (typeof parsedValue === 'object' && parsedValue !== null) {
            const medicalIdFields = ['medicalId', 'medicalNumber', 'mrn', 'medical_id'];
            
            // Check all possible medical ID field names
            for (const field of medicalIdFields) {
              if (parsedValue[field] && typeof parsedValue[field] === 'string') {
                const medicalId = parsedValue[field];
                
                // If it's an invalid format, remove it
                if (!isValidMedicalID(medicalId)) {
                  console.warn(`Invalid medical ID found in ${key}.${field}: ${medicalId}`);
                  // Remove the entire item as it may be corrupt
                  localStorage.removeItem(key);
                  removed++;
                  break; // Already removed the entire item
                }
              }
            }
          } else if (typeof value === 'string') {
            // Check if the raw string looks like a medical ID
            // This catches cases where the ID is stored directly
            if ((value.length === 5 || value.length === 6) && !isValidMedicalID(value) && 
                testPatterns.some(pattern => pattern.test(value))) {
              console.warn(`Invalid medical ID found directly in ${key}: ${value}`);
              localStorage.removeItem(key);
              removed++;
            }
          }
        } catch (e) {
          console.error(`Error processing localStorage key ${key}:`, e);
        }
      }
      
      if (removed > 0) {
        console.log(`Removed ${removed} localStorage items with invalid medical IDs`);
      }
      
      return removed;
    } catch (e) {
      console.error("Error cleaning localStorage:", e);
      return 0;
    }
  }

  // Function to scan and clean sessionStorage
  function cleanSessionStorage() {
    try {
      const keys = Object.keys(sessionStorage);
      let removed = 0;
      
      for (const key of keys) {
        // Same logic as localStorage
        try {
          let value = sessionStorage.getItem(key);
          let parsedValue = null;
          
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            // Not valid JSON, leave as string
          }
          
          if (typeof parsedValue === 'object' && parsedValue !== null) {
            const medicalIdFields = ['medicalId', 'medicalNumber', 'mrn', 'medical_id'];
            
            for (const field of medicalIdFields) {
              if (parsedValue[field] && typeof parsedValue[field] === 'string') {
                const medicalId = parsedValue[field];
                
                if (!isValidMedicalID(medicalId)) {
                  console.warn(`Invalid medical ID found in sessionStorage ${key}.${field}: ${medicalId}`);
                  sessionStorage.removeItem(key);
                  removed++;
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error processing sessionStorage key ${key}:`, e);
        }
      }
      
      if (removed > 0) {
        console.log(`Removed ${removed} sessionStorage items with invalid medical IDs`);
      }
      
      return removed;
    } catch (e) {
      console.error("Error cleaning sessionStorage:", e);
      return 0;
    }
  }

  // Function to scan and clean cookies
  function cleanCookies() {
    try {
      const cookies = document.cookie.split(';');
      let removed = 0;
      
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        const [name, value] = cookie.split('=').map(part => part.trim());
        
        try {
          // Try to decode and parse the cookie value
          let decodedValue = decodeURIComponent(value);
          let parsedValue = null;
          
          try {
            parsedValue = JSON.parse(decodedValue);
          } catch (e) {
            // Not valid JSON, leave as string
          }
          
          // Check if it's a patient session cookie
          if (name === 'patient_session' && typeof parsedValue === 'object' && parsedValue !== null) {
            if (parsedValue.medicalId && typeof parsedValue.medicalId === 'string') {
              const medicalId = parsedValue.medicalId;
              
              if (!isValidMedicalID(medicalId)) {
                console.warn(`Invalid medical ID found in cookie ${name}: ${medicalId}`);
                // Delete the cookie by setting expiration in the past
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                removed++;
              }
            }
          }
        } catch (e) {
          console.error(`Error processing cookie ${name}:`, e);
        }
      }
      
      if (removed > 0) {
        console.log(`Removed ${removed} cookies with invalid medical IDs`);
      }
      
      return removed;
    } catch (e) {
      console.error("Error cleaning cookies:", e);
      return 0;
    }
  }

  // Run the cleaner functions at startup
  function runCleaners() {
    const localItems = cleanLocalStorage();
    const sessionItems = cleanSessionStorage();
    const cookieItems = cleanCookies();
    
    const total = localItems + sessionItems + cookieItems;
    
    if (total > 0) {
      console.log(`Total items removed: ${total}`);
      // If issues were found and fixed, reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  // Run immediately
  runCleaners();
  
  // Also check again when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', runCleaners);
})();
