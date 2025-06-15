import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function CareTeam() {
  const careTeam = [
    {
      name: "Dr. Sarah Johnson",
      role: "Attending Physician",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "SJ"
    },
    {
      name: "Mike Wilson, RN",
      role: "Primary Nurse",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "MW"
    },
    {
      name: "Lisa Chen, PT",
      role: "Physical Therapist",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "LC"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Care Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {careTeam.map((member, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-gray-500">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
