/**
 * Plugin Loader
 * 
 * This module handles loading plugins from the filesystem and registering them with the registry.
 */

import fs from 'fs';
import path from 'path';
import { pluginRegistry, PluginManifest } from './registry';

/**
 * Load a plugin from a directory path
 */
export async function loadPluginFromPath(pluginPath: string): Promise<string | null> {
  try {
    // Check if plugin.json or manifest.json exists
    let manifestPath = path.join(pluginPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      // Try alternative manifest filename
      manifestPath = path.join(pluginPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error(`No plugin.json or manifest.json found at ${pluginPath}`);
      }
    }
    
    // Read and parse manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    let manifest: PluginManifest;
    
    try {
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      throw new Error(`Invalid JSON in manifest file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Validate required fields
    if (!manifest.name || !manifest.version || !manifest.category) {
      throw new Error('Plugin manifest must include name, version, and category fields');
    }
    
    // Verify required directories and files exist
    const requiredFiles = [
      manifest.analytics?.patient && path.join(pluginPath, manifest.analytics.patient),
      manifest.analytics?.staff && path.join(pluginPath, manifest.analytics.staff),
      manifest.analytics?.hospital && path.join(pluginPath, manifest.analytics.hospital),
      manifest.analytics?.central && path.join(pluginPath, manifest.analytics.central),
      manifest.setupWizard && path.join(pluginPath, manifest.setupWizard),
      manifest.mainScreen && path.join(pluginPath, manifest.mainScreen),
    ].filter(Boolean);
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.warn(`Warning: Referenced file ${file} does not exist in plugin ${manifest.name}`);
      }
    }
    
    // Register plugin with registry
    const pluginId = await pluginRegistry.registerPlugin({
      name: manifest.name,
      version: manifest.version,
      category: manifest.category,
      author: manifest.author || 'Unknown',
      description: manifest.description || '',
      medicalReference: manifest.medicalReference || 'byMedicalNumber',
      hiddenFromGit: manifest.hiddenFromGit || false,
      crossHospitalCompatible: manifest.crossHospitalCompatible || true,
      path: pluginPath,
    });
    
    console.log(`Loaded plugin ${manifest.name} v${manifest.version} from ${pluginPath}`);
    return pluginId;
  } catch (error) {
    console.error(`Failed to load plugin from ${pluginPath}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Scan plugin directories and load all discovered plugins
 */
export async function scanPluginDirectories(): Promise<void> {
  const directories = [
    path.join(process.cwd(), 'plugins/core'),
    path.join(process.cwd(), 'plugins/premium'),
    path.join(process.cwd(), 'plugins/development'),
  ];
  
  console.log('Scanning for plugins in directories:', directories);
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`Plugin directory ${dir} does not exist, skipping`);
      continue;
    }
    
    const pluginDirs = fs.readdirSync(dir);
    
    for (const pluginDir of pluginDirs) {
      const fullPath = path.join(dir, pluginDir);
      if (fs.statSync(fullPath).isDirectory()) {
        await loadPluginFromPath(fullPath);
      }
    }
  }
}

/**
 * Initialize the plugin system by loading all plugins
 */
export async function initializePluginSystem(): Promise<void> {
  console.log('Initializing plugin system...');
  
  // Create plugin directories if they don't exist
  const directories = [
    path.join(process.cwd(), 'plugins'),
    path.join(process.cwd(), 'plugins/core'),
    path.join(process.cwd(), 'plugins/premium'),
    path.join(process.cwd(), 'plugins/development'),
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating plugin directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Load plugins from database first
  await pluginRegistry.loadPlugins();
  
  // Then scan filesystem for any new plugins
  await scanPluginDirectories();
  
  console.log('Plugin system initialized');
}
