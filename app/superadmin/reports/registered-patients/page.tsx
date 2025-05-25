import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function RegisteredPatientsReportPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Registered Patient"
        description="Welcome to Registered Patient - View reports of all registered patients across hospitals"
        breadcrumbs={[{ label: "Home" }, { label: "Reports" }, { label: "Registered Patient" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Registered Patients Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Registered Patient</p>
            <p className="text-sm">View registered patients report here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
