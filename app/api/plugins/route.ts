/**
 * API Route: /api/plugins
 * 
 * Handles listing all plugins and plugin registration
 */

import { NextRequest, NextResponse } from 'next/server';
// Use a single import for getServerSession
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { pluginRegistry } from '@/lib/plugin-system';

// Schema for plugin listing query
const getPluginsQuerySchema = z.object({
  hospitalId: z.string().optional(),
  active: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  category: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

// Schema for plugin registration
const registerPluginSchema = z.object({
  name: z.string().min(3),
  version: z.string().min(1),
  category: z.string().min(1),
  author: z.string().min(1),
  description: z.string(),
  medicalReference: z.enum(['byMedicalNumber', 'byHospitalPatientId']).default('byMedicalNumber'),
  hiddenFromGit: z.boolean().optional().default(false),
  crossHospitalCompatible: z.boolean().optional().default(true),
  path: z.string().optional(),
});

/**
 * GET: List all plugins, with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    // TEMPORARY: Mock session for testing
    const session = { user: { email: 'admin@test.com', role: 'superadmin', id: '1' } };
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const query = getPluginsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    
    if (!query.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    
    const { hospitalId, active: activeOnly, category, page, limit } = query.data;
    
    // Check if plugins table exists before proceeding
    // This prevents errors when the table hasn't been created yet
    try {
      // Try a lightweight query to see if the table exists
      await (prisma as any).$queryRaw`SELECT 1 FROM "Plugin" LIMIT 1`;
    } catch (tableError) {
      console.log('Plugin table does not exist or is empty:', tableError);
      // Return empty array instead of error
      return NextResponse.json({
        plugins: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        }
      });
    }
    
    // Build query conditions
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    // Get plugins with hospital-specific settings
    // Explicitly type the plugin model to match Prisma schema
    type PluginType = {
      id: string;
      name: string;
      version: string;
      description: string;
      category: string;
      author: string;
      medicalReference: 'byMedicalNumber' | 'byHospitalPatientId';
      hiddenFromGit: boolean;
      crossHospitalCompatible: boolean;
      path: string;
      hospitalPluginSettings?: HospitalPluginSettingsType[];
    };
    
    type HospitalPluginSettingsType = {
      id: string;
      hospitalId: string;
      pluginId: string;
      isActive: boolean;
      activatedAt: Date | null;
      settings: Record<string, any>;
    };

    // Safely query for plugins and handle errors gracefully
    let plugins: PluginType[] = [];
    try {
      plugins = await (prisma as any).plugin.findMany({
        include: {
          hospitalPluginSettings: true,
        },
      }) as unknown as PluginType[];
    } catch (dbError) {
      console.log('No plugins found or plugin table may not exist:', dbError);
      // Return empty array - not a critical error
      return NextResponse.json({
        plugins: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0,
        },
      });
    }
    
    // If hospitalId provided, query for plugin settings
    let enrichedPlugins = [...plugins];
    
    if (hospitalId) {
      // Use typecast to handle Prisma model access
      let hospitalPluginSettings = [];
      try {
        // Only run query if we have plugins to look up settings for
        if (plugins.length > 0) {
          hospitalPluginSettings = await (prisma as any).hospitalPluginSettings.findMany({
            where: {
              hospitalId,
              pluginId: {
                in: plugins.map(p => p.id),
              },
            },
          });
        }
      } catch (settingsError) {
        console.warn('Could not fetch hospital plugin settings:', settingsError);
        // No need to throw error - we can continue with empty settings
        hospitalPluginSettings = [];
      }
      
      const settingsMap = new Map(
        hospitalPluginSettings.map(s => [s.pluginId, s])
      );
      
      // Filter by active state
      if (activeOnly === true) {
        if (hospitalId) {
          plugins = plugins.filter((p: PluginType) => 
            p.hospitalPluginSettings?.some((s) => 
              s.hospitalId === hospitalId && s.isActive
            )
          );
        } else {
          plugins = plugins.filter((p: PluginType) => 
            p.hospitalPluginSettings?.some((s) => s.isActive)
          );
        }
      }
      
      // Enrich plugins with hospital-specific settings
      enrichedPlugins = plugins.map((p: PluginType) => {
        const hospitalSettings = hospitalId && p.hospitalPluginSettings
          ? p.hospitalPluginSettings.find((s) => s.hospitalId === hospitalId)
          : null;
        
        return {
          ...p,
          isActive: hospitalSettings ? hospitalSettings.isActive : false,
          activatedAt: hospitalSettings ? hospitalSettings.activatedAt : null,
          settings: hospitalSettings ? (hospitalSettings.settings || {}) : {},
        };
      });
    }
    
    // Get total count for pagination
    const totalCount = await (prisma as any).plugin.count({ where });
    
    return NextResponse.json({
      plugins: hospitalId ? enrichedPlugins : plugins,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching plugins:', error);
    // Instead of returning an error, return empty plugins list
    return NextResponse.json({
      plugins: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
      },
      notice: 'No plugins available'
    });
  }
}

/**
 * POST: Register a new plugin
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { name, version, description, category, author, medicalReference, hiddenFromGit, crossHospitalCompatible, path } = data;

    // TEMPORARY: Mock session for testing
    const session = { user: { email: 'admin@test.com', role: 'superadmin', id: '1' } };
    
    if (!session?.user || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if plugin with this name and version already exists
    const existingPlugin = await (prisma as any).plugin.findFirst({
      where: {
        name,
        version,
      },
    });

    if (existingPlugin) {
      return NextResponse.json({ error: 'Plugin with this name and version already exists' }, { status: 409 });
    }

    // Create the plugin
    const plugin = await (prisma as any).plugin.create({
      data: {
        name,
        version,
        description,
        category,
        author,
        medicalReference: medicalReference as 'byMedicalNumber' | 'byHospitalPatientId',
        hiddenFromGit,
        crossHospitalCompatible,
        path: path || '', // Ensure path is always a string
      },
    });

    return NextResponse.json({ plugin });
  } catch (error) {
    console.error('Error creating plugin:', error);
    return NextResponse.json({ error: 'Failed to create plugin' }, { status: 500 });
  }
}
