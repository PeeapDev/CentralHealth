import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function TreatmentProgress() {
  const progressItems = [
    { name: "Pain Management", value: 85 },
    { name: "Mobility Recovery", value: 60 },
    { name: "Medication Compliance", value: 95 }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Progress</CardTitle>
        <CardDescription>Recovery milestones and goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {progressItems.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span>{item.name}</span>
                <span>{item.value}%</span>
              </div>
              <Progress value={item.value} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
