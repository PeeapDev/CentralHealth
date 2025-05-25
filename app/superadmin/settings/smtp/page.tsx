import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function SmtpSettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Email / SMTP Settings"
        description="Welcome to Email / SMTP Settings - Configure email server and SMTP settings"
        breadcrumbs={[{ label: "Home" }, { label: "System Settings" }, { label: "Email / SMTP" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Email / SMTP Settings</p>
            <p className="text-sm">Configure your email server settings here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
