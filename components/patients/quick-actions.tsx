import { MessageSquare, Plus, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function QuickActions() {
  const actions = [
    {
      label: "Message Nurse",
      icon: MessageSquare
    },
    {
      label: "Request Service",
      icon: Plus
    },
    {
      label: "View Records",
      icon: FileText
    },
    {
      label: "Schedule",
      icon: Calendar
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button 
                key={index}
                variant="outline" 
                className="h-auto p-3 flex flex-col items-center space-y-2"
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
