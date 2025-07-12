"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { fetchWithAuth } from "@/utils/api-utils"
import { getPatientReferrals, LocalReferral } from "@/utils/referral-storage"
import { format, parseISO, isValid } from 'date-fns'
import { AlertCircle, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamically import the dashboard layout with explicit named import
const DashboardLayout = dynamic(
  () => import('@/components/patients/dashboard/dashboard-layout').then(mod => ({ default: mod.DashboardLayout })),
  {
    loading: () => <div className="min-h-screen bg-slate-50 p-4">Loading...</div>,
    ssr: false,
  }
)

// Define referral priority and status types
type ReferralPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';
type ReferralStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

// Define referral type
interface Referral {
  id: string;
  patientId: string;
  fromHospitalId: string;
  toHospitalId: string;
  fromHospital: {
    id: string;
    name: string;
  };
  toHospital: {
    id: string;
    name: string;
  };
  referringDoctor: {
    id: string;
    name: string;
  };
  receivingDoctor?: {
    id: string;
    name: string;
  } | null;
  reason: string;
  notes?: string;
  priority: ReferralPriority;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  ambulanceDispatch?: {
    id: string;
    status: string;
    dispatchTime: string;
    estimatedArrival: string;
  } | null;
}

// Status badge component
function StatusBadge({ status }: { status: ReferralStatus }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
    case 'ACCEPTED':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Accepted</Badge>
    case 'REJECTED':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
    case 'COMPLETED':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
    case 'CANCELLED':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// Priority badge component
function PriorityBadge({ priority }: { priority: ReferralPriority }) {
  switch (priority) {
    case 'ROUTINE':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Routine</Badge>
    case 'URGENT':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Urgent</Badge>
    case 'EMERGENCY':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Emergency</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

// Referral card component
function ReferralCard({ referral }: { referral: Referral }) {
  const router = useRouter()
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date'
    } catch (error) {
      return 'Invalid date'
    }
  }
  
  // Get status icon
  const getStatusIcon = () => {
    switch (referral.status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'ACCEPTED':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }
  
  return (
    <Card className="mb-4 overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              {getStatusIcon()}
              Referral to {referral.toHospital.name}
            </CardTitle>
            <CardDescription>
              Created on {formatDate(referral.createdAt)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={referral.priority} />
            <StatusBadge status={referral.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">From Hospital</h4>
            <p className="font-medium">{referral.fromHospital.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">To Hospital</h4>
            <p className="font-medium">{referral.toHospital.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Referring Doctor</h4>
            <p className="font-medium">{referral.referringDoctor.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Receiving Doctor</h4>
            <p className="font-medium">{referral.receivingDoctor?.name || 'Not assigned yet'}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500">Reason</h4>
          <p className="mt-1">{referral.reason}</p>
        </div>
        
        {referral.notes && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500">Notes</h4>
            <p className="mt-1">{referral.notes}</p>
          </div>
        )}
        
        {referral.ambulanceDispatch && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-700">Ambulance Transport</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium">{referral.ambulanceDispatch.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dispatch Time</p>
                <p className="font-medium">{formatDate(referral.ambulanceDispatch.dispatchTime)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estimated Arrival</p>
                <p className="font-medium">{formatDate(referral.ambulanceDispatch.estimatedArrival)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => router.push(`/patient/referrals/${referral.id}`)}
        >
          View Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// Empty state component
function EmptyState({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">No {type} referrals</h3>
      <p className="mt-1 text-gray-500 max-w-md">
        {type === 'active' 
          ? 'You don\'t have any active referrals at the moment. Your doctor will create one when needed.'
          : 'You don\'t have any past referrals. Your referral history will appear here.'}
      </p>
    </div>
  )
}

export default function PatientReferralsPage() {
  const { toast } = useToast()
  const { profile, isLoading: isProfileLoading } = usePatientProfile()
  const [activeReferrals, setActiveReferrals] = useState<Referral[]>([])
  const [pastReferrals, setPastReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch referrals
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!profile?.mrn) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Try to fetch from API first (silently handle errors)
        let apiReferrals: Referral[] = []
        try {
          // Use silent mode and suppress auth errors to avoid console errors
          apiReferrals = await fetchWithAuth<Referral[]>(`/api/patients/${profile.mrn}/referrals`, {
            silent: true,
            suppressAuthErrors: true
          })
        } catch (apiErr) {
          // Silently handle API errors - we'll use local storage as fallback
          // No console logging here to keep the console clean
        }
        
        // Get referrals from local storage
        const localReferrals = getPatientReferrals(profile.mrn)
        
        // Convert local referrals to match Referral interface
        const convertedLocalReferrals: Referral[] = localReferrals.map((ref: LocalReferral) => ({
          id: ref.id,
          patientId: ref.patientId,
          fromHospitalId: ref.fromHospitalId,
          toHospitalId: ref.toHospitalId,
          fromHospital: {
            id: ref.fromHospitalId,
            name: ref.fromHospitalName || 'Unknown Hospital'
          },
          toHospital: {
            id: ref.toHospitalId,
            name: ref.toHospitalName || 'Unknown Hospital'
          },
          referringDoctor: {
            id: 'local',
            name: 'Referring Doctor'
          },
          receivingDoctor: null,
          reason: ref.reason || '',
          notes: ref.notes,
          priority: ref.priority as ReferralPriority,
          status: ref.status as ReferralStatus,
          createdAt: ref.createdAt,
          updatedAt: ref.createdAt,
          completedAt: null,
          ambulanceDispatch: ref.requiresAmbulance ? {
            id: 'local',
            status: 'PENDING',
            dispatchTime: ref.createdAt,
            estimatedArrival: ''
          } : null
        }))
        
        // Combine referrals from API and local storage
        // Use a Map to deduplicate by ID
        const referralMap = new Map()
        
        // Add API referrals first
        apiReferrals.forEach(ref => {
          referralMap.set(ref.id, ref)
        })
        
        // Add local referrals (will overwrite API referrals with same ID)
        convertedLocalReferrals.forEach(ref => {
          referralMap.set(ref.id, ref)
        })
        
        // Convert map back to array
        const allReferrals = Array.from(referralMap.values())
        
        // Split referrals into active and past
        const active = allReferrals.filter(ref => 
          ['PENDING', 'ACCEPTED'].includes(ref.status)
        )
        
        const past = allReferrals.filter(ref => 
          ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(ref.status)
        )
        
        setActiveReferrals(active)
        setPastReferrals(past)
        setIsLoading(false)
      } catch (err) {
        console.error('Error processing referrals:', err)
        setError(null) // Don't show error since we're using local storage
        
        // Try to load just from local storage as last resort
        try {
          const localReferrals = getPatientReferrals(profile.mrn)
          // Convert and display local referrals only
          // (simplified conversion for error recovery)
          const active = localReferrals
            .filter(ref => ['PENDING', 'ACCEPTED'].includes(ref.status))
            .map(ref => ({
              id: ref.id,
              patientId: ref.patientId,
              fromHospitalId: ref.fromHospitalId,
              toHospitalId: ref.toHospitalId,
              fromHospital: { id: ref.fromHospitalId, name: ref.fromHospitalName || 'Unknown' },
              toHospital: { id: ref.toHospitalId, name: ref.toHospitalName || 'Unknown' },
              referringDoctor: { id: 'local', name: 'Referring Doctor' },
              receivingDoctor: null,
              reason: ref.reason || '',
              notes: ref.notes || '',
              priority: ref.priority as ReferralPriority,
              status: ref.status as ReferralStatus,
              createdAt: ref.createdAt,
              updatedAt: ref.createdAt,
              completedAt: null,
              ambulanceDispatch: null
            })) as Referral[]
            
          const past = localReferrals
            .filter(ref => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(ref.status))
            .map(ref => ({
              id: ref.id,
              patientId: ref.patientId,
              fromHospitalId: ref.fromHospitalId,
              toHospitalId: ref.toHospitalId,
              fromHospital: { id: ref.fromHospitalId, name: ref.fromHospitalName || 'Unknown' },
              toHospital: { id: ref.toHospitalId, name: ref.toHospitalName || 'Unknown' },
              referringDoctor: { id: 'local', name: 'Referring Doctor' },
              receivingDoctor: null,
              reason: ref.reason || '',
              notes: ref.notes || '',
              priority: ref.priority as ReferralPriority,
              status: ref.status as ReferralStatus,
              createdAt: ref.createdAt,
              updatedAt: ref.createdAt,
              completedAt: null,
              ambulanceDispatch: null
            })) as Referral[]
            
          setActiveReferrals(active)
          setPastReferrals(past)
        } catch (localErr) {
          console.error('Error loading from local storage:', localErr)
          setError('Failed to load referrals. Please try again later.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    if (profile?.mrn) {
      fetchReferrals()
    }
  }, [profile, toast])
  
  // Render loading state
  if (isProfileLoading || isLoading) {
    return (
      <DashboardLayout 
        currentPage="referrals"
        breadcrumbs={[{ label: "Referrals" }]}
      >
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </DashboardLayout>
    )
  }
  
  // Render error state - only show if we couldn't load from either API or local storage
  if (error) {
    return (
      <DashboardLayout 
        currentPage="referrals"
        breadcrumbs={[{ label: "Referrals" }]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout 
      currentPage="referrals"
      breadcrumbs={[{ label: "Referrals" }]}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Referrals</h1>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              Active Referrals
              {activeReferrals.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeReferrals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Referrals
              {pastReferrals.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pastReferrals.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-2">
            {activeReferrals.length > 0 ? (
              activeReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} />
              ))
            ) : (
              <EmptyState type="active" />
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-2">
            {pastReferrals.length > 0 ? (
              pastReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} />
              ))
            ) : (
              <EmptyState type="past" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
