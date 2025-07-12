"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, UserCheck, Eye } from "lucide-react"
import { getPatientReferrals, LocalReferral } from "@/utils/referral-storage"
import { fetchWithAuth } from "@/utils/api-utils"

interface PatientReferralsClientProps {
  patientId?: string
  mrn?: string // Using mrn as the standard field for medical ID
}

export function PatientReferralsClient({ patientId, mrn }: PatientReferralsClientProps) {
  const [referrals, setReferrals] = useState<LocalReferral[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  useEffect(() => {
    if (!isClient || !mrn) return
    
    const loadReferrals = async () => {
      // First try to get referrals from API (silently)
      let apiReferrals: any[] = []
      try {
        apiReferrals = await fetchWithAuth<any[]>(`/api/patients/${mrn}/referrals`, {
          silent: true,
          suppressAuthErrors: true
        })
      } catch (error) {
        // Silently handle API errors
      }
      
      // Get referrals from local storage
      const localReferrals = getPatientReferrals(mrn)
      
      // Merge referrals, avoiding duplicates by referral code
      const apiReferralCodes = new Set(apiReferrals.map(ref => ref.referralCode))
      const uniqueLocalReferrals = localReferrals.filter(
        local => !apiReferralCodes.has(local.referralCode)
      )
      
      // Convert API referrals to match LocalReferral format
      const convertedApiReferrals: LocalReferral[] = apiReferrals.map(api => ({
        id: api.id,
        createdAt: api.createdAt,
        referralCode: api.referralCode,
        patientId: api.patientId,
        patientName: api.patientName || 'Unknown',
        mrn: mrn,
        fromHospitalId: api.fromHospitalId,
        fromHospitalName: api.fromHospital?.name || 'Unknown Hospital',
        toHospitalId: api.toHospitalId,
        toHospitalName: api.toHospital?.name || 'Unknown Hospital',
        priority: api.priority || 'ROUTINE',
        status: api.status,
        notes: api.notes || '',
        reason: api.reason || '',
        requiresAmbulance: api.requiresAmbulance || false
      }))
      
      // Combine both sources
      setReferrals([...convertedApiReferrals, ...uniqueLocalReferrals])
    }
    
    loadReferrals()
  }, [mrn, isClient])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "ACCEPTED":
        return (
          <Badge className="bg-blue-500 text-white">
            <UserCheck className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive">Urgent</Badge>
      case "PRIORITY":
        return <Badge className="bg-yellow-500 text-white">Priority</Badge>
      case "ROUTINE":
        return <Badge className="bg-green-500 text-white">Routine</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  // Don't render anything during SSR
  if (!isClient) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Your Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No referrals found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral ID</TableHead>
                  <TableHead>To Hospital</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-mono text-xs">
                      {referral.referralCode}
                    </TableCell>
                    <TableCell>{referral.toHospitalName}</TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell>{new Date(referral.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getPriorityBadge(referral.priority)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
