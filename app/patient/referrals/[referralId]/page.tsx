"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { usePatientProfile } from "@/hooks/use-patient-profile"
import { fetchWithAuth } from "@/utils/api-utils"
import { format, parseISO, isValid } from 'date-fns'
import { AlertCircle, ArrowLeft, Clock, CheckCircle2, XCircle, Ambulance, Calendar, FileText, MapPin, Phone } from "lucide-react"
import dynamic from 'next/dynamic'
import { Separator } from "@/components/ui/separator"
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from "@/components/ui/timeline"

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
    address?: string;
    phone?: string;
  };
  toHospital: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  referringDoctor: {
    id: string;
    name: string;
    specialty?: string;
  };
  receivingDoctor?: {
    id: string;
    name: string;
    specialty?: string;
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
    ambulanceId?: string;
    driverName?: string;
    driverPhone?: string;
    currentLocation?: string;
  } | null;
  statusHistory?: Array<{
    status: ReferralStatus;
    timestamp: string;
    notes?: string;
  }>;
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

// Format date helper
function formatDate(dateString: string | undefined | null) {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date';
  } catch (error) {
    return 'Invalid date';
  }
}

// Get status icon helper
function getStatusIcon(status: ReferralStatus) {
  switch (status) {
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

export default function ReferralDetailPage({ params }: { params: { referralId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { profile, isLoading: isProfileLoading } = usePatientProfile()
  const [referral, setReferral] = useState<Referral | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch referral details
  useEffect(() => {
    const fetchReferralDetails = async () => {
      if (!profile?.mrn || !params.referralId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch referral details using authenticated fetch utility
        const data = await fetchWithAuth<Referral>(`/api/patients/${profile.mrn}/referrals/${params.referralId}`)
        setReferral(data)
      } catch (err) {
        console.error('Error fetching referral details:', err)
        setError('Failed to load referral details. Please try again later.')
        toast({
          title: "Error",
          description: "Failed to load referral details. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (profile?.mrn && params.referralId) {
      fetchReferralDetails()
    }
  }, [profile, params.referralId, toast])
  
  // Render loading state
  if (isProfileLoading || isLoading) {
    return (
      <DashboardLayout 
        currentPage="referrals"
        breadcrumbs={[
          { label: "Referrals", href: "/patient/referrals" },
          { label: "Referral Details" }
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    )
  }
  
  // Render error state
  if (error) {
    return (
      <DashboardLayout 
        currentPage="referrals"
        breadcrumbs={[
          { label: "Referrals", href: "/patient/referrals" },
          { label: "Referral Details" }
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/patient/referrals')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Referrals
          </Button>
        </div>
      </DashboardLayout>
    )
  }
  
  // Render not found state
  if (!referral) {
    return (
      <DashboardLayout 
        currentPage="referrals"
        breadcrumbs={[
          { label: "Referrals", href: "/patient/referrals" },
          { label: "Referral Details" }
        ]}
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested referral could not be found.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/patient/referrals')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Referrals
          </Button>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout 
      currentPage="referrals"
      breadcrumbs={[
        { label: "Referrals", href: "/patient/referrals" },
        { label: "Referral Details" }
      ]}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Referral Details</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/patient/referrals')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Referrals
          </Button>
        </div>
        
        <Card className="mb-6 overflow-hidden border border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-medium flex items-center gap-2">
                  {getStatusIcon(referral.status)}
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
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Hospital */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">From Hospital</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-lg">{referral.fromHospital.name}</p>
                    </div>
                    {referral.fromHospital.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                        <p>{referral.fromHospital.address}</p>
                      </div>
                    )}
                    {referral.fromHospital.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p>{referral.fromHospital.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* To Hospital */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">To Hospital</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-lg">{referral.toHospital.name}</p>
                    </div>
                    {referral.toHospital.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                        <p>{referral.toHospital.address}</p>
                      </div>
                    )}
                    {referral.toHospital.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p>{referral.toHospital.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Referring Doctor */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Referring Doctor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{referral.referringDoctor.name}</p>
                  {referral.referringDoctor.specialty && (
                    <p className="text-gray-500">{referral.referringDoctor.specialty}</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Receiving Doctor */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Receiving Doctor</CardTitle>
                </CardHeader>
                <CardContent>
                  {referral.receivingDoctor ? (
                    <>
                      <p className="font-medium">{referral.receivingDoctor.name}</p>
                      {referral.receivingDoctor.specialty && (
                        <p className="text-gray-500">{referral.receivingDoctor.specialty}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">Not assigned yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Referral Information</h3>
              <Card className="border border-gray-200">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Reason for Referral</h4>
                      <p className="mt-1">{referral.reason}</p>
                    </div>
                    
                    {referral.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
                        <p className="mt-1">{referral.notes}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Created</h4>
                        <p className="mt-1">{formatDate(referral.createdAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                        <p className="mt-1">{formatDate(referral.updatedAt)}</p>
                      </div>
                      {referral.completedAt && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Completed</h4>
                          <p className="mt-1">{formatDate(referral.completedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Ambulance Information */}
            {referral.ambulanceDispatch && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Ambulance className="mr-2 h-5 w-5 text-blue-600" />
                  Ambulance Transport
                </h3>
                <Card className="border border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-blue-700">Status</h4>
                        <p className="mt-1 font-medium">{referral.ambulanceDispatch.status}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-700">Dispatch Time</h4>
                        <p className="mt-1">{formatDate(referral.ambulanceDispatch.dispatchTime)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-700">Estimated Arrival</h4>
                        <p className="mt-1">{formatDate(referral.ambulanceDispatch.estimatedArrival)}</p>
                      </div>
                      {referral.ambulanceDispatch.ambulanceId && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-700">Ambulance ID</h4>
                          <p className="mt-1">{referral.ambulanceDispatch.ambulanceId}</p>
                        </div>
                      )}
                      {referral.ambulanceDispatch.driverName && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-700">Driver</h4>
                          <p className="mt-1">{referral.ambulanceDispatch.driverName}</p>
                        </div>
                      )}
                      {referral.ambulanceDispatch.driverPhone && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-700">Driver Contact</h4>
                          <p className="mt-1">{referral.ambulanceDispatch.driverPhone}</p>
                        </div>
                      )}
                      {referral.ambulanceDispatch.currentLocation && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-700">Current Location</h4>
                          <p className="mt-1">{referral.ambulanceDispatch.currentLocation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Status Timeline */}
            {referral.statusHistory && referral.statusHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Status Timeline</h3>
                <Card className="border border-gray-200">
                  <CardContent className="pt-4">
                    <Timeline>
                      {referral.statusHistory.map((item, index) => (
                        <TimelineItem key={index}>
                          {index < referral.statusHistory!.length - 1 && <TimelineConnector />}
                          <TimelineHeader>
                            <TimelineIcon>
                              {getStatusIcon(item.status)}
                            </TimelineIcon>
                            <TimelineTitle className="flex items-center gap-2">
                              {item.status}
                              <span className="text-sm font-normal text-gray-500">
                                {formatDate(item.timestamp)}
                              </span>
                            </TimelineTitle>
                          </TimelineHeader>
                          {item.notes && (
                            <TimelineBody className="pl-10">
                              {item.notes}
                            </TimelineBody>
                          )}
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
