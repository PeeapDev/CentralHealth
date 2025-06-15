/**
 * Plugin Access Logging System
 * 
 * This module handles logging all plugin access to patient data.
 * All plugin interactions with patient data MUST use this system to ensure
 * proper tracking of data access across hospitals.
 */

import { prisma } from '../prisma';

export interface AccessLogContext {
  [key: string]: any;
}

/**
 * Log an access to patient data by a plugin
 */
export async function logPatientAccess({
  patientId,
  medicalNumber,
  hospitalId,
  userId,
  pluginName,
  pluginId,
  action,
  context = {}
}: {
  patientId: string,
  medicalNumber: string,
  hospitalId: string,
  userId: string,
  pluginName: string,
  pluginId: string,
  action: 'view' | 'update' | 'create' | 'delete',
  context?: AccessLogContext
}): Promise<boolean> {
  try {
    await prisma.patientAccessLog.create({
      data: {
        patientId,
        medicalNumber,
        hospitalId,
        userId,
        pluginId,
        pluginName,
        action,
        context: context as any, // Type cast for Prisma Json field
        timestamp: new Date()
      }
    });
    
    console.log(`Access logged: ${pluginName} ${action} for patient ${patientId} by user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to log patient access:', error);
    // Don't block operation if logging fails, but return false to indicate failure
    return false;
  }
}

/**
 * Get access logs for a patient
 */
export async function getPatientAccessLogs(
  patientId: string,
  options: {
    limit?: number,
    offset?: number,
    startDate?: Date,
    endDate?: Date,
    action?: string,
    pluginName?: string,
    hospitalId?: string
  } = {}
) {
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    action,
    pluginName,
    hospitalId
  } = options;
  
  try {
    const where: any = { patientId };
    
    if (startDate) {
      where.timestamp = { ...(where.timestamp || {}), gte: startDate };
    }
    
    if (endDate) {
      where.timestamp = { ...(where.timestamp || {}), lte: endDate };
    }
    
    if (action) {
      where.action = action;
    }
    
    if (pluginName) {
      where.pluginName = pluginName;
    }
    
    if (hospitalId) {
      where.hospitalId = hospitalId;
    }
    
    const logs = await prisma.patientAccessLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    const totalCount = await prisma.patientAccessLog.count({ where });
    
    return {
      logs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + logs.length < totalCount
      }
    };
  } catch (error) {
    console.error(`Failed to get access logs for patient ${patientId}:`, error);
    return {
      logs: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false
      }
    };
  }
}

/**
 * Get access logs for a hospital plugin
 */
export async function getHospitalPluginAccessLogs(
  hospitalId: string,
  pluginName: string,
  options: {
    limit?: number,
    offset?: number,
    startDate?: Date,
    endDate?: Date,
    action?: string
  } = {}
) {
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    action
  } = options;
  
  try {
    const where: any = { 
      hospitalId,
      pluginName
    };
    
    if (startDate) {
      where.timestamp = { ...(where.timestamp || {}), gte: startDate };
    }
    
    if (endDate) {
      where.timestamp = { ...(where.timestamp || {}), lte: endDate };
    }
    
    if (action) {
      where.action = action;
    }
    
    const logs = await prisma.patientAccessLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        patient: {
          select: {
            id: true,
            medicalNumber: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    const totalCount = await prisma.patientAccessLog.count({ where });
    
    return {
      logs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + logs.length < totalCount
      }
    };
  } catch (error) {
    console.error(`Failed to get access logs for plugin ${pluginName} in hospital ${hospitalId}:`, error);
    return {
      logs: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false
      }
    };
  }
}
