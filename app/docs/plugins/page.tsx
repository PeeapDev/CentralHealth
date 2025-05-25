"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Copy, ExternalLink, Download, Zap, Shield, Puzzle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function PluginDevelopmentPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const pluginExample = `
// plugin.json - Plugin Configuration
{
  "name": "Custom Lab Integration",
  "version": "1.0.0",
  "description": "Integrate with external laboratory systems",
  "author": "Your Name",
  "category": "integration",
  "permissions": ["read:patients", "write:lab_results"],
  "dependencies": {
    "axios": "^1.0.0"
  },
  "entry": "index.js",
  "hooks": {
    "patient.created": "onPatientCreated",
    "lab.result.received": "onLabResult"
  }
}

// index.js - Main Plugin File
class LabIntegrationPlugin {
  constructor(api) {
    this.api = api;
    this.config = api.getConfig();
  }

  async onPatientCreated(patient) {
    // Send patient data to external lab system
    try {
      const response = await this.api.http.post('/external-lab/patients', {
        patientId: patient.id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth
      });
      
      console.log('Patient synced to lab system:', response.data);
    } catch (error) {
      console.error('Failed to sync patient:', error);
    }
  }

  async onLabResult(result) {
    // Process incoming lab results
    await this.api.medicalRecords.create({
      patientId: result.patientId,
      type: 'lab_result',
      data: result,
      createdBy: 'lab-system'
    });
  }

  // Plugin lifecycle methods
  async activate() {
    console.log('Lab Integration Plugin activated');
  }

  async deactivate() {
    console.log('Lab Integration Plugin deactivated');
  }
}

module.exports = LabIntegrationPlugin;
`

  const apiReference = `
// Hospital Management Plugin API Reference

class PluginAPI {
  // Patient Management
  patients = {
    async create(patientData) { /* Create new patient */ },
    async update(id, data) { /* Update patient */ },
    async get(id) { /* Get patient by ID */ },
    async search(query) { /* Search patients */ },
    async delete(id) { /* Delete patient */ }
  };

  // Appointment Management
  appointments = {
    async create(appointmentData) { /* Create appointment */ },
    async update(id, data) { /* Update appointment */ },
    async get(id) { /* Get appointment */ },
    async list(filters) { /* List appointments */ },
    async cancel(id) { /* Cancel appointment */ }
  };

  // Medical Records
  medicalRecords = {
    async create(recordData) { /* Create medical record */ },
    async get(patientId) { /* Get patient records */ },
    async update(id, data) { /* Update record */ }
  };

  // Billing
  billing = {
    async createInvoice(invoiceData) { /* Create invoice */ },
    async processPayment(paymentData) { /* Process payment */ },
    async getInvoices(filters) { /* Get invoices */ }
  };

  // Notifications
  notifications = {
    async send(type, recipient, message) { /* Send notification */ },
    async sms(phone, message) { /* Send SMS */ },
    async email(email, subject, body) { /* Send email */ }
  };

  // HTTP Client
  http = {
    async get(url, config) { /* HTTP GET */ },
    async post(url, data, config) { /* HTTP POST */ },
    async put(url, data, config) { /* HTTP PUT */ },
    async delete(url, config) { /* HTTP DELETE */ }
  };

  // Configuration
  getConfig() { /* Get plugin configuration */ }
  setConfig(key, value) { /* Set configuration value */ }
  
  // Database
  db = {
    async query(sql, params) { /* Execute SQL query */ },
    async insert(table, data) { /* Insert data */ },
    async update(table, data, where) { /* Update data */ }
  };
}
`

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="mb-4">
          <Puzzle className="w-3 h-3 mr-1" />
          Plugin Development
        </Badge>
        <h1 className="text-4xl font-bold">Hospital Management Plugin Development</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Build custom plugins and integrations for the Hospital Management System. Extend functionality with your own
          modules, integrations, and workflows.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/docs/api">
              <Code className="w-4 h-4 mr-2" />
              API Documentation
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/superadmin/settings/api-keys">
              API Keys
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="api-reference">API Reference</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Easy Integration</CardTitle>
                <CardDescription>Simple plugin architecture with comprehensive API access</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Hook-based event system</li>
                  <li>• Full API access</li>
                  <li>• Configuration management</li>
                  <li>• Database integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Secure & Sandboxed</CardTitle>
                <CardDescription>Plugins run in secure environments with permission controls</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Permission-based access</li>
                  <li>• Sandboxed execution</li>
                  <li>• Audit logging</li>
                  <li>• Resource limits</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Code className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Rich API</CardTitle>
                <CardDescription>Access all hospital management features through our API</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Patient management</li>
                  <li>• Appointment scheduling</li>
                  <li>• Medical records</li>
                  <li>• Billing & payments</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="getting-started">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Plugin Structure</CardTitle>
                <CardDescription>Every plugin must follow this basic structure</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {`my-plugin/
├── plugin.json          # Plugin configuration
├── index.js            # Main plugin file
├── package.json        # Dependencies
├── README.md           # Documentation
└── assets/             # Static assets
    ├── icon.png
    └── screenshots/`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Plugin Configuration</CardTitle>
                <CardDescription>Define your plugin metadata and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {`{
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Your Name",
  "category": "integration",
  "permissions": [
    "read:patients",
    "write:appointments",
    "send:notifications"
  ],
  "hooks": {
    "patient.created": "onPatientCreated",
    "appointment.scheduled": "onAppointmentScheduled"
  }
}`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Development Setup</CardTitle>
                <CardDescription>Set up your development environment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Install Plugin SDK</h4>
                    <pre className="bg-muted p-3 rounded text-sm">npm install @hospital-mgmt/plugin-sdk</pre>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Create Plugin Template</h4>
                    <pre className="bg-muted p-3 rounded text-sm">npx create-hospital-plugin my-plugin</pre>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Test Plugin</h4>
                    <pre className="bg-muted p-3 rounded text-sm">npm run test</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api-reference">
          <Card>
            <CardHeader>
              <CardTitle>Plugin API Reference</CardTitle>
              <CardDescription>Complete API reference for plugin development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">API Methods</h3>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiReference)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{apiReference}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Complete Plugin Example</CardTitle>
              <CardDescription>A full example of a lab integration plugin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Lab Integration Plugin</h3>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(pluginExample)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{pluginExample}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plugin Marketplace</CardTitle>
            <CardDescription>Submit your plugin to the marketplace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once your plugin is ready, you can submit it to our marketplace for other hospitals to use.
            </p>
            <Button asChild>
              <Link href="/superadmin/settings/modules">
                <Download className="w-4 h-4 mr-2" />
                View Marketplace
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Get support for plugin development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Join our developer community for support, examples, and best practices.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Discord Community
              </Button>
              <Button variant="outline" size="sm">
                GitHub Examples
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
