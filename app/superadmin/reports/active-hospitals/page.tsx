import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

export default function ActiveHospitalsReportPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Active Hospitals"
        description="Welcome to Active Hospitals - View reports of all active hospital instances"
        breadcrumbs={[{ label: "Home" }, { label: "Reports" }, { label: "Active Hospitals" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Hospitals Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Active Hospitals</p>
            <p className="text-sm">View active hospitals report here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
