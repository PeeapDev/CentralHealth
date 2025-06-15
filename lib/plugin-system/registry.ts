/**
 * Plugin Registry
 * 
 * This module handles the registration and management of plugins in the system.
 */

import { prisma } from '../prisma';
import { Plugin } from '../generated/prisma';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  category: string;
  author: string;
  description: string;
  medicalReference: string;
  hiddenFromGit: boolean;
  crossHospitalCompatible: boolean;
  path: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  category: string;
  author: string;
  description: string;
  medicalReference: 'byMedicalNumber' | 'byHospitalPatientId';
  hiddenFromGit: boolean;
  crossHospitalCompatible: boolean;
  analytics: {
    patient: string;
    staff: string;
    hospital: string;
    central: string;
  };
  setupWizard: string;
  mainScreen: string;
  additionalScreens?: Record<string, string>;
  sidebarIcon: string;
  requiredPermissions: string[];
}

export interface PluginContext {
  hospital: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    role: string;
  };
  settings: Record<string, any>;
}

/**
 * Plugin Registry class for managing plugins in the system
 */
class PluginRegistry {
  private plugins: Map<string, PluginInfo> = new Map();
  private initialized: boolean = false;
  
  /**
   * Load all registered plugins from the database
   */
  async loadPlugins(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Load all registered plugins from database
      const dbPlugins = await prisma.plugin.findMany();
      
      for (const plugin of dbPlugins) {
        this.plugins.set(plugin.name, {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          category: plugin.category,
          author: plugin.author,
          description: plugin.description,
          medicalReference: plugin.medicalReference,
          hiddenFromGit: plugin.hiddenFromGit,
          crossHospitalCompatible: plugin.crossHospitalCompatible,
          path: plugin.path,
        });
      }
      
      this.initialized = true;
      console.log(`Loaded ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  }
  
  /**
   * Get a plugin by name
   */
  getPlugin(name: string): PluginInfo | undefined {
    return this.plugins.get(name);
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get all active plugins for a specific hospital
   */
  async getActivePluginsForHospital(hospitalId: string): Promise<PluginInfo[]> {
    try {
      const activeSettings = await prisma.hospitalPluginSettings.findMany({
        where: {
          hospitalId,
          isActive: true,
        },
        include: {
          plugin: true,
        },
      });
      
      return activeSettings.map(setting => ({
        id: setting.plugin.id,
        name: setting.plugin.name,
        version: setting.plugin.version,
        category: setting.plugin.category,
        author: setting.plugin.author,
        description: setting.plugin.description,
        medicalReference: setting.plugin.medicalReference,
        hiddenFromGit: setting.plugin.hiddenFromGit,
        crossHospitalCompatible: setting.plugin.crossHospitalCompatible,
        path: setting.plugin.path,
      }));
    } catch (error) {
      console.error('Failed to get active plugins for hospital:', error);
      return [];
    }
  }
  
  /**
   * Register a new plugin in the system
   */
  async registerPlugin(pluginInfo: Omit<PluginInfo, 'id'>): Promise<string> {
    try {
      // Check if plugin with same name and version already exists
      const existingPlugin = await prisma.plugin.findFirst({
        where: {
          name: pluginInfo.name,
          version: pluginInfo.version,
        },
      });
      
      if (existingPlugin) {
        console.log(`Plugin ${pluginInfo.name} v${pluginInfo.version} already registered`);
        return existingPlugin.id;
      }
      
      // Create plugin record in database
      const plugin = await prisma.plugin.create({
        data: {
          name: pluginInfo.name,
          version: pluginInfo.version,
          category: pluginInfo.category || 'Other',
          author: pluginInfo.author || 'Unknown',
          description: pluginInfo.description || '',
          medicalReference: pluginInfo.medicalReference || 'byMedicalNumber',
          hiddenFromGit: pluginInfo.hiddenFromGit || false,
          crossHospitalCompatible: pluginInfo.crossHospitalCompatible || true,
          path: pluginInfo.path,
        }
      });
      
      // Add to in-memory registry
      this.plugins.set(plugin.name, {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        category: plugin.category,
        author: plugin.author,
        description: plugin.description,
        medicalReference: plugin.medicalReference,
        hiddenFromGit: plugin.hiddenFromGit,
        crossHospitalCompatible: plugin.crossHospitalCompatible,
        path: plugin.path,
      });
      
      console.log(`Registered plugin ${plugin.name} v${plugin.version}`);
      return plugin.id;
    } catch (error) {
      console.error('Failed to register plugin:', error);
      throw new Error(`Failed to register plugin: ${error.message}`);
    }
  }
  
  /**
   * Update an existing plugin
   */
  async updatePlugin(id: string, updates: Partial<Omit<PluginInfo, 'id'>>): Promise<boolean> {
    try {
      const plugin = await prisma.plugin.update({
        where: { id },
        data: updates,
      });
      
      if (plugin) {
        // Update in-memory registry
        const existingInfo = this.plugins.get(plugin.name);
        if (existingInfo) {
          this.plugins.set(plugin.name, { ...existingInfo, ...updates });
        }
        
        console.log(`Updated plugin ${plugin.name}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to update plugin ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Unregister a plugin from the system
   */
  async unregisterPlugin(id: string): Promise<boolean> {
    try {
      // First find the plugin to get its name
      const plugin = await prisma.plugin.findUnique({
        where: { id },
      });
      
      if (!plugin) {
        console.error(`Plugin with ID ${id} not found`);
        return false;
      }
      
      // Check if plugin is active in any hospital
      const activeSettings = await prisma.hospitalPluginSettings.findFirst({
        where: {
          pluginId: id,
          isActive: true,
        },
      });
      
      if (activeSettings) {
        console.error(`Cannot unregister plugin ${plugin.name} because it is active in at least one hospital`);
        return false;
      }
      
      // Delete plugin from database
      await prisma.plugin.delete({
        where: { id },
      });
      
      // Remove from in-memory registry
      this.plugins.delete(plugin.name);
      
      console.log(`Unregistered plugin ${plugin.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to unregister plugin ${id}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistry();
