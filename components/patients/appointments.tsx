import { Calendar, Clock, User, FileText } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function Appointments() {
  const appointments = [
    {
      type: "Physical Therapy",
      date: "Today, 2:00 PM",
      location: "Room 205 - Therapy Wing",
      icon: Clock,
      highlight: true
    },
    {
      type: "Dr. Johnson Follow-up",
      date: "Tomorrow, 10:00 AM",
      location: "Room 302A",
      icon: User,
      highlight: false
    },
    {
      type: "Lab Work",
      date: "Oct 18, 8:00 AM",
      location: "Laboratory - 1st Floor",
      icon: FileText,
      highlight: false
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Upcoming Appointments</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.map((appointment, index) => {
            const Icon = appointment.icon
            return (
              <div 
                key={index} 
                className={`flex items-start space-x-3 p-3 ${
                  appointment.highlight ? "bg-blue-50" : "border"
                } rounded-lg`}
              >
                <Icon className={`h-5 w-5 ${
                  appointment.highlight ? "text-blue-600" : "text-gray-600"
                } mt-0.5`} />
                <div className="flex-1">
                  <div className="font-medium">{appointment.type}</div>
                  <div className="text-sm text-gray-600">{appointment.date}</div>
                  <div className="text-sm text-gray-500">{appointment.location}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
