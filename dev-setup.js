#!/usr/bin/env node

/**
 * Development Server Coordinator
 * This script launches both the Python backend and Flutter mobile app
 * for an integrated development experience.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Terminal colors for better logging
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Project paths
const ROOT_DIR = process.cwd();
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const MOBILE_APP_DIR = path.join(ROOT_DIR, 'mobile_app');
const NEXT_APP_DIR = ROOT_DIR; // Next.js app is in the root dir based on package.json

// Configuration
const BACKEND_PORT = 8001;
const NEXT_PORT = 3000;

// Ensure directories exist
if (!fs.existsSync(BACKEND_DIR)) {
  console.error(`${colors.red}Backend directory not found at ${BACKEND_DIR}${colors.reset}`);
  process.exit(1);
}

if (!fs.existsSync(MOBILE_APP_DIR)) {
  console.error(`${colors.red}Mobile app directory not found at ${MOBILE_APP_DIR}${colors.reset}`);
  process.exit(1);
}

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Store process instances to manage later
let processes = {
  backend: null,
  mobile: null,
  web: null
};

/**
 * Start the Python backend server
 */
function startBackend() {
  console.log(`${colors.cyan}[SETUP] Starting FastAPI backend server on port ${BACKEND_PORT}...${colors.reset}`);
  
  // Check if virtual environment exists
  const hasVenv = fs.existsSync(path.join(BACKEND_DIR, 'venv'));
  
  let pythonCommand = 'python';
  let pythonArgs = ['main.py'];
  
  // Use virtual environment if it exists
  if (hasVenv) {
    if (process.platform === 'win32') {
      pythonCommand = path.join(BACKEND_DIR, 'venv', 'Scripts', 'python.exe');
    } else {
      pythonCommand = path.join(BACKEND_DIR, 'venv', 'bin', 'python');
    }
  }
  
  console.log(`${colors.cyan}[BACKEND] Using Python: ${pythonCommand}${colors.reset}`);
  
  // First, make sure port is free
  try {
    const portCheckProcess = spawn('lsof', ['-i', `:${BACKEND_PORT}`]);
    portCheckProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(`${colors.yellow}[BACKEND] Warning: Port ${BACKEND_PORT} is already in use. Backend may fail to start.${colors.reset}`);
      }
    });
  } catch (e) {
    // Ignore errors from lsof command
  }
  
  const backendProcess = spawn(pythonCommand, pythonArgs, {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: BACKEND_PORT.toString() },
    stdio: 'pipe'
  });

  processes.backend = backendProcess;

  let serverStarted = false;
  
  backendProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`${colors.green}[BACKEND] ${output}${colors.reset}`);
    
    // Check for indicators that server is running
    if (output.includes('Application startup complete') || 
        output.includes('Uvicorn running on') ||
        output.includes('Started server process')) {
      serverStarted = true;
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.log(`${colors.red}[BACKEND ERROR] ${data.toString().trim()}${colors.reset}`);
  });

  backendProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[BACKEND] Process exited with code ${code}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}[BACKEND] Process stopped${colors.reset}`);
    }
    processes.backend = null;
  });

  return new Promise((resolve, reject) => {
    // Check if server started within timeout period
    const timeout = setTimeout(() => {
      if (!serverStarted && processes.backend) {
        console.log(`${colors.yellow}[BACKEND] Server might not have started properly, but continuing anyway...${colors.reset}`);
        resolve();
      }
    }, 8000);
    
    // Monitor for specific output indicating server is ready
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Application startup complete') || 
          output.includes('Uvicorn running on')) {
        clearTimeout(timeout);
        console.log(`${colors.green}[SETUP] Backend server started successfully${colors.reset}`);
        resolve();
      }
    });
    
    // Handle early exit
    backendProcess.on('close', (code) => {
      if (code !== 0) {
        clearTimeout(timeout);
        console.log(`${colors.red}[BACKEND] Failed to start (code ${code})${colors.reset}`);
        console.log(`${colors.yellow}[SETUP] Attempting to restart backend...${colors.reset}`);
        
        // Try with direct python command as fallback
        const fallbackProcess = spawn('python', ['main.py'], {
          cwd: BACKEND_DIR,
          env: { ...process.env, PORT: BACKEND_PORT.toString() },
          stdio: 'pipe'
        });
        
        processes.backend = fallbackProcess;
        
        fallbackProcess.stdout.on('data', (data) => {
          console.log(`${colors.green}[BACKEND] ${data.toString().trim()}${colors.reset}`);
        });
        
        fallbackProcess.stderr.on('data', (data) => {
          console.log(`${colors.red}[BACKEND ERROR] ${data.toString().trim()}${colors.reset}`);
        });
        
        setTimeout(() => {
          console.log(`${colors.green}[SETUP] Continuing with setup...${colors.reset}`);
          resolve();
        }, 5000);
      }
    });
  });
}

/**
 * Start the Flutter mobile app
 */
function startMobileApp() {
  console.log(`${colors.cyan}[SETUP] Starting Flutter mobile app...${colors.reset}`);
  
  // First, list running simulators to find one we can use
  return new Promise((resolve) => {
    // Check if Flutter is installed
    const checkFlutterProcess = spawn('flutter', ['--version'], {
      stdio: 'pipe',
      shell: true
    });
    
    checkFlutterProcess.on('error', () => {
      console.error(`${colors.red}[MOBILE] Flutter not found. Make sure Flutter is installed and in your PATH.${colors.reset}`);
      resolve(); // Continue anyway
      return;
    });
    
    checkFlutterProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`${colors.red}[MOBILE] Flutter check failed with code ${code}${colors.reset}`);
        resolve(); // Continue anyway
        return;
      }
      
      // Get list of connected devices
      const devicesProcess = spawn('flutter', ['devices'], {
        stdio: 'pipe',
        shell: true
      });
      
      let devicesOutput = '';
      
      devicesProcess.stdout.on('data', (data) => {
        devicesOutput += data.toString();
      });
      
      devicesProcess.on('close', () => {
        // Launch Flutter app, let Flutter choose best device
        console.log(`${colors.cyan}[MOBILE] Launching Flutter app...${colors.reset}`);
        
        // Show detected devices
        if (devicesOutput) {
          console.log(`${colors.cyan}[MOBILE] Available devices:${colors.reset}`);
          console.log(`${colors.cyan}${devicesOutput}${colors.reset}`);
        }
        
        // If any iPhone simulator is running, use that
        let deviceId = null;
        if (devicesOutput.includes('iPhone') && devicesOutput.includes('simulator')) {
          const lines = devicesOutput.split('\n');
          for (const line of lines) {
            if (line.includes('iPhone') && line.includes('simulator')) {
              const match = line.match(/\s+([\w-]+)\s+\•/); // Extract device ID
              if (match && match[1]) {
                deviceId = match[1].trim();
                console.log(`${colors.green}[MOBILE] Found iPhone simulator: ${deviceId}${colors.reset}`);
                break;
              }
            }
          }
        }
        
        // Launch with specific device ID if found, otherwise let Flutter choose
        const flutterArgs = deviceId ? ['run', '-d', deviceId] : ['run'];
        
        const mobileProcess = spawn('flutter', flutterArgs, {
          cwd: MOBILE_APP_DIR,
          stdio: 'pipe',
          shell: true
        });
        
        processes.mobile = mobileProcess;
        
        let appStarted = false;
        
        mobileProcess.stdout.on('data', (data) => {
          const output = data.toString().trim();
          console.log(`${colors.blue}[MOBILE] ${output}${colors.reset}`);
          
          // Check for indicators that app is running
          if (output.includes('Syncing files to device') || 
              output.includes('Flutter run key commands') ||
              output.includes('Application started')) {
            appStarted = true;
          }
        });
        
        mobileProcess.stderr.on('data', (data) => {
          console.log(`${colors.red}[MOBILE ERROR] ${data.toString().trim()}${colors.reset}`);
        });
        
        mobileProcess.on('close', (code) => {
          if (code !== 0) {
            console.log(`${colors.red}[MOBILE] Process exited with code ${code}${colors.reset}`);
          } else {
            console.log(`${colors.yellow}[MOBILE] Process stopped${colors.reset}`);
          }
          processes.mobile = null;
        });
        
        // Set a timeout to continue if app doesn't start after a while
        const timeout = setTimeout(() => {
          if (!appStarted && processes.mobile) {
            console.log(`${colors.yellow}[MOBILE] App might not have started properly, but continuing anyway...${colors.reset}`);
          }
          resolve();
        }, 30000); // 30 seconds timeout
        
        // Resolve when we see that the app has started
        mobileProcess.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Syncing files to device') || output.includes('Flutter run key commands')) {
            clearTimeout(timeout);
            console.log(`${colors.green}[SETUP] Mobile app started successfully${colors.reset}`);
            resolve();
          }
        });
      });
    });
  });
}

/**
 * Start the Next.js web app
 */
function startNextApp() {
  console.log(`${colors.cyan}[SETUP] Starting Next.js web app on port ${NEXT_PORT}...${colors.reset}`);
  
  const nextProcess = spawn('npm', ['run', 'next', 'dev', '--', '--port', NEXT_PORT.toString()], {
    cwd: NEXT_APP_DIR,
    stdio: 'pipe',
    shell: true
  });

  processes.web = nextProcess;

  nextProcess.stdout.on('data', (data) => {
    console.log(`${colors.magenta}[WEB] ${data.toString().trim()}${colors.reset}`);
  });

  nextProcess.stderr.on('data', (data) => {
    console.log(`${colors.red}[WEB ERROR] ${data.toString().trim()}${colors.reset}`);
  });

  nextProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[WEB] Process exited with code ${code}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}[WEB] Process stopped${colors.reset}`);
    }
    processes.web = null;
  });

  return Promise.resolve();
}

/**
 * Clean up all child processes
 */
function cleanup() {
  console.log(`${colors.cyan}[SETUP] Shutting down all processes...${colors.reset}`);
  
  Object.keys(processes).forEach((key) => {
    const process = processes[key];
    if (process) {
      try {
        process.kill('SIGINT');
      } catch (e) {
        console.error(`${colors.red}[ERROR] Failed to kill ${key} process: ${e.message}${colors.reset}`);
      }
    }
  });
  
  rl.close();
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.cyan}
========================================================
🏥  Hospital FHIR Development Environment
========================================================
Backend: FastAPI (Port ${BACKEND_PORT})
Mobile: Flutter app connecting to backend
Web: Next.js (Port ${NEXT_PORT})
========================================================
${colors.reset}`);

  try {
    // Start processes in sequence
    await startBackend();
    await startMobileApp();
    // Uncomment the next line if you want to also start the Next.js app
    // await startNextApp();
    
    console.log(`${colors.green}
========================================================
✅ All services started successfully!
========================================================
Press Ctrl+C to stop all processes and exit
========================================================
${colors.reset}`);

    // Handle user input for commands
    rl.on('line', (input) => {
      if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
        cleanup();
      }
    });
    
  } catch (error) {
    console.error(`${colors.red}[ERROR] Setup failed: ${error.message}${colors.reset}`);
    cleanup();
  }
}

// Handle graceful exit
process.on('SIGINT', () => {
  console.log(`${colors.yellow}\n[SETUP] Received SIGINT. Cleaning up...${colors.reset}`);
  cleanup();
});

process.on('SIGTERM', () => {
  console.log(`${colors.yellow}\n[SETUP] Received SIGTERM. Cleaning up...${colors.reset}`);
  cleanup();
});

// Start everything
main();
