import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"

export default function SystemUpdatePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="System Update"
        description="Welcome to System Update - Manage system updates and version control"
        breadcrumbs={[{ label: "Home" }, { label: "System Settings" }, { label: "System Update" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>System Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to System Update</p>
            <p className="text-sm">Manage your system updates here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
