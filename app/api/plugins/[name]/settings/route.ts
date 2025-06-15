/**
 * API Route: /api/plugins/[name]/settings
 * 
 * Handles plugin settings management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { updatePluginSettings, getPluginSettings } from '@/lib/plugin-system/activation';

// Schema for settings update request
const updateSettingsSchema = z.object({
  hospitalId: z.string(),
  settings: z.record(z.any()),
});

/**
 * GET: Get plugin settings for a hospital
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
    
    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital ID is required' }, { status: 400 });
    }
    
    // Verify user has permission to view settings for this hospital
    const userHasAccess = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        OR: [
          { role: 'superadmin' },
          { role: 'admin', hospitalId },
          { hospitalId }
        ]
      }
    });
    
    if (!userHasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions for this hospital' }, { status: 403 });
    }
    
    // Get plugin settings
    const settings = await getPluginSettings(pluginName, hospitalId);
    
    // Check if the plugin is active
    const pluginSettings = await prisma.hospitalPluginSettings.findFirst({
      where: {
        hospitalId,
        pluginName,
      },
      select: {
        isActive: true,
        activatedAt: true
      }
    });
    
    return NextResponse.json({
      settings: settings || {},
      isActive: pluginSettings?.isActive || false,
      activatedAt: pluginSettings?.activatedAt || null,
    });
  } catch (error) {
    console.error(`Error getting settings for plugin ${params.name}:`, error);
    return NextResponse.json({ error: 'Failed to get plugin settings' }, { status: 500 });
  }
}

/**
 * PUT: Update plugin settings for a hospital
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
    const validatedData = updateSettingsSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validatedData.error.format() 
      }, { status: 400 });
    }
    
    const { hospitalId, settings } = validatedData.data;
    
    // Verify user has permission to update settings for this hospital
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
    
    // Check if the plugin is active
    const pluginSettings = await prisma.hospitalPluginSettings.findFirst({
      where: {
        hospitalId,
        pluginName,
        isActive: true
      }
    });
    
    if (!pluginSettings) {
      return NextResponse.json({ error: 'Plugin is not active for this hospital' }, { status: 400 });
    }
    
    // Update plugin settings
    const success = await updatePluginSettings(pluginName, hospitalId, settings);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update plugin settings' }, { status: 500 });
    }
    
    // Get updated settings
    const updatedSettings = await getPluginSettings(pluginName, hospitalId);
    
    return NextResponse.json({
      success: true,
      settings: updatedSettings || {},
    });
  } catch (error) {
    console.error(`Error updating settings for plugin ${params.name}:`, error);
    return NextResponse.json({ error: 'Failed to update plugin settings' }, { status: 500 });
  }
}
