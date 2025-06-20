"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { FileEdit, Eye, CalendarPlus } from "lucide-react"

interface AntenatalPatient {
  id: string
  name: string
  age: number
  gestationalAge: number
  nextAppointment: string
  riskLevel: "low" | "medium" | "high"
  status: "active" | "completed" | "referred" | "transferred"
  trimester: 1 | 2 | 3
  imageUrl?: string
}

interface AntenatalPatientListProps {
  patients: AntenatalPatient[]
  isLoading: boolean
  hospitalName: string
}

export function AntenatalPatientList({ patients, isLoading, hospitalName }: AntenatalPatientListProps) {
  // Function to get risk level badge color
  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high": return "bg-red-100 text-red-800 hover:bg-red-200"
      case "medium": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "low": return "bg-green-100 text-green-800 hover:bg-green-200"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (isLoading) {
    return (
      <div className="w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-4 border-b">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No antenatal patients found</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Gestational Age</TableHead>
          <TableHead>Trimester</TableHead>
          <TableHead>Risk Level</TableHead>
          <TableHead>Next Appointment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  {patient.imageUrl ? (
                    <AvatarImage src={patient.imageUrl} alt={patient.name} />
                  ) : null}
                  <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">{patient.age} years</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{patient.gestationalAge} weeks</TableCell>
            <TableCell>{patient.trimester}</TableCell>
            <TableCell>
              <Badge className={getRiskBadgeColor(patient.riskLevel)}>
                {patient.riskLevel.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>
              {patient.nextAppointment ? (
                formatDistanceToNow(new Date(patient.nextAppointment), { addSuffix: true })
              ) : (
                "Not scheduled"
              )}
            </TableCell>
            <TableCell>
              <Badge variant={patient.status === "active" ? "default" : "outline"}>
                {patient.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link href={`/${hospitalName}/admin/patients/${patient.id}/antenatal`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link href={`/${hospitalName}/admin/patients/${patient.id}/antenatal/appointment`}>
                    <CalendarPlus className="h-4 w-4 mr-1" />
                    Appointment
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
