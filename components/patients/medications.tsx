import { Pill } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function Medications() {
  const medications = [
    { 
      name: "Lisinopril", 
      dosage: "10mg - Once daily", 
      status: "Active", 
      statusColor: "green" 
    },
    { 
      name: "Metformin", 
      dosage: "500mg - Twice daily", 
      status: "Active", 
      statusColor: "green" 
    },
    { 
      name: "Ibuprofen", 
      dosage: "400mg - As needed", 
      status: "PRN", 
      statusColor: "orange" 
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Pill className="h-5 w-5" />
          <span>Current Medications</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {medications.map((medication, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{medication.name}</div>
                <div className="text-sm text-gray-500">{medication.dosage}</div>
              </div>
              <Badge variant="outline" className={`text-${medication.statusColor}-600`}>
                {medication.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
