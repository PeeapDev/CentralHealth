import { Express } from 'express';
import fs from 'fs';
import path from 'path';

interface ModuleConfig {
  name: string;
  enabled: boolean;
  path?: string;
}

/**
 * Load and register all enabled modules
 * @param app Express application
 * @param configPath Path to the module configuration file
 */
export async function loadModules(app: Express, configPath: string = path.join(__dirname, 'moduleConfig.json')): Promise<string[]> {
  const loadedModules: string[] = [];
  
  try {
    // Load module configuration
    let moduleConfig: ModuleConfig[] = [];
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      moduleConfig = JSON.parse(configContent);
      console.log(`Loaded module configuration from ${configPath}`);
    } else {
      console.warn(`Module configuration file not found at ${configPath}. Loading all available modules.`);
      
      // If no config file exists, scan directories and enable all modules
      moduleConfig = await scanForModules();
    }
    
    // Load internal modules (from /hospital-fhir/modules)
    const internalModulesDir = path.join(__dirname, 'modules');
    await loadModulesFromDirectory(app, internalModulesDir, moduleConfig, loadedModules);
    
    // Load external modules (from /hospital/private-modules)
    const externalModulesDir = path.join(__dirname, '..', 'private-modules');
    await loadModulesFromDirectory(app, externalModulesDir, moduleConfig, loadedModules);
    
    console.log(`Successfully loaded ${loadedModules.length} modules: ${loadedModules.join(', ')}`);
    return loadedModules;
    
  } catch (error) {
    console.error('Error loading modules:', error);
    return loadedModules;
  }
}

/**
 * Load modules from a specific directory
 */
async function loadModulesFromDirectory(
  app: Express, 
  directory: string, 
  config: ModuleConfig[], 
  loadedModules: string[]
): Promise<void> {
  if (!fs.existsSync(directory)) {
    console.log(`Directory does not exist: ${directory}`);
    return;
  }
  
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const moduleName = entry.name;
    const moduleDir = path.join(directory, moduleName);
    
    // Check if module is enabled in config
    const moduleConfig = config.find(m => m.name === moduleName);
    if (moduleConfig && moduleConfig.enabled === false) {
      console.log(`Module ${moduleName} is disabled, skipping`);
      continue;
    }
    
    // Check for index.ts or index.js file
    const indexTs = path.join(moduleDir, 'index.ts');
    const indexJs = path.join(moduleDir, 'index.js');
    
    let indexPath = '';
    if (fs.existsSync(indexTs)) {
      indexPath = indexTs;
    } else if (fs.existsSync(indexJs)) {
      indexPath = indexJs;
    } else {
      console.warn(`Module ${moduleName} does not have an index.ts or index.js file, skipping`);
      continue;
    }
    
    try {
      // Import the module dynamically
      const moduleExports = await import(indexPath);
      
      // Check if it exports a register function
      if (typeof moduleExports.default === 'function') {
        // Register the module with the app
        moduleExports.default(app);
        loadedModules.push(moduleName);
        console.log(`Successfully loaded module: ${moduleName}`);
      } else {
        console.warn(`Module ${moduleName} does not export a default register function, skipping`);
      }
    } catch (error) {
      console.error(`Error loading module ${moduleName}:`, error);
    }
  }
}

/**
 * Scan for available modules in both internal and external directories
 */
async function scanForModules(): Promise<ModuleConfig[]> {
  const config: ModuleConfig[] = [];
  const directories = [
    path.join(__dirname, 'modules'), // Internal modules
    path.join(__dirname, '..', 'private-modules') // External modules
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        config.push({
          name: entry.name,
          enabled: true,
          path: path.join(dir, entry.name)
        });
      }
    }
  }
  
  return config;
}
