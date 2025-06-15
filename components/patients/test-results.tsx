import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function TestResults() {
  const testResults = [
    { 
      name: "Complete Blood Count (CBC)", 
      date: "Oct 16, 2024 - 9:30 AM", 
      status: "Normal", 
      statusColor: "green" 
    },
    { 
      name: "Chest X-Ray", 
      date: "Oct 15, 2024 - 2:15 PM", 
      status: "Clear", 
      statusColor: "green" 
    },
    { 
      name: "Blood Glucose", 
      date: "Oct 16, 2024 - 7:00 AM", 
      status: "Elevated", 
      statusColor: "yellow" 
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Recent Test Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testResults.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{test.name}</div>
                <div className="text-sm text-gray-500">{test.date}</div>
              </div>
              <Badge 
                variant="secondary" 
                className={`bg-${test.statusColor}-100 text-${test.statusColor}-800`}
              >
                {test.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
