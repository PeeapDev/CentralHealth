/**
 * Clear-cache script for Hospital FHIR application
 * This script clears browser cache related data by updating Next.js cache files
 * and providing code to clear localStorage manually
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Terminal color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.blue}========================================${colors.reset}`);
console.log(`${colors.cyan}  HOSPITAL FHIR CACHE CLEANER${colors.reset}`);
console.log(`${colors.blue}========================================${colors.reset}`);

// 1. Clear Next.js cache
console.log(`\n${colors.cyan}[1/4]${colors.reset} Clearing Next.js cache...`);
try {
  // Remove .next folder
  const nextCachePath = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextCachePath)) {
    console.log(`${colors.yellow}Removing Next.js cache at:${colors.reset} ${nextCachePath}`);
    exec(`rm -rf ${nextCachePath}`, (err) => {
      if (err) {
        console.error(`${colors.red}Error removing Next.js cache:${colors.reset}`, err);
      } else {
        console.log(`${colors.green}✅ Next.js cache successfully removed!${colors.reset}`);
      }
    });
  } else {
    console.log(`${colors.yellow}No Next.js cache found to clear.${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Failed to clear Next.js cache:${colors.reset}`, error);
}

// 2. Clear any server-side session state
console.log(`\n${colors.cyan}[2/4]${colors.reset} Clearing server-side session state...`);
try {
  // Remove temporary session files if they exist
  const tempSessionPath = path.join(__dirname, '..', 'tmp', 'sessions');
  if (fs.existsSync(tempSessionPath)) {
    console.log(`${colors.yellow}Removing temporary sessions at:${colors.reset} ${tempSessionPath}`);
    exec(`rm -rf ${tempSessionPath}`, (err) => {
      if (err) {
        console.error(`${colors.red}Error removing session files:${colors.reset}`, err);
      } else {
        console.log(`${colors.green}✅ Session files successfully removed!${colors.reset}`);
      }
    });
  } else {
    console.log(`${colors.yellow}No session files found to clear.${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Failed to clear session files:${colors.reset}`, error);
}

// 3. Provide instructions for clearing localStorage
console.log(`\n${colors.cyan}[3/4]${colors.reset} Instructions for clearing localStorage:`);
console.log(`${colors.yellow}To clear localStorage data including "MOHAM" references, add this script to your application:${colors.reset}`);
console.log(`
// Add this to a page or component to clear localStorage
function clearLocalStorage() {
  // Clear specific MOHAM related items if they exist
  const keysToCheck = ['medicalNumber', 'patientSession', 'patient-data', 'patient-profile'];
  
  keysToCheck.forEach(key => {
    const value = localStorage.getItem(key);
    if (value && (value.includes('MOHAM') || value.includes('9K3F4'))) {
      console.log(\`Clearing localStorage item: \${key}\`);
      localStorage.removeItem(key);
    }
  });
  
  // Also provide option to clear everything
  // localStorage.clear();
  
  console.log('LocalStorage cache cleared');
  
  // Reload the page to ensure clean state
  // window.location.reload();
}
`);

// 4. Create a browser cache clearer utility
console.log(`\n${colors.cyan}[4/4]${colors.reset} Creating browser cache clearer utility...`);

// Create a simple HTML page that clears browser cache
const cacheCleanerPath = path.join(__dirname, '..', 'public', 'cache-cleaner.html');
const cacheCleanerContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hospital FHIR Cache Cleaner</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #0070f3;
        }
        button {
            background: #0070f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 0;
            font-size: 16px;
        }
        button:hover {
            background: #0051a2;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background: #f0f9ff;
            border-left: 4px solid #0070f3;
        }
        .warning {
            color: #d32f2f;
            font-weight: bold;
        }
        code {
            background: #f1f1f1;
            padding: 2px 5px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>Hospital FHIR Cache Cleaner</h1>
    <p>This utility helps clear browser cache and localStorage data that might contain old patient records or medical IDs like "MOHAM".</p>

    <div>
        <h2>Step 1: Clear localStorage</h2>
        <p>This will remove all patient-related data stored in your browser's localStorage:</p>
        <button id="clearLocalStorage">Clear localStorage</button>
        <div id="localStorageResult" class="result"></div>
    </div>

    <div>
        <h2>Step 2: Clear Session Cookies</h2>
        <p>This will remove all session cookies related to patient authentication:</p>
        <button id="clearCookies">Clear Session Cookies</button>
        <div id="cookieResult" class="result"></div>
    </div>

    <div>
        <h2>Step 3: Browser Cache</h2>
        <p>To clear your entire browser cache:</p>
        <ul>
            <li>Chrome: Settings → Privacy and Security → Clear browsing data</li>
            <li>Firefox: Settings → Privacy & Security → Cookies and Site Data → Clear Data</li>
            <li>Safari: Preferences → Privacy → Manage Website Data → Remove All</li>
        </ul>
        <p class="warning">After clearing cache, please restart your browser and then try using the system again.</p>
    </div>

    <script>
        document.getElementById('clearLocalStorage').addEventListener('click', function() {
            const result = document.getElementById('localStorageResult');
            let foundMedicalID = false;
            
            // Check for any MOHAM references
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    const value = localStorage.getItem(key);
                    if (value && (value.includes('MOHAM') || value.includes('9K3F4'))) {
                        result.innerHTML += \`Found reference to problematic medical ID in key: \${key}<br>\`;
                        foundMedicalID = true;
                    }
                } catch (e) {
                    console.error("Error reading localStorage item:", e);
                }
            }
            
            // Clear all localStorage
            localStorage.clear();
            
            if (foundMedicalID) {
                result.innerHTML += '<strong>Found and cleared problematic medical IDs!</strong><br>';
            }
            
            result.innerHTML += 'All localStorage data has been cleared. Please reload the application.';
        });
        
        document.getElementById('clearCookies').addEventListener('click', function() {
            const result = document.getElementById('cookieResult');
            
            // Delete all cookies
            const cookies = document.cookie.split(";");
            let patientSessionFound = false;
            
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                
                if (name === 'patient-session') {
                    patientSessionFound = true;
                }
                
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
            }
            
            if (patientSessionFound) {
                result.innerHTML = '<strong>Found and cleared patient session cookie!</strong><br>';
            }
            
            result.innerHTML += 'All cookies have been cleared. Please reload the application.';
        });
    </script>
</body>
</html>
`;

try {
  // Ensure public directory exists
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Write the cache cleaner HTML
  fs.writeFileSync(cacheCleanerPath, cacheCleanerContent);
  console.log(`${colors.green}✅ Cache cleaner utility created at:${colors.reset} /public/cache-cleaner.html`);
  console.log(`${colors.yellow}Access this utility at:${colors.reset} http://localhost:3000/cache-cleaner.html`);
} catch (error) {
  console.error(`${colors.red}Failed to create cache cleaner utility:${colors.reset}`, error);
}

console.log(`\n${colors.green}========================================${colors.reset}`);
console.log(`${colors.green}  CACHE CLEARING COMPLETED${colors.reset}`);
console.log(`${colors.green}========================================${colors.reset}`);
console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
console.log(`1. Run your Next.js development server: ${colors.yellow}npm run dev${colors.reset}`);
console.log(`2. Access the cache cleaner: ${colors.yellow}http://localhost:3000/cache-cleaner.html${colors.reset}`);
console.log(`3. After clearing cache, restart your browser and use the application again.`);
console.log(`\n${colors.magenta}Note:${colors.reset} The system should now use proper database-stored medical IDs without hardcoded values.`);
