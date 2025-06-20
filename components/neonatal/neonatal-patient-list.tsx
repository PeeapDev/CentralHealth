"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { FileEdit, Eye, Clipboard } from "lucide-react"

interface NeonatalPatient {
  id: string
  name: string
  dateOfBirth: string
  ageInDays: number
  birthWeight: number
  careLevel: "normal" | "intensive" | "critical"
  status: "active" | "discharged" | "transferred" | "deceased"
  dischargeStatus?: "ready" | "not-ready"
  imageUrl?: string
  motherId?: string
}

interface NeonatalPatientListProps {
  patients: NeonatalPatient[]
  isLoading: boolean
  hospitalName: string
}

export function NeonatalPatientList({ patients, isLoading, hospitalName }: NeonatalPatientListProps) {
  // Function to get care level badge color
  const getCareLevelBadge = (careLevel: string) => {
    switch (careLevel) {
      case "critical": return "bg-red-100 text-red-800 hover:bg-red-200"
      case "intensive": return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      case "normal": return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "discharged": return "outline"
      case "transferred": return "secondary"
      case "deceased": return "destructive"
      default: return "outline"
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
        <p className="text-muted-foreground">No neonatal patients found</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Birth Weight</TableHead>
          <TableHead>Care Level</TableHead>
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
                  <p className="text-sm text-muted-foreground">
                    Born: {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>{patient.ageInDays} days</TableCell>
            <TableCell>{patient.birthWeight} g</TableCell>
            <TableCell>
              <Badge className={getCareLevelBadge(patient.careLevel)}>
                {patient.careLevel.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(patient.status)}>
                {patient.status}
                {patient.dischargeStatus === "ready" && patient.status === "active" && (
                  <span className="ml-2">(Ready for discharge)</span>
                )}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link href={`/${hospitalName}/admin/patients/${patient.id}/neonatal`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link href={`/${hospitalName}/admin/patients/${patient.id}/neonatal/chart`}>
                    <Clipboard className="h-4 w-4 mr-1" />
                    Chart
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
