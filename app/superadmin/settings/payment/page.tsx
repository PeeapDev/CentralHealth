import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

export default function PaymentSettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Payment Settings"
        description="Welcome to Payment Settings - Configure payment processing and billing settings"
        breadcrumbs={[{ label: "Home" }, { label: "System Settings" }, { label: "Payment Settings" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Payment Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Payment Settings</p>
            <p className="text-sm">Configure your payment processing settings here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
