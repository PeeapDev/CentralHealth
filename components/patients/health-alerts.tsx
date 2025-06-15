import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function HealthAlerts() {
  const alerts = [
    { message: "Blood pressure slightly elevated", type: "Monitor" },
    { message: "Medication due in 30 minutes", type: "Reminder" }
  ]

  return (
    <div className="mb-8">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Health Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-orange-700">{alert.message}</span>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  {alert.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
