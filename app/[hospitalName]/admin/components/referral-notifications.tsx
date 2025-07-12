"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Bell, Clock, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchWithAuth } from '@/utils/api-utils'

interface Referral {
  id: string
  patientId: string
  patient: {
    name: any
    mrn: string
  }
  fromHospital: {
    name: string
  }
  priority: string
  status: string
  createdAt: string
}

export function ReferralNotifications({ hospitalName }: { hospitalName: string }) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true)
        
        // Ensure hospital name is properly formatted (no spaces, lowercase)
        const formattedHospitalName = hospitalName.toLowerCase().replace(/\s+/g, '-')
        console.log(`Fetching referrals for hospital: ${formattedHospitalName}`)
        
        // Try the main referrals endpoint first
        const apiUrl = `/api/hospitals/${formattedHospitalName}/referrals?status=PENDING`
        console.log(`Calling API endpoint: ${apiUrl}`)
        
        try {
          // Use authenticated fetch utility with explicit error handling
          const response = await fetch(apiUrl, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`API Error (${response.status}): ${errorText}`)
            throw new Error(`API request failed: ${response.status} ${response.statusText}`)
          }
          
          const data = await response.json()
          console.log('Referrals data received:', data)
          
          // Use the referrals directly since we already filtered by status in the API call
          const pendingReferrals = data.referrals || []
          console.log(`Found ${pendingReferrals.length} pending referrals for ${formattedHospitalName}`)
          
          setReferrals(pendingReferrals)
          setError(null)
        } catch (fetchError) {
          console.error(`Error fetching from ${apiUrl}:`, fetchError)
          
          // Try a fallback approach for development - fetch all referrals
          if (process.env.NODE_ENV === 'development') {
            try {
              console.log('Development mode: Attempting to fetch all referrals')
              const fallbackResponse = await fetch(`/api/hospitals/${formattedHospitalName}/referrals`)
              
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json()
                const fallbackReferrals = fallbackData.referrals || []
                const pendingOnly = fallbackReferrals.filter((ref: { status: string }) => ref.status === 'PENDING')
                
                console.log(`Fallback: Found ${pendingOnly.length} pending referrals`)
                setReferrals(pendingOnly)
                setError(null)
                return
              }
            } catch (fallbackError) {
              console.error('Fallback fetch also failed:', fallbackError)
            }
          }
          
          throw fetchError // Re-throw if both attempts fail
        }
      } catch (err) {
        console.error("Error fetching referrals:", err)
        setError("Failed to load referrals")
        setReferrals([]) // Ensure we have an empty array rather than undefined
      } finally {
        setLoading(false)
      }
    }

    if (hospitalName) {
      fetchReferrals()
    }
    
    // Set up polling for new referrals every 30 seconds
    const intervalId = setInterval(fetchReferrals, 30000)
    
    return () => clearInterval(intervalId)
  }, [hospitalName])

  // Format patient name from JSON structure
  const formatPatientName = (nameObj: any): string => {
    try {
      if (typeof nameObj === 'string') {
        return nameObj
      }
      
      if (nameObj.given && nameObj.family) {
        return `${Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given} ${nameObj.family}`
      }
      
      return "Unknown"
    } catch {
      return "Unknown"
    }
  }

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "EMERGENCY":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "URGENT":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  // Get priority class
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "EMERGENCY":
        return "bg-red-500"
      case "URGENT":
        return "bg-amber-500"
      default:
        return "bg-blue-500"
    }
  }

  // Handle view referral
  const handleViewReferral = (referralId: string) => {
    router.push(`/${hospitalName}/admin/referral?id=${referralId}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {referrals.length > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center translate-x-1/3 -translate-y-1/3">
              {referrals.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="font-medium">Incoming Referrals</div>
          <div className="text-xs text-muted-foreground">
            {referrals.length} pending referrals
          </div>
        </div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading referrals...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">
              {error}
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No pending referrals
            </div>
          ) : (
            <div>
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-start gap-4 p-4 border-b last:border-0 hover:bg-muted/50"
                >
                  <div className={cn("mt-1 h-2 w-2 rounded-full", getPriorityClass(referral.priority))} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium flex items-center gap-1">
                        {getPriorityIcon(referral.priority)}
                        {formatPatientName(referral.patient.name)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({referral.patient.mrn})
                        </span>
                      </div>
                      <Badge variant={referral.priority === "EMERGENCY" ? "destructive" : "outline"}>
                        {referral.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      From: {referral.fromHospital.name}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReferral(referral.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push(`/${hospitalName}/admin/referral`)}
          >
            View All Referrals
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
