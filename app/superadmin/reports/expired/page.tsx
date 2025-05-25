import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function ExpiredReportPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Expired"
        description="Welcome to Expired - View reports of expired hospital licenses and subscriptions"
        breadcrumbs={[{ label: "Home" }, { label: "Reports" }, { label: "Expired" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Expired Licenses Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Expired</p>
            <p className="text-sm">View expired licenses report here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
