/**
 * Medical ID Usage Audit Tool
 * 
 * This script analyzes the codebase for potential issues with medical ID handling,
 * focusing on compliance with the CentralHealth system rules:
 * 
 * 1. Medical IDs must NEVER be regenerated for existing patients
 * 2. Each patient receives ONE permanent medical ID for their lifetime
 * 3. All medical IDs must follow NHS-style 5-character alphanumeric format
 * 4. Medical IDs must be stored consistently in the mrn field
 * 5. No mock or test data allowed in production
 * 
 * Usage:
 *   npx ts-node scripts/audit-medical-id-usage.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Define colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Patterns to check for
const riskPatterns = {
  // Dangerous patterns that violate system rules
  highrisk: [
    // Risk: Generating a new medical ID for existing patients
    { pattern: /mrn\s*[:=]\s*generateMedicalID\(\)/g, description: 'Potentially regenerating medical ID for existing patient' },
    { pattern: /medicalNumber\s*[:=]\s*generateMedicalID\(\)/g, description: 'Potentially regenerating medical ID for existing patient' },
    { pattern: /Math\.random\(\)\.toString\(36\)\.substring/g, description: 'Using non-compliant random string as medical ID' },
    { pattern: /\.substring\(0,\s*[3-6]\)\.toUpperCase\(\)/g, description: 'Potential name-derived ID generation' },
    // Risk: Test data in production
    { pattern: /test(Patient|User|Medical).*Data/g, description: 'Possible test patient data' },
    { pattern: /mock(Patient|User|Medical).*Data/g, description: 'Possible mock patient data' },
    { pattern: /demo(Patient|User|Medical).*Data/g, description: 'Possible demo patient data' },
  ],
  
  // Patterns that need review but may be legitimate
  review: [
    { pattern: /mrn\s*[:=]/g, description: 'Setting medical record number' },
    { pattern: /medicalNumber\s*[:=]/g, description: 'Setting medical number' },
    { pattern: /medicalId\s*[:=]/g, description: 'Setting medical ID' },
    { pattern: /\.substring\(/g, description: 'String manipulation that might affect medical IDs' },
  ]
};

// Directories to exclude
const excludeDirs = [
  'node_modules',
  '.git',
  '.next',
  'venv',
  'dist',
  'build',
  'logs',
  'coverage'
];

// File extensions to check
const includeExtensions = [
  '.ts',
  '.js',
  '.tsx',
  '.jsx'
];

interface Finding {
  file: string;
  line: number;
  content: string;
  patternDescription: string;
  riskLevel: 'highrisk' | 'review';
}

interface FileStats {
  total: number;
  scanned: number;
  skipped: number;
  withFindings: number;
}

/**
 * Check if a file should be excluded based on its path
 */
function shouldSkipFile(filePath: string): boolean {
  // Skip excluded directories
  if (excludeDirs.some(dir => filePath.includes(`/${dir}/`))) {
    return true;
  }
  
  // Skip files with non-included extensions
  const ext = path.extname(filePath);
  if (!includeExtensions.includes(ext)) {
    return true;
  }
  
  return false;
}

/**
 * Scan a file for patterns that might indicate medical ID issues
 */
async function scanFile(filePath: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check each line against our patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check high-risk patterns
      for (const { pattern, description } of riskPatterns.highrisk) {
        if (pattern.test(line)) {
          findings.push({
            file: filePath,
            line: i + 1,
            content: line.trim(),
            patternDescription: description,
            riskLevel: 'highrisk'
          });
          // Reset lastIndex since we're reusing the regex
          pattern.lastIndex = 0;
        }
      }
      
      // Check patterns that need review
      for (const { pattern, description } of riskPatterns.review) {
        if (pattern.test(line)) {
          findings.push({
            file: filePath,
            line: i + 1,
            content: line.trim(),
            patternDescription: description,
            riskLevel: 'review'
          });
          // Reset lastIndex since we're reusing the regex
          pattern.lastIndex = 0;
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
  }
  
  return findings;
}

/**
 * Get all typescript/javascript files in a directory recursively
 */
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  // Use unix 'find' command for faster operation
  try {
    const { stdout } = await execPromise(`find ${dir} -type f -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules\\|.next\\|venv\\|dist\\|build\\|coverage"`);
    return stdout.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error using find command, falling back to recursive directory search');
    
    // Fallback to recursive directory search
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    
    for (const dirent of dirents) {
      const res = path.resolve(dir, dirent.name);
      if (dirent.isDirectory() && !excludeDirs.includes(dirent.name)) {
        files.push(...await getAllFiles(res));
      } else if (dirent.isFile() && includeExtensions.includes(path.extname(dirent.name))) {
        files.push(res);
      }
    }
    
    return files;
  }
}

/**
 * Main audit function
 */
async function auditMedicalIdUsage() {
  console.log(`${colors.blue}Starting Medical ID Usage Audit${colors.reset}`);
  console.log(`${colors.blue}Checking for compliance with CentralHealth system rules${colors.reset}`);
  
  const startTime = process.hrtime();
  const rootDir = process.cwd();
  
  // Get all relevant files
  console.log(`${colors.blue}Finding all TypeScript/JavaScript files...${colors.reset}`);
  const allFiles = await getAllFiles(rootDir);
  
  const stats: FileStats = {
    total: allFiles.length,
    scanned: 0,
    skipped: 0,
    withFindings: 0
  };
  
  console.log(`${colors.blue}Found ${stats.total} total files. Starting scan...${colors.reset}`);
  
  // Store all findings
  const allFindings: Finding[] = [];
  
  // Scan each file
  for (const file of allFiles) {
    if (shouldSkipFile(file)) {
      stats.skipped++;
      continue;
    }
    
    stats.scanned++;
    const findings = await scanFile(file);
    
    if (findings.length > 0) {
      stats.withFindings++;
      allFindings.push(...findings);
    }
    
    // Show progress every 100 files
    if (stats.scanned % 100 === 0) {
      console.log(`${colors.blue}Scanned ${stats.scanned} files...${colors.reset}`);
    }
  }
  
  // Sort findings by risk level (high-risk first)
  allFindings.sort((a, b) => {
    if (a.riskLevel === 'highrisk' && b.riskLevel !== 'highrisk') return -1;
    if (a.riskLevel !== 'highrisk' && b.riskLevel === 'highrisk') return 1;
    return 0;
  });
  
  // Print findings
  console.log(`\n${colors.blue}========== AUDIT RESULTS ===========${colors.reset}`);
  
  // Count findings by risk level
  const highRiskCount = allFindings.filter(f => f.riskLevel === 'highrisk').length;
  const reviewCount = allFindings.filter(f => f.riskLevel === 'review').length;
  
  console.log(`${colors.blue}Files analyzed: ${stats.scanned} (${stats.skipped} skipped)${colors.reset}`);
  console.log(`${colors.blue}Files with potential issues: ${stats.withFindings}${colors.reset}`);
  console.log(`${colors.red}High-risk findings: ${highRiskCount}${colors.reset}`);
  console.log(`${colors.yellow}Findings needing review: ${reviewCount}${colors.reset}`);
  
  // Print detailed findings
  if (allFindings.length > 0) {
    console.log(`\n${colors.blue}========== DETAILED FINDINGS ===========${colors.reset}\n`);
    
    for (const finding of allFindings) {
      const relativeFile = finding.file.replace(process.cwd(), '');
      const color = finding.riskLevel === 'highrisk' ? colors.red : colors.yellow;
      const riskLabel = finding.riskLevel === 'highrisk' ? 'HIGH RISK' : 'REVIEW';
      
      console.log(`${color}[${riskLabel}] ${relativeFile}:${finding.line}${colors.reset}`);
      console.log(`${color}Issue: ${finding.patternDescription}${colors.reset}`);
      console.log(`${colors.cyan}${finding.content}${colors.reset}`);
      console.log('');
    }
  }
  
  // Save findings to file
  const outputFile = path.join(rootDir, 'logs', `medical-id-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  
  // Ensure logs directory exists
  const logsDir = path.join(rootDir, 'logs');
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
  }
  
  await fs.writeFile(
    outputFile,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      findings: allFindings
    }, null, 2)
  );
  
  const elapsedTime = process.hrtime(startTime);
  const elapsedSeconds = (elapsedTime[0] + elapsedTime[1] / 1e9).toFixed(2);
  
  console.log(`\n${colors.green}Audit completed in ${elapsedSeconds} seconds${colors.reset}`);
  console.log(`${colors.green}Detailed findings saved to: ${outputFile}${colors.reset}`);
  
  // Provide recommendations based on findings
  if (highRiskCount > 0) {
    console.log(`\n${colors.red}CRITICAL: ${highRiskCount} high-risk findings detected!${colors.reset}`);
    console.log(`${colors.red}These issues may violate CentralHealth system rules for medical ID handling.${colors.reset}`);
    console.log(`${colors.red}Recommendation: Fix these issues immediately using proper medical ID generation practices.${colors.reset}`);
  }
  
  if (reviewCount > 0) {
    console.log(`\n${colors.yellow}WARNING: ${reviewCount} findings need manual review${colors.reset}`);
    console.log(`${colors.yellow}These may be legitimate uses but should be checked for compliance.${colors.reset}`);
    console.log(`${colors.yellow}Recommendation: Review each instance to ensure it follows CentralHealth rules.${colors.reset}`);
  }
  
  if (highRiskCount === 0 && reviewCount === 0) {
    console.log(`\n${colors.green}EXCELLENT: No potential medical ID issues found${colors.reset}`);
    console.log(`${colors.green}The codebase appears to follow CentralHealth system rules.${colors.reset}`);
  }
}

// Run the audit
auditMedicalIdUsage()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(`Error running audit:`, error);
    process.exit(1);
  });
