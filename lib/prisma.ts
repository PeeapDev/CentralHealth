/**
 * @deprecated This file is maintained for backward compatibility only.
 * All code should import the Prisma client directly from '@/lib/database/prisma-client'
 * This file now re-exports the enhanced Prisma client from the database directory.
 */

// Re-export the enhanced Prisma client to maintain backward compatibility
import { prisma } from './database/prisma-client'

// Export for backward compatibility
export { prisma }

// Add a console warning in development mode
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'Warning: You are importing Prisma client from @/lib/prisma which is deprecated.\n' +
    'Please update your imports to use @/lib/database/prisma-client instead.'
  )
}
