import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

// For TypeScript support
interface ModuleInfo {
  name: string;
  version: string;
  description: string;
  author?: string;
  type: 'internal' | 'external';
  installPath: string;
  timestamp: string;
}

/**
 * Extract and install a module from a zip file
 * @param zipFilePath Path to the uploaded zip file
 * @returns Information about the installed module
 */
export async function extractAndInstallModule(zipFilePath: string): Promise<ModuleInfo> {
  try {
    // Open the zip file
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    
    // First, validate the zip content
    validateModuleZip(zip, zipEntries);
    
    // Read the module.json file to get module info
    const moduleJsonEntry = zipEntries.find(entry => entry.entryName.endsWith('module.json'));
    if (!moduleJsonEntry) {
      throw new Error('module.json file not found in the zip archive');
    }
    
    const moduleJsonContent = moduleJsonEntry.getData().toString('utf8');
    const moduleConfig = JSON.parse(moduleJsonContent);
    
    // Determine installation location (internal or external modules)
    const isInternal = determineModuleType(moduleConfig);
    
    const installPath = isInternal 
      ? path.join(__dirname, '../modules', moduleConfig.name)
      : path.join(__dirname, '../../private-modules', moduleConfig.name);
    
    // Create the module directory if it doesn't exist
    if (!fs.existsSync(installPath)) {
      fs.mkdirSync(installPath, { recursive: true });
    }
    
    // Extract the zip file to the target directory
    console.log(`Extracting module to ${installPath}`);
    zip.extractAllTo(installPath, true);
    
    // Update the module configuration file
    await updateModuleConfig({
      name: moduleConfig.name,
      version: moduleConfig.version,
      description: moduleConfig.description || '',
      author: moduleConfig.author,
      enabled: true
    });
    
    // Clean up the uploaded zip file
    fs.unlinkSync(zipFilePath);
    
    // Return information about the installed module
    return {
      name: moduleConfig.name,
      version: moduleConfig.version,
      description: moduleConfig.description || '',
      author: moduleConfig.author,
      type: isInternal ? 'internal' : 'external',
      installPath,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Module installation failed:', error);
    // Clean up any partial installation
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
    }
    throw error;
  }
}

/**
 * Validate the content of a module zip file
 */
function validateModuleZip(zip: AdmZip, zipEntries: AdmZip.IZipEntry[]): void {
  // Check if the zip file has any entries
  if (zipEntries.length === 0) {
    throw new Error('The zip file is empty');
  }
  
  // Check for required module.json file
  const hasModuleJson = zipEntries.some(entry => entry.entryName.endsWith('module.json'));
  if (!hasModuleJson) {
    throw new Error('module.json file is required but not found in the zip archive');
  }
  
  // Check for index.ts or index.js file (entry point)
  const hasIndexFile = zipEntries.some(entry => 
    entry.entryName.endsWith('index.ts') || entry.entryName.endsWith('index.js')
  );
  if (!hasIndexFile) {
    throw new Error('index.ts or index.js file is required but not found in the zip archive');
  }
  
  // Additional validation could be done here, such as checking for malicious code,
  // verifying digital signatures, etc.
}

/**
 * Determine whether a module should be installed as internal or external
 */
function determineModuleType(moduleConfig: any): boolean {
  // This could be based on a flag in the module.json, or other criteria
  // For now, we'll use a simple convention: modules with "premium" or "external" in their name
  // or with a "type" field set to "external" will be considered external
  
  const name = moduleConfig.name.toLowerCase();
  if (name.includes('premium') || name.includes('external')) {
    return false; // External module
  }
  
  if (moduleConfig.type === 'external') {
    return false; // External module
  }
  
  return true; // Internal module
}

/**
 * Update the module configuration file with the new module
 */
async function updateModuleConfig(moduleInfo: { 
  name: string;
  version: string;
  description: string;
  author?: string;
  enabled: boolean;
}): Promise<void> {
  const configPath = path.join(__dirname, '../moduleConfig.json');
  
  // Create default config if it doesn't exist
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ modules: [] }, null, 2));
  }
  
  // Read current config
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  
  // Check if module already exists in config
  const moduleIndex = config.modules.findIndex(m => m.name === moduleInfo.name);
  
  if (moduleIndex !== -1) {
    // Update existing module entry
    config.modules[moduleIndex] = {
      ...config.modules[moduleIndex],
      ...moduleInfo
    };
  } else {
    // Add new module entry
    config.modules.push(moduleInfo);
  }
  
  // Save updated config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Hot-reload a module without restarting the server
 * Note: This is a placeholder for now. Implementing true hot-reloading
 * would require additional infrastructure.
 */
export async function hotReloadModule(moduleName: string): Promise<boolean> {
  // This is a placeholder for the hot-reload functionality
  // In a real implementation, this would:
  // 1. Unload the existing module (removing routes, etc.)
  // 2. Clear the module from Node.js cache
  // 3. Load the updated module
  
  console.log(`Hot-reloading module: ${moduleName}`);
  return true;
}
