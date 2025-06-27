/**
 * Enhanced Prisma client utility that supports both online (PostgreSQL) and offline (SQLite) modes
 * 
 * This utility handles:
 * 1. Dynamic database selection based on environment/connectivity
 * 2. Connection pooling and management 
 * 3. Transaction wrappers that automatically track changes for sync
 */

import { PrismaClient } from '@/lib/generated/prisma'
import { isOnline } from './network-status'

// Environment variables
const DEFAULT_PROVIDER = 'postgresql'
const OFFLINE_MODE = process.env.OFFLINE_MODE === 'true'

// Types for sync tracking
export type SyncOperation = 'create' | 'update' | 'delete'

// Initialize Prisma client with specific options and logging
export const createPrismaClient = () => {
  // Create client with proper options format to avoid PrismaClientConstructorValidationError
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
    // Prevent issue with datasources format
    datasources: process.env.DATABASE_URL
      ? {
          db: {
            url: process.env.DATABASE_URL,
          },
        }
      : undefined,
  })
}

// Create a wrapper around the Prisma client to handle offline operations
class PrismaWrapper {
  private static instance: PrismaWrapper
  private prisma: PrismaClient
  private offlineMode: boolean
  private currentUser: { id: string; hospitalId?: string } | null = null

  private constructor() {
    this.prisma = createPrismaClient()
    this.offlineMode = OFFLINE_MODE
    
    // Log configuration on startup
    console.log(`Database mode: ${this.offlineMode ? 'OFFLINE (SQLite)' : 'ONLINE (PostgreSQL)'}`)
  }

  public static getInstance(): PrismaWrapper {
    if (!PrismaWrapper.instance) {
      PrismaWrapper.instance = new PrismaWrapper()
    }
    return PrismaWrapper.instance
  }

  // Get the raw Prisma client
  public getPrisma(): PrismaClient {
    return this.prisma
  }

  // Set the current user context for sync operations
  public setCurrentUser(user: { id: string; hospitalId?: string } | null): void {
    this.currentUser = user
  }

  // Check if we're operating in offline mode
  public isOfflineMode(): boolean {
    return this.offlineMode
  }

  // Queue an operation for syncing when back online
  public async queueForSync(
    modelName: string,
    recordId: string,
    operation: SyncOperation,
    data: any,
    globalId?: string
  ): Promise<void> {
    if (!this.offlineMode) return // Only queue in offline mode
    if (!this.currentUser) {
      console.warn('No current user set for sync operation')
      return
    }

    try {
      await this.prisma.syncQueue.create({
        data: {
          modelName,
          recordId,
          globalId,
          operation,
          payload: JSON.stringify(data),
          userId: this.currentUser.id,
          hospitalId: this.currentUser.hospitalId,
        }
      })
    } catch (error) {
      console.error('Failed to queue sync operation:', error)
    }
  }

  // Sync helper methods to track changes for offline mode
  public async trackCreate(modelName: string, data: any): Promise<any> {
    const result = await this.prisma[modelName.toLowerCase()].create({
      data: {
        ...data,
        syncStatus: this.offlineMode ? 'created' : 'synced',
      },
    })

    if (this.offlineMode) {
      await this.queueForSync(modelName, result.id, 'create', result)
    }

    return result
  }

  public async trackUpdate(modelName: string, id: string, data: any, globalId?: string): Promise<any> {
    // Mark record as modified if we're offline
    const syncData = this.offlineMode ? { syncStatus: 'modified' } : {}
    
    const result = await this.prisma[modelName.toLowerCase()].update({
      where: { id },
      data: {
        ...data,
        ...syncData,
      },
    })

    if (this.offlineMode) {
      await this.queueForSync(modelName, id, 'update', result, globalId)
    }

    return result
  }

  public async trackDelete(modelName: string, id: string, globalId?: string): Promise<any> {
    // In offline mode, we soft delete by marking as deleted
    if (this.offlineMode) {
      const result = await this.prisma[modelName.toLowerCase()].update({
        where: { id },
        data: { syncStatus: 'deleted' },
      })
      
      await this.queueForSync(modelName, id, 'delete', { id }, globalId)
      return result
    } else {
      // In online mode, perform actual deletion
      return await this.prisma[modelName.toLowerCase()].delete({
        where: { id },
      })
    }
  }

  // Connect/disconnect helpers
  public async connect(): Promise<void> {
    await this.prisma.$connect()
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Export singleton instance
export const prismaWrapper = PrismaWrapper.getInstance()

// Export the prisma client for direct usage when sync tracking isn't needed
export const prisma = prismaWrapper.getPrisma()
