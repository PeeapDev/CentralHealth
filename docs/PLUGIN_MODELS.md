# Plugin System Database Models

This document provides the Prisma schema models required for implementing the hospital plugin architecture.

## Core Plugin Models

Add these models to your `schema.prisma` file to support the plugin system.

```prisma
// Plugin definition and registration
model Plugin {
  id                     String   @id @default(uuid())
  name                   String
  version                String
  category               String
  author                 String
  description            String
  medicalReference       String   @default("byMedicalNumber")
  hiddenFromGit          Boolean  @default(false)
  crossHospitalCompatible Boolean  @default(true)
  path                   String   // Path to plugin directory
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  hospitalSettings       HospitalPluginSettings[]
  
  @@unique([name, version])
}

// Hospital-specific plugin settings
model HospitalPluginSettings {
  id             String    @id @default(uuid())
  hospitalId     String
  pluginId       String
  pluginName     String    // Denormalized for convenience
  isActive       Boolean   @default(false)
  settings       Json      // Hospital-specific settings
  activatedAt    DateTime?
  activatedById  String?   // User who activated the plugin
  modifiedAt     DateTime  @updatedAt
  
  hospital       Hospital  @relation(fields: [hospitalId], references: [id])
  plugin         Plugin    @relation(fields: [pluginId], references: [id])
  activatedBy    User?     @relation("PluginActivator", fields: [activatedById], references: [id])
  
  @@unique([hospitalId, pluginId])
}

// Patient access logging for plugins
model PatientAccessLog {
  id            String   @id @default(uuid())
  patientId     String
  medicalNumber String
  hospitalId    String
  userId        String
  action        String   // e.g. "view", "update" 
  pluginName    String
  context       Json?    // Additional context about the access
  timestamp     DateTime @default(now())
  
  patient       Patient  @relation(fields: [patientId], references: [id])
  hospital      Hospital @relation(fields: [hospitalId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
}

// Model for tracking plugin role permissions
model PluginRolePermission {
  id           String  @id @default(uuid())
  hospitalId   String
  pluginId     String
  roleId       String  // Reference to hospital role
  permissions  Json    // Map of permission keys to boolean values
  
  hospital     Hospital @relation(fields: [hospitalId], references: [id])
  role         Role     @relation(fields: [roleId], references: [id])
  
  @@unique([hospitalId, pluginId, roleId])
}
```

## Updates to Existing Models

These are updates to existing models to support the plugin architecture.

### Hospital Model Updates

```prisma
model Hospital {
  // Existing fields...
  
  // Plugin related fields
  pluginSettings    HospitalPluginSettings[]
  patientAccessLogs PatientAccessLog[]
  pluginPermissions PluginRolePermission[]
}
```

### User Model Updates

```prisma
model User {
  // Existing fields...
  
  // Plugin related fields
  activatedPlugins  HospitalPluginSettings[] @relation("PluginActivator")
  patientAccessLogs PatientAccessLog[]
}
```

### Patient Model Updates 

```prisma
model Patient {
  // Existing fields...
  
  // Medical Number for cross-hospital identification
  medicalNumber     String    @unique
  
  // Plugin related fields
  accessLogs        PatientAccessLog[]
}
```

### Role Model Updates

```prisma
model Role {
  // Existing fields...
  
  // Plugin related fields
  pluginPermissions PluginRolePermission[]
}
```

## Migration Steps

Here's how to apply these changes to your existing database:

1. Add the new models to your Prisma schema
2. Update the existing models with the new relations
3. Create and run the migration:

```bash
npx prisma migrate dev --name add_plugin_system
```

4. After migration, add indexes for query optimization:

```prisma
// Add these to the PatientAccessLog model
@@index([patientId])
@@index([hospitalId])
@@index([pluginName])
```

## Usage Examples

### Registering a Plugin

```typescript
// Example: Register a new plugin
const plugin = await prisma.plugin.create({
  data: {
    name: "Antenatal Care",
    version: "1.0.0",
    category: "Maternity",
    author: "Plugin Dev",
    description: "Tracks pregnancy, antenatal visits, and fetal health",
    medicalReference: "byMedicalNumber",
    hiddenFromGit: true,
    crossHospitalCompatible: true,
    path: "/plugins/premium/antenatal-care"
  }
});
```

### Activating a Plugin for a Hospital

```typescript
// Example: Activate a plugin for a specific hospital
const settings = await prisma.hospitalPluginSettings.create({
  data: {
    hospitalId: "hospital123",
    pluginId: "plugin456",
    pluginName: "Antenatal Care",
    isActive: true,
    activatedById: "user789",
    activatedAt: new Date(),
    settings: {
      midwives_can_update: true,
      default_visit_duration: 30
    }
  }
});
```

### Logging Patient Access

```typescript
// Example: Log patient access through a plugin
await prisma.patientAccessLog.create({
  data: {
    patientId: "patient123",
    medicalNumber: "A3TV2",
    hospitalId: "hospital456",
    userId: "user789",
    action: "view",
    pluginName: "antenatal-care",
    context: { 
      screen: "fetal-monitoring", 
      visitId: "visit123" 
    }
  }
});
```

### Setting Plugin Role Permissions

```typescript
// Example: Set permissions for a role
await prisma.pluginRolePermission.create({
  data: {
    hospitalId: "hospital123",
    pluginId: "plugin456",
    roleId: "role789",
    permissions: {
      can_view: true,
      can_create: true,
      can_update: false,
      can_delete: false
    }
  }
});
```
