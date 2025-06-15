import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface PatientHeaderProps {
  patient: {
    id: string
    name: string
    age: string
    gender: string
    bloodType: string
    room: string
    admitDate: string
    doctor: string
    status: string
  }
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Patient" />
            <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
            <p className="text-gray-600">Patient ID: #{patient.id}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Age: {patient.age}</span>
              <span>•</span>
              <span>{patient.gender}</span>
              <span>•</span>
              <span>Blood Type: {patient.bloodType}</span>
              <span>•</span>
              <span>Room: {patient.room}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="mb-2">
            {patient.status}
          </Badge>
          <p className="text-sm text-gray-500">Admitted: {patient.admitDate}</p>
          <p className="text-sm text-gray-500">{patient.doctor}</p>
        </div>
      </div>
    </div>
  )
}
