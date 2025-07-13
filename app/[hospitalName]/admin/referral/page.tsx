"use client"

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-async-client-component */

import { useState, useEffect } from "react"
// import { use } from "react" - not needed yet
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, UserCheck, Ambulance } from "lucide-react"
import { NewReferralDialog } from "./new-referral-dialog"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateReferralStatus, PatientReferral, ReferralStatus, getAllReferrals } from "@/utils/referral-utils"

// Types for page props
interface ReferralPageProps {
  params: {
    hospitalName: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Define the types with proper relations
type Patient = {
  id: string;
  name: any; // JSON structure
  mrn: string; // Medical ID following NHS-style 5-character alphanumeric format
};

type Hospital = {
  id: string;
  name: string;
};

// Define the admin dashboard referral type that extends PatientReferral
type ReferralWithRelations = {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt?: string | Date | null;
  referralCode: string;
  status: string;
  priority: string;
  notes?: string | null;
  requiresAmbulance: boolean; // Using consistent naming
  patientId: string;
  patientName?: string; // Added patientName field
  referringHospitalId: string;
  receivingHospitalId: string;
  referringHospitalName?: string; // Added hospital name fields to match PatientReferral
  receivingHospitalName?: string;
  patient?: Patient;
  referringHospital?: Hospital;
  receivingHospital?: Hospital;
  mrn?: string; // Medical ID following NHS standard // Using standardized medical ID field
};

// Cache keys for session storage
const REFERRALS_CACHE_KEY = 'centralhealth_referrals_cache';
const REFERRAL_FILTER_KEY = 'centralhealth_referrals_show_all';

// Client-side function to get referrals from localStorage with persistence and caching
function useReferrals(hospitalName: string) {
  const [referrals, setReferrals] = useState<ReferralWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  // Get initial filter preference from sessionStorage or default to true
  const [showAllReferrals, setShowAllReferrals] = useState<boolean>(() => {
    // Only run in client side
    if (typeof window !== 'undefined') {
      const savedPreference = sessionStorage.getItem(REFERRAL_FILTER_KEY);
      return savedPreference !== null ? savedPreference === 'true' : true;
    }
    return true; // Default to showing all for debugging
  });
  
  // Save filter preference to session storage for persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(REFERRAL_FILTER_KEY, String(showAllReferrals));
    }
  }, [showAllReferrals]);
  
  // Function to clear referrals cache when new data comes in
  const clearReferralsCache = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(REFERRALS_CACHE_KEY);
    }
  };
  
  // Load referrals from localStorage with caching
  const loadReferrals = () => {
    setLoading(true);
    
    try {
      // First check if we have cached referrals
      const cachedData = sessionStorage.getItem(REFERRALS_CACHE_KEY);
      let allReferrals = [];
      
      if (cachedData) {
        console.log("Using cached referrals data");
        allReferrals = JSON.parse(cachedData);
      } else {
        console.log("Loading referrals from localStorage");
        allReferrals = getAllReferrals();
        // Cache the results for better performance
        sessionStorage.setItem(REFERRALS_CACHE_KEY, JSON.stringify(allReferrals));
      }
      
      console.log(`Processing ${allReferrals.length} referrals`);
      
      // Transform raw referrals to ReferralWithRelations format
      const transformedReferrals: ReferralWithRelations[] = allReferrals.map((ref: PatientReferral) => {
        // Create consistent structure and ensure mrn field is used
        return {
          ...ref,
          mrn: ref.mrn || ref.patientId, // Ensure mrn field is populated
          patientName: ref.patientName || 'Patient', // Explicitly set patientName
          patient: {
            id: ref.patientId,
            name: { text: ref.patientName || 'Patient' }, // Set name.text format
            mrn: ref.mrn || ref.patientId
          },
          referringHospital: {
            id: ref.referringHospitalId,
            name: ref.referringHospitalName || "Unknown Hospital"
          },
          receivingHospital: {
            id: ref.receivingHospitalId,
            name: ref.receivingHospitalName || "Unknown Hospital"
          }
        };
      });
      
      let filteredReferrals = transformedReferrals;
      
      if (!showAllReferrals && hospitalName) {
        // More lenient hospital name matching (normalized, partial)
        const normalizeHospitalName = (name?: string) => {
          return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        };
        
        const normalizedHospitalName = normalizeHospitalName(hospitalName);
        console.log(`Filtering referrals for hospital: ${hospitalName} (normalized: ${normalizedHospitalName})`);
        
        filteredReferrals = transformedReferrals.filter(ref => {
          const normalizedRefHospital = normalizeHospitalName(ref.referringHospital?.name);
          const normalizedRecHospital = normalizeHospitalName(ref.receivingHospital?.name);
          
          // Check if hospital name is included in either referring or receiving hospital
          const isMatch = normalizedRefHospital.includes(normalizedHospitalName) || 
                          normalizedRecHospital.includes(normalizedHospitalName);
          
          if (!isMatch) {
            console.log(`Referral ${ref.referralCode} excluded - hospitals: ${ref.referringHospital?.name}, ${ref.receivingHospital?.name}`);
          }
          
          return isMatch;
        });
      }
      
      console.log(`Displaying ${filteredReferrals.length} referrals${showAllReferrals ? ' (showing all)' : ''}`);
      setReferrals(filteredReferrals);
    } catch (error) {
      console.error("Error loading referrals:", error);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Set up event listeners and initial load
  useEffect(() => {
    loadReferrals();
    
    // Listen for storage events (when localStorage changes in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('referral')) {
        loadReferrals();
      }
    };
    
    // Custom event for when a referral is created or updated
    const handleReferralUpdate = () => {
      console.log("Referral updated event received");
      clearReferralsCache(); // Clear the cache when referrals are updated
      loadReferrals();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('referralUpdated', handleReferralUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('referralUpdated', handleReferralUpdate);
    };
  }, [showAllReferrals]); // Re-run when filter toggle changes
  
  return {
    referrals,
    loading,
    loadReferrals,
    showAllReferrals,
    setShowAllReferrals
  };
}

// Client-side function to calculate referral stats from referrals list
function useReferralStats(referrals: ReferralWithRelations[]) {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    successRate: 0
  });
  
  useEffect(() => {
    const total = referrals.length;
    const pending = referrals.filter(r => r.status === "PENDING").length;
    const completed = referrals.filter(r => r.status === "COMPLETED").length;
    const rejected = referrals.filter(r => r.status === "REJECTED").length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    setStats({
      total,
      pending,
      completed,
      rejected,
      successRate
    });
  }, [referrals]);
  
  return stats;
}

export default function ReferralPage({ params }: ReferralPageProps) {
  // State to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);
  
  // Extract hospital name from URL path to avoid Next.js params warning
  const [hospitalName, setHospitalName] = useState('');
  
  // Initialize hospital name from pathname on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Extract hospital name from URL path: /hospitalName/admin/referral
      const pathParts = window.location.pathname.split('/');
      if (pathParts.length > 1 && pathParts[1]) {
        setHospitalName(pathParts[1]);
      }
    }
  }, []);
  
  // Use our custom hooks
  const { 
    referrals, 
    loading, 
    loadReferrals, 
    showAllReferrals, 
    setShowAllReferrals 
  } = useReferrals(hospitalName);
  const stats = useReferralStats(referrals);
  
  // Format hospital name for display (convert slug to title case)
  const displayHospitalName = hospitalName
    ? hospitalName.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';
  
  // Function to load all referrals
  const loadAllReferrals = () => {
    console.log("Loading all referrals");
    setIsMounted(true);
    loadReferrals();
  };
  
  // Set up event listeners and initial load
  useEffect(() => {
    loadAllReferrals();
    
    // Listen for storage events (when localStorage changes in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('referral')) {
        loadReferrals();
      }
    };
    
    // Custom event for when a referral is created or updated
    const handleReferralUpdate = () => {
      console.log("Referral updated event received");
      loadReferrals();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('referralUpdated', handleReferralUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('referralUpdated', handleReferralUpdate);
    };
  }, [showAllReferrals]); // Re-run when filter toggle changes
  
  // Helper function to format date
  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <UserCheck className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };
  
  // Helper function to get priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityColor = priority?.toUpperCase() === 'HIGH' 
      ? 'bg-red-500 hover:bg-red-600' 
      : priority?.toUpperCase() === 'MEDIUM' 
        ? 'bg-yellow-500 hover:bg-yellow-600' 
        : 'bg-blue-500 hover:bg-blue-600';
    
    return <Badge className={priorityColor}>{priority || 'Normal'}</Badge>;
  };
  
  // Function to update referral status using the standardized utility
  const updateStatus = async (referralId: string, newStatus: ReferralStatus) => {
    try {
      const updatedReferral = updateReferralStatus(referralId, newStatus);
      console.log(`Updated referral ${referralId} status to ${newStatus}`);
      loadReferrals();
      return updatedReferral;
    } catch (error) {
      console.error(`Failed to update referral ${referralId} status:`, error);
      return null;
    }
  };
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {isMounted ? `Welcome to ${displayHospitalName} Referral Management` : 'Welcome to Referral Management'}
        </h1>
        <p className="text-muted-foreground">Manage patient referrals between hospitals and departments</p>
      </div>
      
      {/* Debug Controls */}
      <div className="flex items-center space-x-2">
        <Switch
          id="show-all-referrals"
          checked={showAllReferrals}
          onCheckedChange={setShowAllReferrals}
        />
        <Label htmlFor="show-all-referrals">Debug Mode: Show All Referrals</Label>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All-time referrals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              <div className="text-2xl font-bold">{stats.pending}</div>
            </div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.completed}</div>
            </div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Referral Management Section */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Referral Management</h2>
          <NewReferralDialog hospitalName={hospitalName} />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Ambulance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No referrals found.
                      {!showAllReferrals && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowAllReferrals(true)}
                            size="sm"
                          >
                            Show All Referrals
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{referral.referralCode}</TableCell>
                      <TableCell>{referral.patientName || referral.patient?.name?.text || referral.mrn || 'Unknown Patient'}</TableCell>
                      <TableCell>{referral.referringHospital?.name || 'Unknown'}</TableCell>
                      <TableCell>{referral.receivingHospital?.name || 'Unknown'}</TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>{getPriorityBadge(referral.priority)}</TableCell>
                      <TableCell>
                        {referral.requiresAmbulance ? (
                          <Badge className="bg-blue-500">
                            <Ambulance className="h-3 w-3 mr-1" />
                            Required
                          </Badge>
                        ) : 'No'}
                      </TableCell>
                      <TableCell>{formatDate(referral.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {/* Hospital comparison is done using multiple possible fields */}
                          
                          {/* Show Accept/Reject buttons for PENDING referrals where we're the RECEIVING hospital */}
                          {referral.status === 'PENDING' && (
                            // This is a receiving hospital if ANY of these are true
                            referral.receivingHospitalId === hospitalName || 
                            referral.receivingHospital?.name === hospitalName ||
                            referral.receivingHospitalName === hospitalName ||
                            // Also check if we're explicitly NOT the referring hospital
                            (referral.referringHospitalId !== hospitalName && 
                             (!referral.referringHospital || referral.referringHospital.name !== hospitalName) &&
                             (!referral.referringHospitalName || referral.referringHospitalName !== hospitalName))
                          ) && (
                            <>
                              <Button
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 text-green-700 hover:bg-green-100"
                                onClick={() => updateStatus(referral.id, 'ACCEPTED')}
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => updateStatus(referral.id, 'REJECTED')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {/* Show Complete button only for accepted referrals where this hospital is the receiving hospital */}
                          {referral.status === 'ACCEPTED' && (
                            // This is a receiving hospital if ANY of these are true
                            referral.receivingHospitalId === hospitalName || 
                            referral.receivingHospital?.name === hospitalName ||
                            referral.receivingHospitalName === hospitalName ||
                            // Also check if we're explicitly NOT the referring hospital
                            (referral.referringHospitalId !== hospitalName && 
                             (!referral.referringHospital || referral.referringHospital.name !== hospitalName) &&
                             (!referral.referringHospitalName || referral.referringHospitalName !== hospitalName))
                          ) && (
                            <Button
                              variant="outline" 
                              size="sm"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              onClick={() => updateStatus(referral.id, 'COMPLETED')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          
                          {/* For referring hospitals, show status indicator only */}
                          {(
                            referral.referringHospitalId === hospitalName || 
                            referral.referringHospital?.name === hospitalName ||
                            referral.referringHospitalName === hospitalName
                          ) && !(
                            referral.receivingHospitalId === hospitalName || 
                            referral.receivingHospital?.name === hospitalName ||
                            referral.receivingHospitalName === hospitalName
                          ) && (
                            <span className="text-sm text-gray-500">
                              {referral.status === 'PENDING' ? 'Awaiting receiving hospital' : 
                               referral.status === 'ACCEPTED' ? 'Accepted by receiving hospital' :
                               referral.status === 'COMPLETED' ? 'Treatment completed' :
                               referral.status === 'REJECTED' ? 'Rejected by receiving hospital' : 
                               'Status: ' + referral.status}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}