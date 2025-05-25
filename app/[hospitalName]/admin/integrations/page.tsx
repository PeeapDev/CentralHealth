"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/page-header"
import {
  Activity,
  MessageSquare,
  Users,
  Send,
  Database,
  Smartphone,
  CheckCircle,
  AlertCircle,
  FolderSyncIcon as Sync,
  Bell,
} from "lucide-react"
import { toast } from "sonner"

export default function IntegrationsPage() {
  const [fhirEnabled, setFhirEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(true)
  const [testPhone, setTestPhone] = useState("+1234567890")
  const [testMessage, setTestMessage] = useState("Hello! This is a test message from Smart Hospital.")
  const [loading, setLoading] = useState(false)

  const [fhirStats, setFhirStats] = useState({
    totalPatients: 1247,
    syncedToday: 23,
    lastSync: "2024-05-24T10:30:00Z",
    status: "connected",
  })

  const [smsStats, setSmsStats] = useState({
    sentToday: 45,
    sentThisMonth: 1250,
    lastSent: "2024-05-24T11:15:00Z",
    status: "connected",
  })

  const testSMS = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/v1/integrations/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          to: testPhone,
          text: testMessage,
          type: "test",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Test SMS sent successfully!")
        setSmsStats((prev) => ({
          ...prev,
          sentToday: prev.sentToday + 1,
          lastSent: new Date().toISOString(),
        }))
      } else {
        toast.error("Failed to send test SMS")
      }
    } catch (error) {
      toast.error("Error sending test SMS")
    } finally {
      setLoading(false)
    }
  }

  const syncFHIR = async () => {
    setLoading(true)
    try {
      // Simulate FHIR sync
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success("FHIR sync completed successfully!")
      setFhirStats((prev) => ({
        ...prev,
        syncedToday: prev.syncedToday + 5,
        lastSync: new Date().toISOString(),
      }))
    } catch (error) {
      toast.error("FHIR sync failed")
    } finally {
      setLoading(false)
    }
  }

  const sendAppointmentReminders = async () => {
    setLoading(true)
    try {
      // Simulate sending appointment reminders
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success("Appointment reminders sent to 12 patients!")
      setSmsStats((prev) => ({
        ...prev,
        sentToday: prev.sentToday + 12,
        lastSent: new Date().toISOString(),
      }))
    } catch (error) {
      toast.error("Failed to send appointment reminders")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Integrations"
        description="Manage FHIR and SMS integrations for seamless healthcare data exchange and communication"
        breadcrumbs={[{ label: "Dashboard", href: "/smart-hospital/admin" }, { label: "Integrations" }]}
      />

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FHIR Integration</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={fhirStats.status === "connected" ? "default" : "destructive"}>
                {fhirStats.status === "connected" ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {fhirStats.status}
              </Badge>
              <Switch checked={fhirEnabled} onCheckedChange={setFhirEnabled} />
            </div>
            <div className="text-2xl font-bold">{fhirStats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Total patients • {fhirStats.syncedToday} synced today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Integration</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={smsStats.status === "connected" ? "default" : "destructive"}>
                {smsStats.status === "connected" ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {smsStats.status}
              </Badge>
              <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
            </div>
            <div className="text-2xl font-bold">{smsStats.sentToday}</div>
            <p className="text-xs text-muted-foreground">Sent today • {smsStats.sentThisMonth} this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fhir" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fhir">FHIR Integration</TabsTrigger>
          <TabsTrigger value="sms">SMS Integration</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="fhir" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>FHIR (Fast Healthcare Interoperability Resources)</span>
              </CardTitle>
              <CardDescription>
                Sync patient data with FHIR-compliant healthcare systems for seamless interoperability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  FHIR integration allows you to exchange healthcare data with other systems using industry-standard
                  formats. Configure your FHIR endpoint in System Settings → API Keys.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>FHIR Endpoint</Label>
                  <Input value="https://hapi.fhir.org/baseR4" disabled />
                </div>
                <div className="space-y-2">
                  <Label>FHIR Version</Label>
                  <Input value="R4" disabled />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sync Statistics</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{fhirStats.totalPatients}</div>
                    <div className="text-sm text-muted-foreground">Total Patients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{fhirStats.syncedToday}</div>
                    <div className="text-sm text-muted-foreground">Synced Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Date(fhirStats.lastSync).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Sync</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button onClick={syncFHIR} disabled={loading || !fhirEnabled}>
                  <Sync className="w-4 h-4 mr-2" />
                  {loading ? "Syncing..." : "Sync Now"}
                </Button>
                <Button variant="outline" disabled={!fhirEnabled}>
                  <Users className="w-4 h-4 mr-2" />
                  View FHIR Patients
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>RapidPro SMS Integration</span>
              </CardTitle>
              <CardDescription>
                Send automated SMS notifications for appointments, reminders, and patient communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  RapidPro SMS integration enables automated patient communication including appointment reminders,
                  prescription notifications, and lab result alerts.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <Input value="https://rapidpro.io/api/v2" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge variant="default">Connected</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SMS Statistics</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{smsStats.sentToday}</div>
                    <div className="text-sm text-muted-foreground">Sent Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{smsStats.sentThisMonth}</div>
                    <div className="text-sm text-muted-foreground">Sent This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Date(smsStats.lastSent).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Sent</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test SMS</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="testPhone">Phone Number</Label>
                    <Input
                      id="testPhone"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testMessage">Message</Label>
                    <Input
                      id="testMessage"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Test message"
                    />
                  </div>
                </div>
                <Button onClick={testSMS} disabled={loading || !smsEnabled}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Sending..." : "Send Test SMS"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Automated Notifications</span>
              </CardTitle>
              <CardDescription>Configure automated SMS and FHIR sync workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Appointment Reminders</CardTitle>
                    <CardDescription>Send SMS reminders 24 hours before appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Switch defaultChecked />
                      <Button size="sm" onClick={sendAppointmentReminders} disabled={loading}>
                        Send Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Lab Results Notifications</CardTitle>
                    <CardDescription>Notify patients when lab results are ready</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Switch defaultChecked />
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Prescription Reminders</CardTitle>
                    <CardDescription>Remind patients to take medications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Switch />
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">FHIR Auto-Sync</CardTitle>
                    <CardDescription>Automatically sync patient data every hour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Switch defaultChecked />
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
