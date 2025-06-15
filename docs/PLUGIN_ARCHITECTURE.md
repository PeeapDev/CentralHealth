# Hospital Plugin Architecture Documentation

This document outlines the architecture and implementation details for the FHIR-compliant, plugin-based health information system used across the hospital network.

## Overview

Our hospital system uses a plugin-based architecture inspired by DHIS2, designed for multi-hospital use on a SaaS platform. The main hospital is accessible at `hospital.com`, while other hospitals are available via subdomain paths like `hospital.com/stmarys`.

## Plugin System Architecture

### Core Principles

1. **Global Registration, Local Activation** - Plugins are registered globally but activated per-hospital
2. **FHIR Compliance** - All data structures adhere to FHIR standards
3. **Shared Patient Identity** - Global patient identification via `medicalNumber`
4. **Analytics at Every Level** - Patient, staff, hospital, and central analytics
5. **Comprehensive Access Logging** - All patient data access is logged

### Plugin Lifecycle

1. **Upload** - Admin uploads plugin as a `.zip` file
2. **Registration** - System registers plugin metadata globally
3. **Discovery** - Hospital admin sees plugin in their "Apps" dashboard
4. **Activation** - Activation triggers hospital-specific setup wizard
5. **Configuration** - Hospital configures roles, permissions, and settings
6. **Usage** - Plugin becomes available to appropriate staff roles
7. **Analytics** - Data flows to dashboards at all levels

## Plugin Upload and Storage

Plugins are uploaded through the main hospital dashboard under the "Upload New Module" screen. The system:

1. Extracts the plugin to `/plugins/premium/[plugin-name]/`
2. Reads the `plugin.json` manifest
3. Registers the plugin metadata in the database
4. Makes it available for discovery by hospital admins

### Plugin Manifest Structure

Each plugin must include a `plugin.json` manifest with the following structure:

```json
{
  "name": "Antenatal Care",
  "version": "1.0.0",
  "category": "Maternity",
  "author": "Plugin Dev",
  "description": "Tracks pregnancy, antenatal visits, and fetal health",
  "medicalReference": "byMedicalNumber",
  "hiddenFromGit": true,
  "crossHospitalCompatible": true,
  "analytics": {
    "patient": "screens/patientAnalytics.js",
    "staff": "screens/staffAnalytics.js",
    "hospital": "screens/hospitalAnalytics.js",
    "central": "screens/centralAnalytics.js"
  },
  "setupWizard": "screens/setupWizard.js"
}
```

## Patient Identity System

### Medical Number Format

All patient records use a globally unique `medicalNumber` that:

- Combines 5 uppercase letters and numbers
- Excludes ambiguous characters (i, l, o, 1, 0)
- Examples: `A3TV2`, `B9CXR`, `DX54P`

### Cross-Hospital Patient Access

When a patient is registered at the main hospital, their record becomes available to all subdomain hospitals:

1. Patient registers at `hospital.com`
2. Patient record with `medicalNumber` is created
3. All hospitals can access via the `medicalNumber`

### Patient Record Access Rules

When accessing patient records across hospitals:

1. Every access must be logged to `PatientAccessLog`
2. Hospitals may update or extend data but not override core identity fields
3. Access is controlled by hospital-specific roles and permissions

## Plugin Database Models

### Hospital Plugin Settings

```prisma
model HospitalPluginSettings {
  id             String   @id @default(uuid())
  hospitalId     String   // Reference to the hospital
  pluginName     String   // Plugin identifier
  isActive       Boolean  @default(false)
  settings       Json     // Hospital-specific settings
  activatedAt    DateTime?
  activatedById  String?  // User who activated the plugin
  modifiedAt     DateTime @updatedAt
  
  hospital       Hospital @relation(fields: [hospitalId], references: [id])
  
  @@unique([hospitalId, pluginName])
}
```

### Patient Access Logging

```prisma
model PatientAccessLog {
  id            String   @id @default(uuid())
  patientId     String
  medicalNumber String
  hospitalId    String
  userId        String
  action        String   // e.g. "view", "update"
  pluginName    String
  context       Json?
  timestamp     DateTime @default(now())
  
  patient       Patient  @relation(fields: [patientId], references: [id])
  hospital      Hospital @relation(fields: [hospitalId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
}
```

## Plugin Registration and Discovery

### Plugin Registration Model

```prisma
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
```

## Plugin Activation Process

1. Hospital admin sees plugin in "Apps" dashboard
2. Admin clicks "Activate"
3. System:
   - Creates `HospitalPluginSettings` entry
   - Sets `isActive` to true
   - Launches setup wizard
4. Setup wizard configures:
   - Hospital-specific roles and permissions
   - Feature toggles
   - Default settings
5. System updates `HospitalPluginSettings` with configuration
6. Plugin becomes available to appropriate staff

## Required Plugin Components

Every plugin must provide:

### Analytics Dashboards

1. **Patient Analytics** (`screens/patientAnalytics.js`)
   - Individual trends and outcomes
   - Patient-specific metrics

2. **Staff Analytics** (`screens/staffAnalytics.js`)
   - Clinical workload statistics
   - Care performance metrics

3. **Hospital Analytics** (`screens/hospitalAnalytics.js`)
   - Plugin usage across departments
   - Hospital-level trends

4. **Central Analytics** (`screens/centralAnalytics.js`)
   - Multi-hospital comparative metrics
   - Network-wide statistics

### Setup Wizard

- Configures hospital-specific settings
- Defines roles and permissions
- Sets up default templates

## Implementation Details

### Patient Lookup Pattern

All plugins must use the `medicalNumber` when looking up patient records:

```typescript
const patient = await prisma.patient.findFirst({
  where: {
    medicalNumber: "A3TV2"
  }
});
```

### Cross-Hospital Data Access

When a plugin needs data from multiple hospitals:

```typescript
// Example: Get patient visits across all hospitals
const visits = await prisma.visit.findMany({
  where: {
    patient: {
      medicalNumber: "A3TV2"
    }
  },
  include: {
    hospital: true
  }
});
```

### Access Logging Implementation

All plugins must log access to patient data:

```typescript
// Example: Log patient data access
await prisma.patientAccessLog.create({
  data: {
    patientId: patient.id,
    medicalNumber: patient.medicalNumber,
    hospitalId: currentHospital.id,
    userId: currentUser.id,
    action: "view",
    pluginName: "antenatal-care",
    context: { screen: "fetal-monitoring", visitId: visit.id }
  }
});
```

## Example: Antenatal Care Plugin

### Installation Flow

1. Superadmin uploads `antenatal.zip`
2. `hospital.com/stmarys` admin sees new app in Apps dashboard
3. Admin activates plugin, launching setup wizard
4. Setup wizard configures:
   - Role permissions (midwives, nurses)
   - Default templates
   - Hospital-specific settings
5. Once active:
   - Doctors see "Antenatal" in sidebar
   - Midwives can log fetal monitoring data
   - Analytics populate in all dashboards

### Key Files

- `plugin.json` - Plugin manifest
- `screens/setupWizard.js` - Hospital configuration
- `screens/*Analytics.js` - Analytics dashboards
- `components/FatalMonitoring.js` - UI components
- `api/antenatal/*.js` - API endpoints

## Best Practices

1. **Always log patient data access**
2. **Use medicalNumber for patient lookups**
3. **Respect hospital-specific settings**
4. **Provide complete analytics at all levels**
5. **Follow FHIR data structures**
6. **Never override core patient identity fields**

## Reference Implementation

For a working example, see the reference implementation in:
`/plugins/premium/antenatal-care/`
