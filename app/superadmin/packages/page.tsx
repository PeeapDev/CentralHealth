import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

export default function PackagesPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Packages"
        description="Welcome to Packages - Manage subscription packages and pricing plans"
        breadcrumbs={[{ label: "Home" }, { label: "Subscription" }, { label: "Packages" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Package Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Packages</p>
            <p className="text-sm">Manage subscription packages here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
