/**
 * Plugin Activation System
 * 
 * This module handles activating and deactivating plugins for specific hospitals.
 */

import { prisma } from '../database/prisma-client';
import { pluginRegistry } from './registry';
import { logPatientAccess } from './access-log';

/**
 * Activate a plugin for a specific hospital
 */
export async function activatePluginForHospital(
  pluginName: string, 
  hospitalId: string, 
  userId: string, 
  settings: Record<string, any> = {}
): Promise<boolean> {
  try {
    const plugin = pluginRegistry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }
    
    // Check if already activated
    const existing = await prisma.hospitalPluginSettings.findFirst({
      where: {
        hospitalId,
        pluginId: plugin.id
      }
    });
    
    if (existing?.isActive) {
      console.log(`Plugin ${pluginName} already active for hospital ${hospitalId}`);
      return true;
    }
    
    // Create or update settings
    await prisma.hospitalPluginSettings.upsert({
      where: {
        hospitalId_pluginId: {
          hospitalId,
          pluginId: plugin.id
        }
      },
      update: {
        isActive: true,
        settings: settings as any, // Type cast for Prisma Json field
        activatedById: userId,
        activatedAt: new Date(),
        modifiedAt: new Date()
      },
      create: {
        hospitalId,
        pluginId: plugin.id,
        pluginName,
        isActive: true,
        settings: settings as any, // Type cast for Prisma Json field
        activatedById: userId,
        activatedAt: new Date()
      }
    });
    
    console.log(`Activated plugin ${pluginName} for hospital ${hospitalId} by user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to activate plugin ${pluginName} for hospital ${hospitalId}:`, error);
    return false;
  }
}

/**
 * Deactivate a plugin for a specific hospital
 */
export async function deactivatePluginForHospital(
  pluginName: string, 
  hospitalId: string
): Promise<boolean> {
  try {
    const plugin = pluginRegistry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }
    
    // Update settings to inactive
    await prisma.hospitalPluginSettings.updateMany({
      where: {
        hospitalId,
        pluginId: plugin.id,
        isActive: true
      },
      data: {
        isActive: false,
        modifiedAt: new Date()
      }
    });
    
    console.log(`Deactivated plugin ${pluginName} for hospital ${hospitalId}`);
    return true;
  } catch (error) {
    console.error(`Failed to deactivate plugin ${pluginName} for hospital ${hospitalId}:`, error);
    return false;
  }
}

/**
 * Get the settings for a plugin in a specific hospital
 */
export async function getPluginSettings(
  pluginName: string, 
  hospitalId: string
): Promise<Record<string, any> | null> {
  try {
    const plugin = pluginRegistry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }
    
    const settings = await prisma.hospitalPluginSettings.findFirst({
      where: {
        hospitalId,
        pluginId: plugin.id,
        isActive: true
      }
    });
    
    if (!settings) {
      return null;
    }
    
    return settings.settings as Record<string, any>;
  } catch (error) {
    console.error(`Failed to get settings for plugin ${pluginName} in hospital ${hospitalId}:`, error);
    return null;
  }
}

/**
 * Update settings for a plugin in a specific hospital
 */
export async function updatePluginSettings(
  pluginName: string, 
  hospitalId: string, 
  settings: Record<string, any>
): Promise<boolean> {
  try {
    const plugin = pluginRegistry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }
    
    await prisma.hospitalPluginSettings.updateMany({
      where: {
        hospitalId,
        pluginId: plugin.id,
        isActive: true
      },
      data: {
        settings: settings as any, // Type cast for Prisma Json field
        modifiedAt: new Date()
      }
    });
    
    console.log(`Updated settings for plugin ${pluginName} in hospital ${hospitalId}`);
    return true;
  } catch (error) {
    console.error(`Failed to update settings for plugin ${pluginName} in hospital ${hospitalId}:`, error);
    return false;
  }
}

/**
 * Get all active plugins for a hospital
 */
export async function getActivePluginsForHospital(hospitalId: string) {
  try {
    const activePlugins = await prisma.hospitalPluginSettings.findMany({
      where: {
        hospitalId,
        isActive: true
      },
      include: {
        plugin: true
      }
    });
    
    return activePlugins.map(setting => ({
      id: setting.pluginId,
      name: setting.pluginName,
      settings: setting.settings,
      activatedAt: setting.activatedAt,
      plugin: {
        name: setting.plugin.name,
        version: setting.plugin.version,
        category: setting.plugin.category,
        author: setting.plugin.author,
        description: setting.plugin.description,
        path: setting.plugin.path
      }
    }));
  } catch (error) {
    console.error(`Failed to get active plugins for hospital ${hospitalId}:`, error);
    return [];
  }
}
