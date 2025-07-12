"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, UserCheck, Eye, FileEdit, Trash } from "lucide-react"
import { getReferralsFromLocalStorage, LocalReferral, updateReferralStatus } from "@/utils/referral-storage"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ReferralTableClientProps {
  serverReferrals: any[]
  hospitalId?: string
}

export function ReferralTableClient({ serverReferrals, hospitalId }: ReferralTableClientProps) {
  const [allReferrals, setAllReferrals] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  // Load referrals from both server and local storage
  useEffect(() => {
    // Set client-side flag to avoid SSR issues
    setIsClient(true)
  }, [])
  
  // Load referrals whenever client-side is ready or props change
  useEffect(() => {
    if (!isClient) return
    
    // Get local referrals
    let localReferrals: LocalReferral[] = []
    try {
      console.log('Loading referrals from local storage...')
      localReferrals = getReferralsFromLocalStorage()
      console.log('Local referrals loaded:', localReferrals.length)
      
      // Filter by hospital if hospitalId is provided
      if (hospitalId) {
        localReferrals = localReferrals.filter(
          ref => ref.fromHospitalId === hospitalId || ref.toHospitalId === hospitalId
        )
        console.log('Filtered local referrals for hospital:', localReferrals.length)
      }
      
      // Transform local referrals to match server format
      const transformedLocalReferrals = localReferrals.map(local => ({
        id: local.id,
        referralCode: local.referralCode,
        patientName: local.patientName,
        patientId: local.patientId,
        referringHospital: local.fromHospitalName,
        receivingHospital: local.toHospitalName,
        status: local.status,
        priority: local.priority,
        date: new Date(local.createdAt).toISOString().split('T')[0],
        notes: local.notes || '',
        isLocal: true // Flag to identify locally stored referrals
      }))
      
      // Combine server and local referrals, avoiding duplicates
      // For simplicity, we'll consider referrals with the same referralCode as duplicates
      const serverReferralCodes = new Set(serverReferrals.map(ref => ref.referralCode))
      const uniqueLocalReferrals = transformedLocalReferrals.filter(
        local => !serverReferralCodes.has(local.referralCode)
      )
      
      console.log('Server referrals:', serverReferrals.length)
      console.log('Unique local referrals:', uniqueLocalReferrals.length)
      
      setAllReferrals([...serverReferrals, ...uniqueLocalReferrals])
    } catch (error) {
      console.error('Error loading referrals from local storage:', error)
      setAllReferrals(serverReferrals)
    }
  }, [serverReferrals, hospitalId, isClient])

  // Handle status update for referrals (both local and server)
  const handleStatusUpdate = (referralId: string, newStatus: string, isLocal: boolean) => {
    // For all referrals, we'll update local storage first
    const result = updateReferralStatus(referralId, newStatus)
    
    if (result.success) {
      // Update UI immediately
      const updatedReferrals = allReferrals.map(ref => 
        ref.id === referralId ? { ...ref, status: newStatus } : ref
      )
      setAllReferrals(updatedReferrals)
      
      toast({
        title: "Status Updated",
        description: result.message,
      })
    } else {
      toast({
        title: "Update Failed",
        description: result.message,
        variant: "destructive",
      })
    }
  }

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
      case "NONE":
        return <Badge variant="outline">None</Badge>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Referral ID</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Referring Hospital</TableHead>
          <TableHead>Receiving Hospital</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allReferrals.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
              No referrals found
            </TableCell>
          </TableRow>
        ) : (
          allReferrals.map((referral) => (
            <TableRow key={referral.id} className={referral.isLocal ? "bg-blue-50" : ""}>
              <TableCell className="font-mono text-xs">
                {referral.referralCode}
                {referral.isLocal && (
                  <Badge variant="outline" className="ml-2 text-xs">Local</Badge>
                )}
              </TableCell>
              <TableCell>{referral.patientName}</TableCell>
              <TableCell>{referral.referringHospital}</TableCell>
              <TableCell>{referral.receivingHospital}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {referral.notes || "No notes"}
              </TableCell>
              <TableCell>{getStatusBadge(referral.status)}</TableCell>
              <TableCell>{referral.date}</TableCell>
              <TableCell>{getPriorityBadge(referral.priority)}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" title="View Details">
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {/* Status change dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="ml-2">
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {referral.status !== "ACCEPTED" && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(referral.id, "ACCEPTED", referral.isLocal)}
                          className="text-blue-600"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Accept Referral
                        </DropdownMenuItem>
                      )}
                      {referral.status !== "COMPLETED" && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(referral.id, "COMPLETED", referral.isLocal)}
                          className="text-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Completed
                        </DropdownMenuItem>
                      )}
                      {referral.status !== "CANCELLED" && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(referral.id, "CANCELLED", referral.isLocal)}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Referral
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
