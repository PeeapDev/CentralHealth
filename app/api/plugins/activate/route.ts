/**
 * API Route: /api/plugins/activate
 * 
 * Handles plugin activation and deactivation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST: Activate or deactivate a plugin for a hospital
 */
export async function POST(req: NextRequest) {
  try {
    // TEMPORARY: Mock session for testing
    const session = { user: { email: 'admin@test.com', role: 'superadmin', id: 'admin-id' } };
    
    // Check if user is a superadmin
    if (session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only super admins can manage plugins' }, 
        { status: 403 }
      );
    }
    
    const data = await req.json();
    const { pluginId, hospitalId, active } = data;
    
    if (!pluginId || !hospitalId) {
      return NextResponse.json(
        { error: 'Missing required fields: pluginId, hospitalId' }, 
        { status: 400 }
      );
    }

    // Validate the plugin exists
    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' }, 
        { status: 404 }
      );
    }

    // Validate the hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' }, 
        { status: 404 }
      );
    }

    // Check if settings already exist
    const existingSettings = await prisma.hospitalPluginSettings.findUnique({
      where: {
        hospitalId_pluginId: {
          hospitalId,
          pluginId,
        }
      }
    });

    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await prisma.hospitalPluginSettings.update({
        where: {
          id: existingSettings.id,
        },
        data: {
          isActive: active === true,
          activatedAt: active === true ? new Date() : existingSettings.activatedAt,
          activatedById: active === true ? session.user.id : existingSettings.activatedById,
        },
      });

      return NextResponse.json({
        success: true,
        status: active === true ? 'activated' : 'deactivated',
        pluginId,
        hospitalId,
        settings: updatedSettings,
      });
    } else {
      // Create new settings
      const newSettings = await prisma.hospitalPluginSettings.create({
        data: {
          hospitalId,
          pluginId,
          pluginName: plugin.name,
          isActive: active === true,
          settings: {},
          activatedAt: active === true ? new Date() : null,
          activatedById: active === true ? session.user.id : null,
        },
      });

      return NextResponse.json({
        success: true,
        status: active === true ? 'activated' : 'deactivated',
        pluginId,
        hospitalId,
        settings: newSettings,
      });
    }
  } catch (error) {
    console.error('Error activating/deactivating plugin:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to process plugin activation request' }, 
      { status: 500 }
    );
  }
}
