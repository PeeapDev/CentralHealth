# Hospital Plugin Implementation Guide - Part 2: Analytics and Patient Access

This guide covers the implementation of analytics components and proper patient data access patterns.

## Table of Contents

1. Analytics Implementation
2. Patient Data Access
3. Access Logging
4. Hospital-Specific Settings
5. Plugin Packaging & Deployment
6. Example: Antenatal Care Plugin

## 1. Analytics Implementation

Every plugin must implement four analytics screens to provide insights at different levels:

### Patient Analytics (screens/patientAnalytics.js)

```javascript
import React from 'react';
import { Card, LineChart, Metric } from '@/components/ui/analytics';
import { usePatientData } from '@/hooks/use-patient-data';

export default function PatientAnalytics({ patientId, medicalNumber }) {
  const { data, isLoading } = usePatientData({
    patientId,
    medicalNumber,
    pluginName: 'My First Plugin'
  });
  
  if (isLoading) return <div>Loading analytics...</div>;
  
  return (
    <div className="analytics-grid">
      <Card>
        <h3>Patient Metrics</h3>
        <Metric 
          label="Total Visits" 
          value={data.visitsCount} 
          trend={data.visitsTrend}
        />
        {/* Additional patient-specific metrics */}
      </Card>
      
      <Card>
        <h3>Trends</h3>
        <LineChart 
          data={data.trends} 
          xAxis="date"
          series={['value1', 'value2']}
        />
      </Card>
    </div>
  );
}
```

### Staff Analytics (screens/staffAnalytics.js)

```javascript
import React from 'react';
import { Card, BarChart, Table } from '@/components/ui/analytics';
import { useStaffAnalytics } from '@/hooks/use-staff-analytics';

export default function StaffAnalytics({ userId, hospitalId }) {
  const { data, isLoading } = useStaffAnalytics({
    userId,
    hospitalId,
    pluginName: 'My First Plugin'
  });
  
  if (isLoading) return <div>Loading staff analytics...</div>;
  
  return (
    <div className="analytics-grid">
      <Card>
        <h3>Staff Activity</h3>
        <BarChart 
          data={data.activity} 
          xAxis="date"
          series={['patientsServed', 'hoursLogged']}
        />
      </Card>
      
      <Card>
        <h3>Recent Actions</h3>
        <Table
          data={data.recentActions}
          columns={[
            { header: 'Patient', accessor: 'patientName' },
            { header: 'Action', accessor: 'action' },
            { header: 'Time', accessor: 'timestamp' }
          ]}
        />
      </Card>
    </div>
  );
}
```

### Hospital Analytics (screens/hospitalAnalytics.js)

```javascript
import React from 'react';
import { Card, PieChart, Metric, Table } from '@/components/ui/analytics';
import { useHospitalAnalytics } from '@/hooks/use-hospital-analytics';

export default function HospitalAnalytics({ hospitalId }) {
  const { data, isLoading } = useHospitalAnalytics({
    hospitalId,
    pluginName: 'My First Plugin'
  });
  
  if (isLoading) return <div>Loading hospital analytics...</div>;
  
  return (
    <div className="analytics-grid">
      <Card>
        <h3>Usage by Department</h3>
        <PieChart 
          data={data.departmentUsage} 
          nameKey="department"
          dataKey="count"
        />
      </Card>
      
      <Card>
        <h3>Key Metrics</h3>
        <div className="metrics-grid">
          <Metric 
            label="Total Patients" 
            value={data.totalPatients} 
            trend={data.patientsTrend}
          />
          <Metric 
            label="Active Cases" 
            value={data.activeCases} 
            trend={data.casesTrend}
          />
        </div>
      </Card>
    </div>
  );
}
```

### Central Analytics (screens/centralAnalytics.js)

```javascript
import React from 'react';
import { Card, BarChart, Table } from '@/components/ui/analytics';
import { useCentralAnalytics } from '@/hooks/use-central-analytics';

export default function CentralAnalytics() {
  const { data, isLoading } = useCentralAnalytics({
    pluginName: 'My First Plugin'
  });
  
  if (isLoading) return <div>Loading central analytics...</div>;
  
  return (
    <div className="analytics-grid">
      <Card>
        <h3>Usage Across Hospitals</h3>
        <BarChart 
          data={data.hospitalUsage} 
          xAxis="hospital"
          series={['activePatients', 'totalCases']}
        />
      </Card>
      
      <Card>
        <h3>Hospital Comparison</h3>
        <Table
          data={data.hospitalComparison}
          columns={[
            { header: 'Hospital', accessor: 'name' },
            { header: 'Active Users', accessor: 'activeUsers' },
            { header: 'Cases', accessor: 'casesCount' },
            { header: 'Avg. Resolution', accessor: 'avgResolutionDays' }
          ]}
        />
      </Card>
    </div>
  );
}
```

## 2. Patient Data Access

All plugins must use the `medicalNumber` to access patient records. Here are patterns to follow:

### Finding a Patient

```javascript
// API route or server-side code
import { prisma } from '@/lib/prisma';
import { logPatientAccess } from '@/lib/access-log';

export async function getPatientData(medicalNumber, userId, hospitalId) {
  // Find the patient by medical number
  const patient = await prisma.patient.findFirst({
    where: {
      medicalNumber: medicalNumber,
    },
    select: {
      id: true,
      medicalNumber: true,
      name: true,
      gender: true,
      // Only select what you need
    }
  });
  
  if (!patient) {
    throw new Error('Patient not found');
  }
  
  // Log the access
  await logPatientAccess({
    patientId: patient.id,
    medicalNumber: patient.medicalNumber,
    hospitalId,
    userId,
    pluginName: 'My First Plugin',
    action: 'view',
    context: { requestType: 'patientData' }
  });
  
  return patient;
}
```

### Updating Patient Data

```javascript
export async function updatePatientPluginData(medicalNumber, data, userId, hospitalId) {
  // Find the patient first
  const patient = await prisma.patient.findFirst({
    where: {
      medicalNumber: medicalNumber,
    },
    select: { id: true, medicalNumber: true }
  });
  
  if (!patient) {
    throw new Error('Patient not found');
  }
  
  // Log the access
  await logPatientAccess({
    patientId: patient.id,
    medicalNumber: patient.medicalNumber,
    hospitalId,
    userId,
    pluginName: 'My First Plugin',
    action: 'update',
    context: { dataUpdated: Object.keys(data) }
  });
  
  // Create or update plugin-specific data
  const result = await prisma.patientPluginData.upsert({
    where: {
      patientId_pluginName: {
        patientId: patient.id,
        pluginName: 'My First Plugin'
      }
    },
    update: {
      data: data,
      updatedAt: new Date(),
      updatedByUserId: userId,
      updatedByHospitalId: hospitalId
    },
    create: {
      patientId: patient.id,
      pluginName: 'My First Plugin',
      data: data,
      createdByUserId: userId,
      createdByHospitalId: hospitalId,
      updatedByUserId: userId,
      updatedByHospitalId: hospitalId
    }
  });
  
  return result;
}
```

## 3. Access Logging

Every plugin interaction with patient data must be logged. Here's a utility function to implement this:

```javascript
// /lib/access-log.js

import { prisma } from '@/lib/prisma';

export async function logPatientAccess({
  patientId,
  medicalNumber,
  hospitalId,
  userId,
  pluginName,
  action,
  context = {}
}) {
  try {
    await prisma.patientAccessLog.create({
      data: {
        patientId,
        medicalNumber,
        hospitalId,
        userId,
        pluginName,
        action,
        context
      }
    });
    
    console.log(`Access logged: ${pluginName} ${action} by user ${userId}`);
    
    return true;
  } catch (error) {
    console.error('Failed to log patient access:', error);
    
    // Don't block operation if logging fails
    return false;
  }
}
```

## 4. Hospital-Specific Settings

Plugins should always respect hospital-specific settings. Here's how to access them:

```javascript
// Client-side hook
import { useEffect, useState } from 'react';

export function usePluginSettings(pluginName, hospitalId) {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(`/api/plugins/${pluginName}/settings?hospitalId=${hospitalId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load plugin settings');
        }
        
        const data = await response.json();
        setSettings(data.settings);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSettings();
  }, [pluginName, hospitalId]);
  
  return { settings, isLoading, error };
}

// Server-side function
export async function getPluginSettings(pluginName, hospitalId) {
  const settings = await prisma.hospitalPluginSettings.findUnique({
    where: {
      hospitalId_pluginName: {
        hospitalId,
        pluginName
      }
    }
  });
  
  return settings?.settings || {};
}
```

## 5. Plugin Packaging & Deployment

### Packaging for Deployment

Create a zip file with all your plugin files:

```bash
# From your plugin directory
zip -r my-plugin.zip .
```

Ensure you've tested your plugin before packaging.

### Plugin Deployment API

The system provides an API endpoint for uploading and registering plugins:

```javascript
// Example upload code (admin frontend)
async function uploadPlugin(file) {
  const formData = new FormData();
  formData.append('pluginFile', file);
  
  const response = await fetch('/api/admin/plugins/upload', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}
```

## 6. Example: Antenatal Care Plugin

Here's a simplified implementation of an Antenatal Care plugin:

### Plugin Manifest (plugin.json)

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
  "setupWizard": "screens/setupWizard.js",
  "mainScreen": "screens/main.js",
  "additionalScreens": {
    "fetalMonitoring": "screens/fetalMonitoring.js",
    "visits": "screens/visits.js"
  },
  "sidebarIcon": "Baby",
  "requiredPermissions": [
    "viewPatients",
    "updatePatients",
    "createVisits"
  ]
}
```

### Setup Wizard (screens/setupWizard.js)

```javascript
import React, { useState } from 'react';
import { Button, Card, Form, Switch, Select } from '@/components/ui';

export default function AntenatalSetupWizard({ hospital, onComplete }) {
  const [settings, setSettings] = useState({
    allowMidwivesUpdate: true,
    allowNursesCreate: false,
    defaultVisitDuration: 30,
    requiredTests: ['blood_pressure', 'fetal_heartbeat'],
    notifyDoctorOnAbnormal: true
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete(settings);
  };
  
  return (
    <Card>
      <h2>Configure Antenatal Care Plugin</h2>
      <p>Customize how this plugin works in {hospital.name}</p>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Allow Midwives to Update Records</Form.Label>
          <Switch 
            checked={settings.allowMidwivesUpdate} 
            onChange={e => setSettings({...settings, allowMidwivesUpdate: e.target.checked})} 
          />
        </Form.Group>
        
        <Form.Group>
          <Form.Label>Allow Nurses to Create Records</Form.Label>
          <Switch 
            checked={settings.allowNursesCreate} 
            onChange={e => setSettings({...settings, allowNursesCreate: e.target.checked})} 
          />
        </Form.Group>
        
        <Form.Group>
          <Form.Label>Default Visit Duration (minutes)</Form.Label>
          <Select
            value={settings.defaultVisitDuration}
            onChange={e => setSettings({...settings, defaultVisitDuration: parseInt(e.target.value)})}
            options={[
              { value: 15, label: '15 minutes' },
              { value: 30, label: '30 minutes' },
              { value: 45, label: '45 minutes' },
              { value: 60, label: '60 minutes' }
            ]}
          />
        </Form.Group>
        
        <Button type="submit">Complete Setup</Button>
      </Form>
    </Card>
  );
}
```

With this implementation guide, developers should have a clear understanding of how to build plugins for the hospital system while respecting patient data access patterns and providing necessary analytics.
