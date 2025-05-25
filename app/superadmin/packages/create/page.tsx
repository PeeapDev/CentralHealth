import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PackagePlus } from "lucide-react"

export default function CreatePackagePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Add New Package"
        description="Welcome to Add New Package - Create new subscription packages and pricing plans"
        breadcrumbs={[{ label: "Home" }, { label: "Subscription" }, { label: "Add New Package" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Create New Package</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <PackagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Welcome to Add New Package</p>
            <p className="text-sm">Create new subscription packages here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
