# Hospital Plugin System: Implementation Roadmap

This document outlines the steps required to implement the plugin system in the hospital FHIR application.

## Phase 1: Database Schema & Core Architecture

1. **Add Plugin Models to Schema**
   - Add the plugin models from `plugin-models.prisma` to your main `schema.prisma` file
   - Run migration: `npx prisma migrate dev --name add_plugin_system`
   - Update affected TypeScript types

2. **Create Plugin Directory Structure**
   - Create the following directories:
     ```
     /plugins/
     ├── premium/        # For proprietary plugins
     ├── core/           # For built-in plugins
     └── development/    # For plugins under development
     ```

3. **Implement Core Plugin Engine**
   - Create the plugin registry system
   - Implement plugin loading/unloading
   - Add plugin lifecycle hooks

## Phase 2: Plugin API & Discovery

1. **Plugin Manifest Handler**
   - Parse and validate `plugin.json` files
   - Register plugins in the database
   - Handle version management

2. **Plugin Upload API**
   - Admin endpoint for uploading plugins
   - Zip extraction and validation
   - Security checks

3. **Hospital-Specific Plugin Settings**
   - API for reading/writing hospital plugin settings
   - Permission system integration

## Phase 3: Plugin UI & Integration

1. **Plugin Discovery UI**
   - "Apps" section in hospital admin dashboard
   - Plugin activation/deactivation UI
   - Setup wizard integration

2. **Plugin Component Registry**
   - Dynamic importing of plugin components
   - React context for plugin settings
   - Navigation integration

3. **Analytics Integration**
   - Dashboard integration for plugin analytics
   - Data visualization components

## Phase 4: Patient Access & Cross-Hospital Features

1. **Patient Access Logging**
   - Implement access logging middleware
   - Audit trail UI

2. **Cross-Hospital Patient Access**
   - medicalNumber-based patient lookup
   - Data synchronization system

3. **Plugin Data Models**
   - Plugin-specific data tables
   - FHIR resource extension system

## Phase 5: Offline Support & Synchronization

1. **Offline Plugin Support**
   - Offline data caching
   - Background synchronization

2. **Conflict Resolution**
   - Implement merge strategies
   - User-facing conflict resolution UI

3. **Plugin Update System**
   - Version management
   - Update notifications

## Implementation Timeline

| Phase | Tasks | Est. Time | Dependencies |
|-------|-------|-----------|-------------|
| 1 | Database Schema & Core Architecture | 2 weeks | None |
| 2 | Plugin API & Discovery | 3 weeks | Phase 1 |
| 3 | Plugin UI & Integration | 4 weeks | Phase 2 |
| 4 | Patient Access & Cross-Hospital | 3 weeks | Phase 3 |
| 5 | Offline Support & Sync | 4 weeks | Phase 4 |

## Critical Implementation Components

### 1. Plugin Registry

```typescript
// /lib/plugin-system/registry.ts
import { prisma } from '@/lib/prisma';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  path: string;
  // other properties...
}

class PluginRegistry {
  private plugins: Map<string, PluginInfo> = new Map();
  
  async loadPlugins(): Promise<void> {
    try {
      // Load all registered plugins from database
      const dbPlugins = await prisma.plugin.findMany();
      
      for (const plugin of dbPlugins) {
        this.plugins.set(plugin.name, {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          path: plugin.path,
          // other properties
        });
      }
      
      console.log(`Loaded ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  }
  
  getPlugin(name: string): PluginInfo | undefined {
    return this.plugins.get(name);
  }
  
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }
  
  async registerPlugin(pluginInfo: Omit<PluginInfo, 'id'>): Promise<string> {
    try {
      // Create plugin record in database
      const plugin = await prisma.plugin.create({
        data: {
          name: pluginInfo.name,
          version: pluginInfo.version,
          category: pluginInfo.category || 'Other',
          author: pluginInfo.author || 'Unknown',
          description: pluginInfo.description || '',
          path: pluginInfo.path,
          // other fields...
        }
      });
      
      // Add to in-memory registry
      this.plugins.set(plugin.name, {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        path: plugin.path,
        // other properties
      });
      
      return plugin.id;
    } catch (error) {
      console.error('Failed to register plugin:', error);
      throw new Error(`Failed to register plugin: ${error.message}`);
    }
  }
  
  // Additional methods for unregistering, updating...
}

export const pluginRegistry = new PluginRegistry();
```

### 2. Plugin Loader

```typescript
// /lib/plugin-system/loader.ts
import fs from 'fs';
import path from 'path';
import { pluginRegistry } from './registry';

export async function loadPluginFromPath(pluginPath: string): Promise<string | null> {
  try {
    // Check if plugin.json exists
    const manifestPath = path.join(pluginPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`No plugin.json found at ${manifestPath}`);
    }
    
    // Parse manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate required fields
    if (!manifest.name || !manifest.version) {
      throw new Error('Plugin manifest must include name and version');
    }
    
    // Register plugin
    const pluginId = await pluginRegistry.registerPlugin({
      name: manifest.name,
      version: manifest.version,
      category: manifest.category || 'Other',
      author: manifest.author || 'Unknown',
      description: manifest.description || '',
      path: pluginPath,
      // other fields from manifest...
    });
    
    console.log(`Registered plugin ${manifest.name} v${manifest.version}`);
    return pluginId;
  } catch (error) {
    console.error(`Failed to load plugin from ${pluginPath}:`, error);
    return null;
  }
}

export async function scanPluginDirectories(): Promise<void> {
  const directories = [
    path.join(process.cwd(), 'plugins/core'),
    path.join(process.cwd(), 'plugins/premium'),
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;
    
    const pluginDirs = fs.readdirSync(dir);
    
    for (const pluginDir of pluginDirs) {
      const fullPath = path.join(dir, pluginDir);
      if (fs.statSync(fullPath).isDirectory()) {
        await loadPluginFromPath(fullPath);
      }
    }
  }
}
```

### 3. Hospital Plugin Activation

```typescript
// /lib/plugin-system/activation.ts
import { prisma } from '@/lib/prisma';
import { pluginRegistry } from './registry';

export async function activatePluginForHospital(pluginName: string, hospitalId: string, userId: string, settings: any = {}): Promise<boolean> {
  try {
    const plugin = pluginRegistry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }
    
    // Check if already activated
    const existing = await prisma.hospitalPluginSettings.findUnique({
      where: {
        hospitalId_pluginId: {
          hospitalId,
          pluginId: plugin.id
        }
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
        settings,
        activatedById: userId,
        activatedAt: new Date(),
        modifiedAt: new Date()
      },
      create: {
        hospitalId,
        pluginId: plugin.id,
        pluginName,
        isActive: true,
        settings,
        activatedById: userId,
        activatedAt: new Date()
      }
    });
    
    console.log(`Activated plugin ${pluginName} for hospital ${hospitalId}`);
    return true;
  } catch (error) {
    console.error(`Failed to activate plugin ${pluginName} for hospital ${hospitalId}:`, error);
    return false;
  }
}

export async function deactivatePluginForHospital(pluginName: string, hospitalId: string): Promise<boolean> {
  try {
    const plugin = pluginRegistry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }
    
    // Update settings to inactive
    await prisma.hospitalPluginSettings.update({
      where: {
        hospitalId_pluginId: {
          hospitalId,
          pluginId: plugin.id
        }
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
```

## Next Steps

After implementing the core plugin architecture, you should:

1. Create a reference implementation plugin
2. Develop the admin UI for plugin management
3. Document the plugin API for third-party developers
4. Set up a testing environment for plugin validation
5. Implement analytics integration for plugin usage tracking

With these steps completed, your hospital system will have a robust plugin architecture that allows for extensibility while maintaining FHIR compliance and cross-hospital compatibility.

## Resources

- FHIR Plugin Best Practices: [https://www.hl7.org/fhir/extensibility.html](https://www.hl7.org/fhir/extensibility.html)
- DHIS2 App Platform: [https://developers.dhis2.org/docs/app-platform/getting-started](https://developers.dhis2.org/docs/app-platform/getting-started)
- Next.js Dynamic Import: [https://nextjs.org/docs/advanced-features/dynamic-import](https://nextjs.org/docs/advanced-features/dynamic-import)
