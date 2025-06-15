/**
 * Plugin Activation Script
 * 
 * This script activates a registered plugin for a specific hospital.
 * Usage: npx ts-node scripts/activate-plugin.ts <plugin-name> <hospital-id> [user-id]
 * Example: npx ts-node scripts/activate-plugin.ts "Medication Reminder" 550e8400-e29b-41d4-a716-446655440000
 */

import { prisma } from '../lib/prisma';

async function activatePlugin(pluginName: string, hospitalId: string, userId?: string): Promise<void> {
  try {
    console.log(`Attempting to activate plugin ${pluginName} for hospital ${hospitalId}`);
    
    // Find the plugin by name (using the latest version if multiple exist)
    const plugin = await prisma.plugin.findFirst({
      where: {
        name: pluginName,
      },
      orderBy: {
        version: 'desc',
      },
    });
    
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found in the database`);
    }
    
    // Verify the hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: {
        id: hospitalId,
      },
    });
    
    if (!hospital) {
      throw new Error(`Hospital with ID "${hospitalId}" not found`);
    }
    
    // Check if the plugin is already activated for this hospital
    const existingSettings = await prisma.hospitalPluginSettings.findUnique({
      where: {
        hospitalId_pluginId: {
          hospitalId,
          pluginId: plugin.id,
        },
      },
    });
    
    if (existingSettings) {
      if (existingSettings.isActive) {
        console.log(`Plugin "${pluginName}" is already activated for hospital "${hospital.name}"`);
      } else {
        // Update existing settings to activate the plugin
        await prisma.hospitalPluginSettings.update({
          where: {
            id: existingSettings.id,
          },
          data: {
            isActive: true,
            activatedAt: new Date(),
            activatedById: userId,
          },
        });
        console.log(`Activated existing plugin "${pluginName}" for hospital "${hospital.name}"`);
      }
    } else {
      // Create new settings to activate the plugin
      await prisma.hospitalPluginSettings.create({
        data: {
          hospitalId,
          pluginId: plugin.id,
          pluginName: plugin.name,
          isActive: true,
          settings: {},
          activatedAt: new Date(),
          activatedById: userId,
        },
      });
      console.log(`Successfully activated plugin "${pluginName}" for hospital "${hospital.name}"`);
    }
    
  } catch (error) {
    console.error('Error activating plugin:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const pluginName = process.argv[2];
const hospitalId = process.argv[3];
const userId = process.argv[4];

if (!pluginName || !hospitalId) {
  console.error('Please provide both plugin name and hospital ID as arguments');
  console.error('Usage: npx ts-node scripts/activate-plugin.ts <plugin-name> <hospital-id> [user-id]');
  process.exit(1);
}

activatePlugin(pluginName, hospitalId, userId)
  .catch(console.error);
