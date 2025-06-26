import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Building, Bell, Shield, Palette, Database, Trash2, LifeBuoy, RefreshCw } from "lucide-react"
import Link from "next/link"

interface SettingsPageProps {
  params: { hospitalName: string }
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const hospitalName = params.hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - Hospital Settings`}
        description="Configure hospital information, preferences, and system settings"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Settings" }]}
      />

      <div className="grid gap-6">
        {/* Hospital Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Hospital Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name</Label>
                <Input id="hospitalName" defaultValue={hospitalName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalCode">Hospital Code</Label>
                <Input id="hospitalCode" defaultValue="HSP001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                defaultValue="A leading healthcare facility providing comprehensive medical services"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="info@hospital.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" defaultValue="123 Medical Center Drive, Healthcare City, HC 12345" rows={2} />
            </div>
            <Button>Save Hospital Information</Button>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>24-Hour Time Format</Label>
                <p className="text-sm text-muted-foreground">Use 24-hour time format throughout the system</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Save Patient Records</Label>
                <p className="text-sm text-muted-foreground">Automatically save patient records every 5 minutes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Audit Logging</Label>
                <p className="text-sm text-muted-foreground">Log all user actions for security and compliance</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Enable maintenance mode to restrict access</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send SMS notifications for urgent alerts</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Emergency Alerts</Label>
                <p className="text-sm text-muted-foreground">Immediate notifications for emergency situations</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">Send reminders to patients before appointments</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Restriction</Label>
                <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="space-y-4">
              <Label>Password Policy</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input id="minLength" type="number" defaultValue="8" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAge">Password Age (days)</Label>
                  <Input id="maxAge" type="number" defaultValue="90" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Enable dark theme for the interface</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input id="primaryColor" type="color" defaultValue="#3b82f6" className="w-16 h-10" />
                <Input defaultValue="#3b82f6" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Hospital Logo</Label>
              <Input id="logo" type="file" accept="image/*" />
            </div>
          </CardContent>
        </Card>
        
        {/* Admin Utilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Admin Utilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clear Cache */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Clear Application Cache</Label>
                <p className="text-sm text-muted-foreground">
                  Remove cached patient data, sessions, and medical IDs to resolve login issues
                </p>
              </div>
              <Link href={`/${params.hospitalName}/admin/settings/utilities/clear-cache`} passHref>
                <Button variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Clear Cache
                </Button>
              </Link>
            </div>
            <Separator />
            
            {/* System Diagnostics */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Diagnostics</Label>
                <p className="text-sm text-muted-foreground">
                  Run diagnostics to check database connections and system health
                </p>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4" />
                Run Diagnostics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save All Settings */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save All Settings</Button>
        </div>
      </div>
    </div>
  )
}
