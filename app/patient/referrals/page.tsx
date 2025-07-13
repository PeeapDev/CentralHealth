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
import { getPatientReferrals, getPatientReferralStats, PatientReferral, ReferralPriority, ReferralStatus } from "@/utils/referral-utils"
import { format, parseISO, isValid } from 'date-fns'
import { AlertCircle, Ambulance, ArrowRight, CheckCircle2, Clock, FileCode2, UserCheck, XCircle } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamically import the dashboard layout with explicit named import
const DashboardLayout = dynamic(
  () => import('@/components/patients/dashboard/dashboard-layout').then(mod => ({ default: mod.DashboardLayout })),
  {
    loading: () => <div className="min-h-screen bg-slate-50 p-4">Loading...</div>,
    ssr: false,
  }
)

// Using types from referral-utils.ts

// Define API referral type (from backend API)
interface ApiReferral {
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

// Define unified referral type for UI display
interface Referral {
  id: string;
  referralCode: string;  // Added referral code field for verification
  patientId: string;
  fromHospital: string;
  toHospital: string;
  referringDoctor: string;
  receivingDoctor?: string;
  reason: string;
  notes?: string;
  priority: ReferralPriority;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  requiresAmbulance: boolean;
  ambulanceStatus?: string;
  ambulanceEta?: string;
}

// Helper function to convert PatientReferral to Referral format - handle all possible field formats
function convertPatientReferralToReferral(ref: PatientReferral): Referral {
  return {
    id: ref.id,
    referralCode: ref.referralCode || '',
    patientId: ref.patientId || ref.mrn || '', // Use mrn as patientId if available (standard medical ID)
    fromHospital: ref.referringHospitalName || `Hospital ${ref.referringHospitalId}`,
    toHospital: ref.receivingHospitalName || `Hospital ${ref.receivingHospitalId}`,
    referringDoctor: 'Unknown Doctor',
    receivingDoctor: undefined,
    reason: ref.reason || '',
    notes: ref.notes,
    priority: ref.priority || 'ROUTINE',
    status: ref.status || 'PENDING',
    createdAt: ref.createdAt || new Date().toISOString(),
    updatedAt: ref.updatedAt || new Date().toISOString(),
    completedAt: ref.completedAt || undefined,
    requiresAmbulance: !!ref.requiresAmbulance,
    ambulanceStatus: undefined,
    ambulanceEta: undefined
  }
}

// Status badge component
function StatusBadge({ status }: { status: ReferralStatus }) {
  const variants: Record<ReferralStatus, { variant: string, icon: React.ReactNode }> = {
    PENDING: { variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
    ACCEPTED: { variant: 'secondary', icon: <UserCheck className="h-3 w-3 mr-1" /> },
    COMPLETED: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    REJECTED: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    CANCELLED: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
  }

  const { variant, icon } = variants[status] || variants.PENDING

  return (
    <Badge variant={variant as any} className="flex items-center">
      {icon}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}

// Priority badge component
function PriorityBadge({ priority }: { priority: ReferralPriority }) {
  const variants: Record<ReferralPriority, string> = {
    ROUTINE: 'secondary',
    URGENT: 'warning',
    EMERGENCY: 'destructive'
  }

  return (
    <Badge variant={variants[priority] as any} className="ml-2">
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  )
}
// Referral card component
function ReferralCard({ referral }: { referral: Referral }) {
  const router = useRouter()

  // Format dates in a user-friendly way
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, 'PPP') : 'Invalid date'
    } catch (e) {
      return 'Invalid date'
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {referral.fromHospital} → {referral.toHospital}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <CardDescription>
                {formatDate(referral.createdAt)}
              </CardDescription>
              {referral.referralCode && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                  <FileCode2 className="h-3 w-3 mr-1" />
                  {referral.referralCode}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <StatusBadge status={referral.status} />
            <PriorityBadge priority={referral.priority} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Reason</p>
            <p className="text-sm text-gray-500">{referral.reason}</p>
          </div>
          {referral.notes && (
            <div>
              <p className="text-sm font-medium">Additional Notes</p>
              <p className="text-sm text-gray-500">{referral.notes}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Referring Doctor</p>
              <p className="text-sm text-gray-500">{referral.referringDoctor}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Receiving Doctor</p>
              <p className="text-sm text-gray-500">{referral.receivingDoctor || 'Not assigned yet'}</p>
            </div>
          </div>
          {referral.requiresAmbulance && (
            <div className="mt-2">
              <Badge variant="outline" className="bg-amber-50">Ambulance Required</Badge>
              {referral.ambulanceStatus && (
                <p className="text-xs text-amber-600 mt-1">
                  Status: {referral.ambulanceStatus}
                  {referral.ambulanceEta && ` • ETA: ${referral.ambulanceEta}`}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Empty state component
function EmptyState({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <Clock className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium mb-1">No {type} referrals</h3>
      <p className="text-sm text-gray-500 max-w-md">
        {type === 'active' ? 
          "You don't have any active referrals at the moment." :
          type === 'past' ?
          "You don't have any past referrals." :
          "No referral information is available."}
      </p>
    </div>
  )
}

// Cache keys for persistent storage
const PATIENT_REFERRALS_CACHE_KEY = 'centralhealth_patient_referrals_cache';
const PATIENT_REFERRALS_TIMESTAMP_KEY = 'centralhealth_patient_referrals_timestamp';
// Cache expiration time (30 minutes)
const CACHE_EXPIRATION_MS = 30 * 60 * 1000;

export default function PatientReferralsPage() {
  const { toast } = useToast()
  const { profile, isLoading: isProfileLoading } = usePatientProfile()
  const [activeReferrals, setActiveReferrals] = useState<Referral[]>([])
  const [pastReferrals, setPastReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats based on current referrals
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0,
    successRate: 0
  })

  // Function to check if cache is valid
  const isCacheValid = () => {
    if (typeof window === 'undefined') return false;
    
    const timestamp = sessionStorage.getItem(PATIENT_REFERRALS_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cachedTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    return !isNaN(cachedTime) && (now - cachedTime) < CACHE_EXPIRATION_MS;
  }

  // Function to save referrals to cache
  const saveToCache = (referrals: Referral[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Save the combined referral list and timestamp
      sessionStorage.setItem(PATIENT_REFERRALS_CACHE_KEY, JSON.stringify(referrals));
      sessionStorage.setItem(PATIENT_REFERRALS_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      console.warn('Failed to cache referrals:', err);
    }
  };

  // Function to get referrals from cache
  const getFromCache = (): Referral[] | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = sessionStorage.getItem(PATIENT_REFERRALS_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn('Failed to retrieve cached referrals:', err);
      return null;
    }
  };

  // Optimized helper function to process referrals - single pass through the data
  const processReferrals = (allReferrals: Referral[]) => {
    // Process everything in a single pass for better performance
    let pending = 0, accepted = 0, completed = 0, rejected = 0, cancelled = 0;
    const active: Referral[] = [];
    const past: Referral[] = [];
    
    // Single loop through all referrals
    for (const ref of allReferrals) {
      // Count by status
      switch (ref.status) {
        case 'PENDING':
          pending++;
          active.push(ref);
          break;
        case 'ACCEPTED':
          accepted++;
          active.push(ref);
          break;
        case 'COMPLETED':
          completed++;
          past.push(ref);
          break;
        case 'REJECTED':
          rejected++;
          past.push(ref);
          break;
        case 'CANCELLED':
          cancelled++;
          past.push(ref);
          break;
      }
    }
    
    // Calculate success rate (completed / (completed + rejected))
    const processedReferrals = completed + rejected;
    const successRate = processedReferrals > 0
      ? Math.round((completed / processedReferrals) * 100)
      : 0;
    
    setActiveReferrals(active);
    setPastReferrals(past);
    setStats({
      total: allReferrals.length,
      pending,
      accepted,
      completed,
      rejected,
      successRate
    });
  };
  
  // Optimized function to fetch and process referrals
  const fetchReferrals = async () => {
    if (!profile?.mrn) return;
    
    try {
      // Set a shorter loading timeout - improves perceived performance
      const loadingTimeout = setTimeout(() => setIsLoading(true), 150);
      setError(null);
      
      // Check for valid cache first - fast path
      if (isCacheValid()) {
        const cachedReferrals = getFromCache();
        if (cachedReferrals && cachedReferrals.length > 0) {
          // Clear loading timeout if we loaded from cache fast enough
          clearTimeout(loadingTimeout);
          processReferrals(cachedReferrals);
          setIsLoading(false);
          return;
        }
      }
      
      // Parallel data fetching - fetch from localStorage and API simultaneously
      const [localReferrals] = await Promise.all([
        // Immediately get local referrals (synchronous operation wrapped in Promise)
        Promise.resolve(getPatientReferrals(profile.mrn)),
        
        // Delay showing loading state by 50ms to avoid flash for fast loads
        new Promise(resolve => setTimeout(resolve, 50))
      ]);
      
      // Convert local referrals to match Referral interface
      const referralMap = new Map<string, Referral>();
      
      // Process local storage referrals first (fast path)
      const convertedLocalReferrals: Referral[] = localReferrals.map(ref => convertPatientReferralToReferral(ref));
      convertedLocalReferrals.forEach(ref => referralMap.set(ref.id, ref));
      
      // If we have local data, we can show it immediately while API loads
      if (referralMap.size > 0) {
        const initialReferrals = Array.from(referralMap.values()).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Process immediately available referrals
        processReferrals(initialReferrals);
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        
        // Cache this initial data
        saveToCache(initialReferrals);
      }
      
      // Attempt to fetch from API in background
      try {
        const apiReferrals = await fetchWithAuth<Referral[]>(`/api/patients/${profile.mrn}/referrals`, {
          silent: true,
          suppressAuthErrors: true
        });
        
        // Add API referrals to our map
        let hasNewData = false;
        apiReferrals.forEach(ref => {
          // Check if this is new or updated data
          const existing = referralMap.get(ref.id);
          if (!existing || new Date(ref.updatedAt) > new Date(existing.updatedAt)) {
            referralMap.set(ref.id, ref);
            hasNewData = true;
          }
        });
        
        // Only update UI if we got new data from the API
        if (hasNewData) {
          const updatedReferrals = Array.from(referralMap.values()).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Update cache with combined data
          saveToCache(updatedReferrals);
          
          // Update UI with combined data
          processReferrals(updatedReferrals);
        }
      } catch (apiErr) {
        // API fetch failed, but we already showed local data, so just log silently
        // No need to show error to user if we have local data
      }
      
      // Always clear loading and ensure it's set to false
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals. Please try again later.');
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Could not load your referrals. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Listen for storage events to update referrals when changed in another tab
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('referral')) {
        fetchReferrals();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Listen for custom event when referrals are updated in the same tab
  useEffect(() => {
    const handleReferralUpdate = (event: Event) => {
      console.log('Referral update event received:', event);
      // Force clear cache to ensure we get fresh data
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(PATIENT_REFERRALS_CACHE_KEY);
        sessionStorage.removeItem(PATIENT_REFERRALS_TIMESTAMP_KEY);
      }
      // Immediately fetch referrals to get the latest data
      fetchReferrals();
    };
    
    // Use the correct event listener with CustomEvent typing
    window.addEventListener('referralUpdated', handleReferralUpdate as EventListener);
    return () => {
      window.removeEventListener('referralUpdated', handleReferralUpdate as EventListener);
    };
  }, []);
  
  // Initial load of referrals - optimized to start loading earlier
  useEffect(() => {
    let mounted = true;
    
    // Start loading immediately if we have the profile
    if (profile?.mrn && !isProfileLoading) {
      // Use microtask to not block the main rendering thread
      queueMicrotask(() => {
        if (mounted) fetchReferrals();
      });
    }
    
    return () => { mounted = false; };
  }, [profile?.mrn, isProfileLoading]);
  
  // Show loading state if profile is still loading or referrals are loading
  if (isProfileLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
          <span className="ml-2 text-gray-600">Loading your referrals...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  // Show error state if there was an error
  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }
  
  // Show no referrals state if profile is loaded but no MRN is available
  if (!profile?.mrn) {
    return (
      <DashboardLayout>
        <EmptyState type="profile" />
      </DashboardLayout>
    );
  }

  // Show the referrals UI
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Referrals</h1>
          <p className="text-muted-foreground">
            View and manage your hospital referrals
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Referrals</TabsTrigger>
            <TabsTrigger value="past">Past Referrals</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-4">
            {activeReferrals.length === 0 ? (
              <EmptyState type="active" />
            ) : (
              activeReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} />
              ))
            )}
          </TabsContent>
          <TabsContent value="past" className="space-y-4">
            {pastReferrals.length === 0 ? (
              <EmptyState type="past" />
            ) : (
              pastReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}