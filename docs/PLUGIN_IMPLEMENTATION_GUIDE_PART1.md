# Hospital Plugin Implementation Guide - Part 1: Getting Started

This guide provides practical steps and examples for developing and integrating plugins with the hospital system.

## Table of Contents

1. Plugin Structure
2. Development Setup
3. Creating Your First Plugin
4. Plugin Manifest
5. Required Components

## 1. Plugin Structure

Each plugin should follow this standard directory structure:

```
/plugins/premium/plugin-name/
├── plugin.json            # Plugin manifest
├── index.js               # Main entry point
├── screens/               # UI screens
│   ├── main.js            # Main plugin screen
│   ├── setupWizard.js     # Hospital-specific setup
│   ├── patientAnalytics.js
│   ├── staffAnalytics.js
│   ├── hospitalAnalytics.js
│   └── centralAnalytics.js
├── components/            # Reusable React components
├── api/                   # API endpoints
├── models/                # Additional models (if needed)
├── utils/                 # Helper functions
└── assets/                # Images, styles, etc.
```

## 2. Development Setup

To start developing a plugin, set up your development environment:

```bash
# Create a new plugin directory
mkdir -p plugins/development/my-plugin
cd plugins/development/my-plugin

# Initialize a package.json
npm init -y

# Install required dependencies
npm install --save react react-dom @fhir/client
```

## 3. Creating Your First Plugin

Start by creating the plugin manifest file:

```bash
touch plugin.json
```

## 4. Plugin Manifest

The `plugin.json` file is the heart of your plugin. Here's a template:

```json
{
  "name": "My First Plugin",
  "version": "0.1.0",
  "category": "Clinical",
  "author": "Your Name",
  "description": "A description of what your plugin does",
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
  "sidebarIcon": "HeartPulse",
  "requiredPermissions": [
    "viewPatients",
    "updatePatients"
  ]
}
```

## 5. Required Components

Every plugin must include these components:

### Main Entry Point (index.js)

```javascript
import { registerPlugin } from '@/lib/plugin-system';

// Register the plugin
registerPlugin({
  name: 'My First Plugin',
  version: '0.1.0',
  
  // Initialize function called when plugin is activated
  initialize: async (context) => {
    const { hospital, settings } = context;
    console.log(`Plugin initialized for hospital: ${hospital.name}`);
    return true;
  },
  
  // Cleanup function called when plugin is deactivated
  cleanup: async (context) => {
    console.log('Plugin cleanup');
    return true;
  },
});
```

### Setup Wizard (screens/setupWizard.js)

```javascript
import React, { useState } from 'react';
import { Button, Card, Form, Switch } from '@/components/ui';

export default function SetupWizard({ hospital, onComplete }) {
  const [settings, setSettings] = useState({
    enableFeatureX: true,
    defaultValue: 10,
    allowedRoles: ['doctor', 'nurse']
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Save settings
    await onComplete(settings);
  };
  
  return (
    <Card>
      <h2>Configure My First Plugin</h2>
      <p>Customize how this plugin works in {hospital.name}</p>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Enable Feature X</Form.Label>
          <Switch 
            checked={settings.enableFeatureX} 
            onChange={e => setSettings({...settings, enableFeatureX: e.target.checked})} 
          />
        </Form.Group>
        
        <Button type="submit">Complete Setup</Button>
      </Form>
    </Card>
  );
}
```

### Main Screen (screens/main.js)

```javascript
import React from 'react';
import { usePlugin } from '@/hooks/use-plugin';

export default function PluginMainScreen() {
  const { settings, hospital } = usePlugin('My First Plugin');
  
  return (
    <div>
      <h1>My First Plugin</h1>
      <p>Welcome to {hospital.name}</p>
      
      {settings.enableFeatureX && (
        <div>Feature X is enabled!</div>
      )}
    </div>
  );
}
```
