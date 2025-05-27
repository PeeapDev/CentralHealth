"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Save, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SmtpSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [formData, setFormData] = useState({
    host: "",
    port: "587", // Default port
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Hospital Management System",
    encryption: "tls", // Default encryption
    enabled: true
  })
  
  const [testEmail, setTestEmail] = useState("") // For test email address input

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle toggle switch
  const handleToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, enabled: checked }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Load SMTP settings on page load
  const loadSmtpSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/smtp')
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          ...data
        }))
        // Set test email to fromEmail by default if it exists
        if (data.fromEmail) {
          setTestEmail(data.fromEmail)
        }
      }
    } catch (error) {
      console.error('Failed to load SMTP settings:', error)
      toast({
        title: "Error loading settings",
        description: "Could not load SMTP settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Save SMTP settings
  const saveSettings = async () => {
    setLoading(true)
    try {
      // Validate required fields if SMTP is enabled
      if (formData.enabled) {
        const requiredFields = ['host', 'port', 'username', 'password', 'fromEmail'] as const
        for (const field of requiredFields) {
          if (!formData[field]) {
            throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required when SMTP is enabled`)
          }
        }
      }

      const response = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "✅ Settings saved successfully",
          description: "SMTP settings have been updated",
          duration: 5000
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "❌ Error saving settings",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
        duration: 7000
      })
    } finally {
      setLoading(false)
    }
  }

  // Send test email
  const sendTestEmail = async () => {
    // Show immediate feedback that we're attempting to send
    toast({
      title: "Sending test email...",
      description: `Attempting to send email to ${testEmail}`,
    })
    // Validate test email address
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "❌ Invalid email address",
        description: "Please enter a valid email address for testing",
        variant: "destructive",
        duration: 3000
      })
      return
    }
    
    setTestLoading(true)
    try {
      // First, save the current settings
      await saveSettings()
      
      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          testEmail: testEmail // Use the specified test email
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Show success toast
        toast({
          title: "✅ Test email sent successfully",
          description: `A test email has been sent to ${testEmail}`,
          duration: 5000
        })
        console.log('Email test result:', result)
      } else {
        const error = await response.json()
        throw new Error(error.message || error.details || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Test email error:', error)
      // Show error toast
      toast({
        title: "❌ Error sending test email",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
        duration: 7000
      })
    } finally {
      setTestLoading(false)
    }
  }

  // Load settings on component mount
  useEffect(() => {
    loadSmtpSettings()
  }, [])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Email / SMTP Settings"
        description="Configure email server and SMTP settings for sending notifications and admin credentials"
        breadcrumbs={[{ label: "Home" }, { label: "System Settings" }, { label: "Email / SMTP" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>
            Configure the SMTP settings to enable sending emails from the system.
            These settings will be used to send admin credentials when creating new hospitals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable SMTP</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on to enable sending emails from the system
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={handleToggle}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host</Label>
                <Input
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  placeholder="e.g. smtp.gmail.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="port">SMTP Port</Label>
                <Input
                  id="port"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  placeholder="e.g. 587"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="encryption">Encryption</Label>
                <Select
                  value={formData.encryption}
                  onValueChange={(value) => handleSelectChange('encryption', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select encryption type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">SMTP Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username or email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">SMTP Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password or app password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  name="fromEmail"
                  value={formData.fromEmail}
                  onChange={handleChange}
                  placeholder="noreply@yourhospital.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  name="fromName"
                  value={formData.fromName}
                  onChange={handleChange}
                  placeholder="Hospital Management System"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button onClick={saveSettings} disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="flex flex-col space-y-2">
                <div className="flex">
                  <Input
                    placeholder="Email for testing"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="mr-2"
                  />
                  <Button variant="outline" onClick={sendTestEmail} disabled={testLoading || !formData.enabled || loading}>
                    {testLoading ? "Sending..." : "Send Test Email"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter an email address to receive a test email
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
