import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, FileText, Clock, UserPlus, CalendarPlus, Activity } from "lucide-react"

export default function UserDashboard() {
  const stats = [
    {
      title: "My Patients",
      value: "24",
      change: "3 new today",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Today's Appointments",
      value: "12",
      change: "2 upcoming",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Pending Reports",
      value: "8",
      change: "Due this week",
      icon: FileText,
      color: "text-yellow-600",
    },
    {
      title: "Hours Logged",
      value: "6.5",
      change: "Today",
      icon: Clock,
      color: "text-purple-600",
    },
  ]

  const todaySchedule = [
    {
      time: "09:00 AM",
      patient: "John Smith",
      type: "Consultation",
      room: "Room 201",
      status: "completed",
    },
    {
      time: "10:30 AM",
      patient: "Sarah Johnson",
      type: "Follow-up",
      room: "Room 203",
      status: "completed",
    },
    {
      time: "02:00 PM",
      patient: "Michael Brown",
      type: "Consultation",
      room: "Room 201",
      status: "current",
    },
    {
      time: "03:30 PM",
      patient: "Emily Davis",
      type: "Check-up",
      room: "Room 205",
      status: "upcoming",
    },
    {
      time: "04:45 PM",
      patient: "Robert Wilson",
      type: "Consultation",
      room: "Room 201",
      status: "upcoming",
    },
  ]

  const recentActivities = [
    {
      action: "Updated patient record",
      patient: "John Smith",
      time: "10 minutes ago",
    },
    {
      action: "Prescribed medication",
      patient: "Sarah Johnson",
      time: "1 hour ago",
    },
    {
      action: "Completed consultation",
      patient: "Michael Brown",
      time: "2 hours ago",
    },
    {
      action: "Reviewed lab results",
      patient: "Emily Davis",
      time: "3 hours ago",
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            New Patient
          </Button>
          <Button variant="outline">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's Schedule */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your appointments and consultations for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySchedule.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium w-20">{appointment.time}</div>
                    <div>
                      <p className="text-sm font-medium">{appointment.patient}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.type} • {appointment.room}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      appointment.status === "completed"
                        ? "outline"
                        : appointment.status === "current"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your recent patient interactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Activity className="h-4 w-4 mt-0.5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.patient} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
