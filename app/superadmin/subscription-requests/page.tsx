import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function SubscriptionRequestsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Subscription Request"
        description="Welcome to Subscription Request - Manage and review subscription requests"
        breadcrumbs={[{ label: "Home" }, { label: "Subscription" }, { label: "Subscription Request" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Subscription Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Subscription Request</p>
            <p className="text-sm">Manage subscription requests here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
