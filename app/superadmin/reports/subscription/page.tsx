import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function SubscriptionReportPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Subscription Report"
        description="Welcome to Subscription Report - View detailed subscription analytics and reports"
        breadcrumbs={[{ label: "Home" }, { label: "Reports" }, { label: "Subscription Report" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Subscription Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Subscription Report</p>
            <p className="text-sm">View subscription analytics here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
