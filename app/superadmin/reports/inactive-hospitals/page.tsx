import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pause } from "lucide-react"

export default function InactiveHospitalsReportPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Inactive Hospitals"
        description="Welcome to Inactive Hospitals - View reports of all inactive hospital instances"
        breadcrumbs={[{ label: "Home" }, { label: "Reports" }, { label: "Inactive Hospitals" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Inactive Hospitals Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Pause className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Inactive Hospitals</p>
            <p className="text-sm">View inactive hospitals report here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
