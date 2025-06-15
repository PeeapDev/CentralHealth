/**
 * API Route: /api/plugins/[name]
 * 
 * Handles operations on a specific plugin by name
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { pluginRegistry } from '@/lib/plugin-system';
import { activatePluginForHospital, deactivatePluginForHospital } from '@/lib/plugin-system/activation';

// Schema for activation/deactivation request
const pluginActionSchema = z.object({
  hospitalId: z.string(),
  settings: z.record(z.any()).optional(),
});

/**
 * GET: Get information about a specific plugin
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const pluginName = decodeURIComponent(params.name);
    
    // Parse query parameters
    const url = new URL(req.url);
    const hospitalId = url.searchParams.get('hospitalId');
    
    // Find the plugin in the database
    const plugin = await prisma.plugin.findFirst({
      where: {
        name: pluginName,
      },
    });
    
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }
    
    // If hospitalId provided, get hospital-specific settings
    let settings = {};
    let isActive = false;
    let activatedAt = null;
    
    if (hospitalId) {
      const hospitalSettings = await prisma.hospitalPluginSettings.findFirst({
        where: {
          hospitalId,
          pluginId: plugin.id,
        },
      });
      
      if (hospitalSettings) {
        settings = hospitalSettings.settings;
        isActive = hospitalSettings.isActive;
        activatedAt = hospitalSettings.activatedAt;
      }
    }
    
    return NextResponse.json({
      plugin,
      isActive,
      activatedAt,
      settings,
    });
  } catch (error) {
    console.error(`Error fetching plugin ${params.name}:`, error);
    return NextResponse.json({ error: 'Failed to fetch plugin' }, { status: 500 });
  }
}

/**
 * PUT: Activate a plugin for a hospital
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const pluginName = decodeURIComponent(params.name);
    
    // Parse request body
    const body = await req.json();
    const validatedData = pluginActionSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validatedData.error.format() 
      }, { status: 400 });
    }
    
    const { hospitalId, settings } = validatedData.data;
    
    // Verify user has permission to manage plugins for this hospital
    // This is a simplified check - you may need more complex authorization logic
    const userHasAccess = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        OR: [
          { role: 'superadmin' },
          { role: 'admin', hospitalId }
        ]
      }
    });
    
    if (!userHasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions for this hospital' }, { status: 403 });
    }
    
    // Activate the plugin
    const success = await activatePluginForHospital(
      pluginName,
      hospitalId,
      session.user.id,
      settings || {}
    );
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to activate plugin' }, { status: 500 });
    }
    
    // Get updated settings
    const hospitalSettings = await prisma.hospitalPluginSettings.findFirst({
      where: {
        hospitalId,
        pluginName,
      },
      include: {
        plugin: true,
      }
    });
    
    return NextResponse.json({
      success: true,
      isActive: true,
      settings: hospitalSettings?.settings || {},
      activatedAt: hospitalSettings?.activatedAt,
      plugin: hospitalSettings?.plugin,
    });
  } catch (error) {
    console.error(`Error activating plugin ${params.name}:`, error);
    return NextResponse.json({ error: 'Failed to activate plugin' }, { status: 500 });
  }
}

/**
 * DELETE: Deactivate a plugin for a hospital
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const pluginName = decodeURIComponent(params.name);
    
    // Parse query parameters
    const url = new URL(req.url);
    const hospitalId = url.searchParams.get('hospitalId');
    
    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital ID is required' }, { status: 400 });
    }
    
    // Verify user has permission to manage plugins for this hospital
    // This is a simplified check - you may need more complex authorization logic
    const userHasAccess = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        OR: [
          { role: 'superadmin' },
          { role: 'admin', hospitalId }
        ]
      }
    });
    
    if (!userHasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions for this hospital' }, { status: 403 });
    }
    
    // Deactivate the plugin
    const success = await deactivatePluginForHospital(pluginName, hospitalId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to deactivate plugin' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      isActive: false,
    });
  } catch (error) {
    console.error(`Error deactivating plugin ${params.name}:`, error);
    return NextResponse.json({ error: 'Failed to deactivate plugin' }, { status: 500 });
  }
}
