import { Activity, Heart, Thermometer, TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function VitalSigns() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Vital Signs</span>
        </CardTitle>
        <CardDescription>Latest readings from today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-700">72</div>
            <div className="text-sm text-red-600">Heart Rate</div>
            <div className="text-xs text-gray-500">bpm</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">120/80</div>
            <div className="text-sm text-blue-600">Blood Pressure</div>
            <div className="text-xs text-gray-500">mmHg</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Thermometer className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">98.6°F</div>
            <div className="text-sm text-green-600">Temperature</div>
            <div className="text-xs text-gray-500">Normal</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-700">98%</div>
            <div className="text-sm text-purple-600">Oxygen Sat</div>
            <div className="text-xs text-gray-500">SpO2</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
