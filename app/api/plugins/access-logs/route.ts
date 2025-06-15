/**
 * API Route: /api/plugins/access-logs
 * 
 * Handles logging and retrieving plugin access to patient data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { logPatientAccess, getPatientAccessLogs, getHospitalPluginAccessLogs } from '@/lib/plugin-system/access-log';
import { prisma } from '@/lib/prisma';

// Schema for creating an access log
const createAccessLogSchema = z.object({
  patientId: z.string(),
  medicalNumber: z.string(),
  hospitalId: z.string(),
  pluginName: z.string(),
  pluginId: z.string().optional(),
  action: z.enum(['view', 'update', 'create', 'delete']),
  context: z.record(z.any()).optional(),
});

// Schema for querying access logs
const queryAccessLogsSchema = z.object({
  patientId: z.string().optional(),
  medicalNumber: z.string().optional(),
  hospitalId: z.string().optional(),
  pluginName: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0),
});

/**
 * POST: Create a new access log entry
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const validatedData = createAccessLogSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validatedData.error.format() 
      }, { status: 400 });
    }
    
    const { 
      patientId,
      medicalNumber,
      hospitalId,
      pluginName,
      pluginId: providedPluginId,
      action,
      context = {}
    } = validatedData.data;
    
    // Verify that the user has access to the patient and hospital
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Look up plugin ID if not provided
    let pluginId = providedPluginId;
    if (!pluginId) {
      const plugin = await prisma.plugin.findFirst({
        where: { name: pluginName }
      });
      
      if (!plugin) {
        return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
      }
      
      pluginId = plugin.id;
    }
    
    // Create access log entry
    const success = await logPatientAccess({
      patientId,
      medicalNumber,
      hospitalId,
      userId: session.user.id,
      pluginName,
      pluginId,
      action,
      context
    });
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to create access log' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error creating access log:', error);
    return NextResponse.json({ error: 'Failed to create access log' }, { status: 500 });
  }
}

/**
 * GET: Query access logs
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const query = queryAccessLogsSchema.safeParse(searchParams);
    
    if (!query.success) {
      return NextResponse.json({ 
        error: 'Invalid query parameters',
        details: query.error.format()
      }, { status: 400 });
    }
    
    const {
      patientId,
      medicalNumber,
      hospitalId,
      pluginName,
      action,
      startDate,
      endDate,
      limit,
      offset
    } = query.data;
    
    // Need either patientId, medicalNumber, or hospitalId+pluginName
    if (!patientId && !medicalNumber && !(hospitalId && pluginName)) {
      return NextResponse.json({ 
        error: 'Invalid query parameters: must provide patientId, medicalNumber, or both hospitalId and pluginName' 
      }, { status: 400 });
    }
    
    // Verify that the user has access to the requested data
    if (hospitalId) {
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
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
    
    let result;
    
    // Get patient access logs
    if (patientId) {
      result = await getPatientAccessLogs(patientId, {
        action,
        pluginName,
        hospitalId,
        startDate,
        endDate,
        limit,
        offset
      });
    } 
    // Get logs by medical number
    else if (medicalNumber) {
      // First get the patient by medical number
      const patient = await prisma.patient.findFirst({
        where: { medicalNumber }
      });
      
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      
      result = await getPatientAccessLogs(patient.id, {
        action,
        pluginName,
        hospitalId,
        startDate,
        endDate,
        limit,
        offset
      });
    }
    // Get hospital plugin access logs
    else if (hospitalId && pluginName) {
      result = await getHospitalPluginAccessLogs(hospitalId, pluginName, {
        action,
        startDate,
        endDate,
        limit,
        offset
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error querying access logs:', error);
    return NextResponse.json({ error: 'Failed to query access logs' }, { status: 500 });
  }
}
