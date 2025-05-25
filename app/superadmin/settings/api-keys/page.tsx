"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { Eye, EyeOff, Copy, ExternalLink, Key, CreditCard, MessageSquare, Activity } from "lucide-react"
import Link from "next/link"

export default function ApiKeysPage() {
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({})
  const [apiKeys, setApiKeys] = useState({
    // FHIR Integration
    fhirServerUrl: "https://hapi.fhir.org/baseR4",
    fhirClientId: "demo_client_12345",
    fhirClientSecret: "demo_secret_abcdef123456",
    fhirScope: "patient/*.read patient/*.write",

    // RapidPro SMS
    rapidproApiUrl: "https://rapidpro.io/api/v2",
    rapidproApiToken: "demo_token_rapidpro_123456789abcdef",
    rapidproWorkspace: "demo-hospital-workspace",

    // PeeapPay Payment Gateway
    peeapApiUrl: "https://api.peeap.com/v1",
    peeapPublicKey: "pk_demo_1234567890abcdef",
    peeapSecretKey: "sk_demo_abcdef1234567890",
    peeapWebhookSecret: "whsec_demo_webhook123456",
    peeapEnvironment: "sandbox",

    // Email/SMTP
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUsername: "demo@hospital.com",
    smtpPassword: "demo_password_123",
    smtpEncryption: "tls",

    // Push Notifications
    fcmServerKey: "demo_fcm_server_key_123456789",
    apnsKeyId: "demo_apns_key_id",
    apnsTeamId: "demo_team_id",

    // Third-party Integrations
    googleMapsApiKey: "demo_google_maps_key_123456",
    twilioAccountSid: "demo_twilio_sid_123456",
    twilioAuthToken: "demo_twilio_token_123456",
    stripePublicKey: "pk_demo_stripe_123456",
    stripeSecretKey: "sk_demo_stripe_123456",
  })

  const toggleShowKey = (keyName: string) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("API key copied to clipboard")
  }

  const handleSave = () => {
    // Save API keys logic here
    toast.success("API keys saved successfully")
  }

  const renderKeyInput = (keyName: string, label: string, description?: string) => (
    <div className="space-y-2">
      <Label htmlFor={keyName}>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={keyName}
            type={showKeys[keyName] ? "text" : "password"}
            value={apiKeys[keyName as keyof typeof apiKeys]}
            onChange={(e) => setApiKeys((prev) => ({ ...prev, [keyName]: e.target.value }))}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleShowKey(keyName)}
              className="h-6 w-6 p-0"
            >
              {showKeys[keyName] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(apiKeys[keyName as keyof typeof apiKeys])}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="API Keys & Integrations"
        description="Manage API keys and configure third-party integrations for your hospital management system"
        breadcrumbs={[{ label: "Home" }, { label: "System Settings" }, { label: "API Keys" }]}
      />

      <Tabs defaultValue="fhir" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fhir">
            <Activity className="w-4 h-4 mr-2" />
            FHIR
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="email">Email/SMTP</TabsTrigger>
          <TabsTrigger value="other">Other APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="fhir">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    FHIR Integration
                  </CardTitle>
                  <CardDescription>
                    Configure FHIR (Fast Healthcare Interoperability Resources) integration for healthcare data exchange
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Demo Keys Active</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="https://www.hl7.org/fhir/" target="_blank">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      FHIR Docs
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {renderKeyInput("fhirServerUrl", "FHIR Server URL", "Base URL of your FHIR server")}
                  {renderKeyInput("fhirClientId", "Client ID", "OAuth2 client identifier")}
                </div>
                <div className="space-y-4">
                  {renderKeyInput("fhirClientSecret", "Client Secret", "OAuth2 client secret")}
                  {renderKeyInput("fhirScope", "OAuth Scope", "Permissions for FHIR access")}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="fhir-enabled" defaultChecked />
                <Label htmlFor="fhir-enabled">Enable FHIR Integration</Label>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Test Connection</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Test your FHIR server connection with the current configuration
                </p>
                <Button variant="outline" size="sm">
                  Test FHIR Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    RapidPro SMS Integration
                  </CardTitle>
                  <CardDescription>
                    Configure RapidPro for SMS notifications, appointment reminders, and patient communication
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Demo Keys Active</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="https://rapidpro.io/api/v2/" target="_blank">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      RapidPro API
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {renderKeyInput("rapidproApiUrl", "RapidPro API URL", "Your RapidPro instance URL")}
                  {renderKeyInput("rapidproApiToken", "API Token", "RapidPro API authentication token")}
                </div>
                <div className="space-y-4">
                  {renderKeyInput("rapidproWorkspace", "Workspace", "RapidPro workspace identifier")}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="sms-enabled" defaultChecked />
                <Label htmlFor="sms-enabled">Enable SMS Notifications</Label>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">SMS Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Appointment reminders</li>
                  <li>• Lab result notifications</li>
                  <li>• Payment reminders</li>
                  <li>• Emergency alerts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    PeeapPay Payment Gateway
                  </CardTitle>
                  <CardDescription>
                    Configure PeeapPay for secure payment processing and billing management
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Demo Keys Active</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="https://account.peeap.com/developer" target="_blank">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      PeeapPay Docs
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {renderKeyInput("peeapApiUrl", "PeeapPay API URL", "PeeapPay API base URL")}
                  {renderKeyInput("peeapPublicKey", "Public Key", "PeeapPay publishable key for frontend")}
                  {renderKeyInput("peeapSecretKey", "Secret Key", "PeeapPay secret key for backend")}
                </div>
                <div className="space-y-4">
                  {renderKeyInput("peeapWebhookSecret", "Webhook Secret", "Secret for webhook verification")}
                  <div className="space-y-2">
                    <Label htmlFor="peeap-environment">Environment</Label>
                    <Select
                      value={apiKeys.peeapEnvironment}
                      onValueChange={(value) => setApiKeys((prev) => ({ ...prev, peeapEnvironment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production (Live)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="payment-enabled" defaultChecked />
                <Label htmlFor="payment-enabled">Enable PeeapPay Integration</Label>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Credit/Debit card payments</li>
                  <li>• Mobile money integration</li>
                  <li>• Recurring billing</li>
                  <li>• Payment analytics</li>
                  <li>• Refund management</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email/SMTP Configuration</CardTitle>
              <CardDescription>Configure SMTP settings for email notifications and communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {renderKeyInput("smtpHost", "SMTP Host", "SMTP server hostname")}
                  {renderKeyInput("smtpPort", "SMTP Port", "SMTP server port (usually 587 or 465)")}
                  {renderKeyInput("smtpUsername", "Username", "SMTP authentication username")}
                </div>
                <div className="space-y-4">
                  {renderKeyInput("smtpPassword", "Password", "SMTP authentication password")}
                  <div className="space-y-2">
                    <Label htmlFor="smtp-encryption">Encryption</Label>
                    <Select
                      value={apiKeys.smtpEncryption}
                      onValueChange={(value) => setApiKeys((prev) => ({ ...prev, smtpEncryption: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Configure push notifications for mobile apps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {renderKeyInput("fcmServerKey", "FCM Server Key", "Firebase Cloud Messaging server key")}
                  {renderKeyInput("apnsKeyId", "APNS Key ID", "Apple Push Notification service key ID")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third-party Services</CardTitle>
                <CardDescription>Configure additional third-party integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {renderKeyInput("googleMapsApiKey", "Google Maps API Key", "For location services and mapping")}
                  {renderKeyInput("twilioAccountSid", "Twilio Account SID", "Alternative SMS provider")}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-32">
          <Key className="w-4 h-4 mr-2" />
          Save API Keys
        </Button>
      </div>
    </div>
  )
}
