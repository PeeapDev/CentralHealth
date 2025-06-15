/**
 * Plugin Registration Script
 * 
 * This script manually registers a plugin in the database.
 * Usage: npx ts-node scripts/register-plugin.ts <plugin-path>
 * Example: npx ts-node scripts/register-plugin.ts plugins/premium/medication-reminder
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

async function registerPlugin(pluginPath: string): Promise<void> {
  try {
    console.log(`Attempting to register plugin from path: ${pluginPath}`);
    
    // Check if directory exists
    if (!fs.existsSync(pluginPath)) {
      throw new Error(`Plugin directory not found: ${pluginPath}`);
    }
    
    // Check for manifest file
    let manifestPath = path.join(pluginPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      manifestPath = path.join(pluginPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error(`No plugin.json or manifest.json found in ${pluginPath}`);
      }
    }
    
    // Read and parse manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate required fields
    if (!manifest.name || !manifest.version || !manifest.category) {
      throw new Error('Plugin manifest is missing required fields: name, version, and category');
    }
    
    // Check if plugin already exists
    const existingPlugin = await prisma.plugin.findFirst({
      where: {
        name: manifest.name,
        version: manifest.version,
      },
    });
    
    if (existingPlugin) {
      console.log(`Plugin ${manifest.name} v${manifest.version} is already registered with ID: ${existingPlugin.id}`);
      return;
    }
    
    // Create plugin in database
    const plugin = await prisma.plugin.create({
      data: {
        name: manifest.name,
        version: manifest.version,
        category: manifest.category || 'Other',
        author: manifest.author || 'Unknown',
        description: manifest.description || '',
        medicalReference: manifest.medicalReference || 'byMedicalNumber',
        hiddenFromGit: manifest.hiddenFromGit || false,
        crossHospitalCompatible: manifest.crossHospitalCompatible || true,
        path: pluginPath,
      }
    });
    
    console.log(`Successfully registered plugin: ${plugin.name} v${plugin.version}`);
    console.log(`Plugin ID: ${plugin.id}`);
    console.log(`To activate this plugin for a hospital, you need to create a HospitalPluginSettings record.`);
    
  } catch (error) {
    console.error('Error registering plugin:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const pluginPath = process.argv[2];
if (!pluginPath) {
  console.error('Please provide a plugin path as an argument');
  console.error('Usage: npx ts-node scripts/register-plugin.ts <plugin-path>');
  process.exit(1);
}

registerPlugin(path.resolve(pluginPath))
  .catch(console.error);
