import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope } from "lucide-react"

export default function RegisteredDoctorsReportPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Registered Doctor"
        description="Welcome to Registered Doctor - View reports of all registered doctors across hospitals"
        breadcrumbs={[{ label: "Home" }, { label: "Reports" }, { label: "Registered Doctor" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Registered Doctors Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Registered Doctor</p>
            <p className="text-sm">View registered doctors report here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
