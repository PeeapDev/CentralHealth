"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { RefreshCw, Download, Plus, Search, MoreHorizontal, FileText, Trash, UserPlus, Users, UserRound, MapPin } from "lucide-react"
import { Pie, Doughnut } from "react-chartjs-2"
import { Chart, ArcElement, Tooltip, Legend } from "chart.js"

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend)

// Helper function to get initials from name
function getInitialsFromFhirName(nameObj: any): string {
  try {
    if (!nameObj) return "?";
    
    // Handle plain text names
    if (typeof nameObj === 'string') {
      // Check if it looks like a plain name rather than JSON
      if (!/^\s*[{\[]/.test(nameObj)) {
        // Simple name string - extract initials from first and last words
        const parts = nameObj.trim().split(/\s+/);
        let initials = '';
        
        // Get first letter of first word (first name)
        if (parts.length > 0) {
          initials += parts[0][0] || '';
        }
        
        // Get first letter of last word (last name)
        if (parts.length > 1) {
          initials += parts[parts.length - 1][0] || '';
        }
        
        return initials.toUpperCase();
      }
      
      // If it looks like JSON, try to parse it
      try {
        nameObj = JSON.parse(nameObj);
      } catch (parseError) {
        // If parsing fails, treat as plain text
        const parts = nameObj.trim().split(/\s+/);
        return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
      }
    }
    
    // Handle FHIR structured name object
    let initials = '';
    
    if (nameObj.given && nameObj.given.length > 0) {
      initials += nameObj.given[0][0];
    }
    
    if (nameObj.family) {
      initials += nameObj.family[0];
    }
    
    return initials.toUpperCase();
  } catch (e) {
    console.error("Error parsing name:", e);
    // Fallback - extract initials directly from nameObj if it's a string
    if (typeof nameObj === 'string') {
      const parts = nameObj.trim().split(/\s+/);
      return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
    }
    return "?";
  }
}

// Helper function to format name from FHIR structure
function formatFhirName(nameObj: any): string {
  try {
    if (!nameObj) return "Unknown";
    
    // If user has a fullName or User.name property, prioritize those
    if (nameObj.fullName && typeof nameObj.fullName === 'string') {
      return nameObj.fullName.trim();
    }
    
    if (nameObj.User && nameObj.User.name) {
      return nameObj.User.name.trim();
    }
    
    // If it's already a plain string and doesn't look like JSON, return it directly
    if (typeof nameObj === 'string') {
      // Check if it looks like a plain name rather than JSON
      if (!/^\s*[{\[]/.test(nameObj)) {
        return nameObj.trim() || "Unknown";
      }
      
      // If it looks like JSON, try to parse it
      try {
        nameObj = JSON.parse(nameObj);
      } catch (parseError) {
        // If parsing fails, return the original string
        return nameObj.trim() || "Unknown";
      }
    }
    
    // Use the text representation if available
    if (nameObj.text) return nameObj.text;
    
    // Otherwise construct from parts
    let name = '';
    
    // Add prefix if available (Dr., Mr., etc.)
    if (nameObj.prefix && nameObj.prefix.length > 0) {
      name += nameObj.prefix[0] + ' ';
    }
    
    // Add given names (first name, middle name, etc.)
    if (nameObj.given && nameObj.given.length > 0) {
      name += nameObj.given.join(' ') + ' ';
    }
    
    // Add family name (last name)
    if (nameObj.family) {
      name += nameObj.family;
    }
    
    return name.trim() || "Unknown";
  } catch (e) {
    console.error("Error formatting name:", e);
    // Fallback for errors - if nameObj is a string, return it directly
    if (typeof nameObj === 'string') {
      return nameObj.trim() || "Unknown";
    }
    return "Unknown";
  }
}

// Helper function to get age from birthDate with improved handling for various formats
function calculateAge(birthDateStr: string): number {
  try {
    // Use a fixed current date for consistent age calculation
    const today = new Date('2025-06-21T13:37:04Z');
    
    // Handle year-only format (common in some FHIR implementations)
    if (/^\d{4}$/.test(birthDateStr.trim())) {
      const birthYear = parseInt(birthDateStr.trim(), 10);
      return today.getFullYear() - birthYear;
    }
    
    // Handle standard date formats
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
      // If invalid date, return default age
      return 24;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    // If any parsing error occurs, return a default age
    return 24;
  }
}

// Interface for FHIR Patient
interface FHIRPatient {
  id: string;
  medicalNumber: string;
  mrn?: string;
  active: boolean;
  name: any;
  gender: string;
  birthDate: string;
  telecom?: any;
  address?: any;
  email?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export default function PatientManagementPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<FHIRPatient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredPatients, setFilteredPatients] = useState<FHIRPatient[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all-patients");
  const [statusMessage, setStatusMessage] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10); // Show fewer patients per page for better performance
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Fetch patients data with pagination
  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        
        // Add pagination, limit parameters, and cache-busting to ensure we get the latest data
        const response = await fetch(`/api/patients?page=${currentPage}&limit=${itemsPerPage}&noCache=true`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for a message from the API
        if (data.message) {
          // Store any user-friendly message from the API
          setStatusMessage(data.message);
        } else {
          setStatusMessage('');
        }
        
        // If we have patients data, set it, otherwise use an empty array
        if (data && Array.isArray(data.patients)) {
          setPatients(data.patients);
          setTotalPatients(data.totalCount || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          setPatients([]);
          setTotalPatients(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        setPatients([]);
        setStatusMessage("Failed to load patient data. Please try again.");
        toast.error("Failed to load patient data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchPatients();
  }, [currentPage, itemsPerPage]); // Fetch when page or items per page changes
  
  // Function to refresh data with pagination
  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Reset to first page when refreshing
      setCurrentPage(1);
      
      // Fetch fresh data with pagination
      const response = await fetch(`/api/patients?page=1&limit=${itemsPerPage}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          // Add a dynamic parameter to bypass cache
          'X-Timestamp': Date.now().toString()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.patients)) {
        setPatients(data.patients);
        setTotalPatients(data.totalCount || 0);
        toast.success("Patient data refreshed successfully");
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh patient data");
      // Keep existing data in case of error
    } finally {
      setLoading(false);
    }
  };
  
  // Filter patients when search term or patients change
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!searchTerm) {
        setFilteredPatients(patients);
        return;
      }
      
      const filtered = patients.filter((patient) => {
        const searchTermLower = searchTerm.toLowerCase();
        
        // First check if the name is a string directly
        let patientName = "";
        if (typeof patient.name === 'string') {
          patientName = patient.name.toLowerCase();
        } else {
          patientName = formatFhirName(patient.name).toLowerCase();
        }
        
        const medicalId = (patient.medicalNumber || patient.mrn || '').toLowerCase();
        const patientEmail = (patient.email || '').toLowerCase();
        
        return patientName.includes(searchTermLower) || 
              medicalId.includes(searchTermLower) ||
              patientEmail.includes(searchTermLower);
      });
      
      setFilteredPatients(filtered);
      // Reset to first page when search term changes
      setCurrentPage(1);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(handler);
  }, [searchTerm, patients]);
  
  // Current page slice of data for pagination
  const currentPatients = useMemo(() => {
    // Check if we're searching (client-side filtering) or using the API pagination
    if (searchTerm) {
      // Client-side pagination for filtered results
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      return filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
    } else {
      // For non-filtered data, we're using the API pagination
      return patients;
    }
  }, [filteredPatients, patients, currentPage, itemsPerPage, searchTerm]);
  
  // Calculate patient statistics
  const patientStats = useMemo(() => {
    // Count total patients
    const total = patients.length;
    
    // Count by gender
    const maleCount = patients.filter(p => p.gender?.toLowerCase() === 'male').length;
    const femaleCount = patients.filter(p => p.gender?.toLowerCase() === 'female').length;
    const otherGenderCount = total - maleCount - femaleCount;
    
    // Count by status
    const activeCount = patients.filter(p => p.active).length;
    const inactiveCount = total - activeCount;
    
    // Count by region (extracted from address if available)
    const regionCounts: Record<string, number> = {};
    
    patients.forEach(patient => {
      try {
        if (patient.address) {
          const addressData = typeof patient.address === 'string' ? JSON.parse(patient.address) : patient.address;
          let region = "Unknown";
          
          if (Array.isArray(addressData) && addressData.length > 0) {
            region = addressData[0].state || addressData[0].district || "Unknown";
          } else if (addressData.state || addressData.district) {
            region = addressData.state || addressData.district;
          }
          
          regionCounts[region] = (regionCounts[region] || 0) + 1;
        } else {
          regionCounts["Unknown"] = (regionCounts["Unknown"] || 0) + 1;
        }
      } catch (e) {
        regionCounts["Unknown"] = (regionCounts["Unknown"] || 0) + 1;
      }
    });
    
    // Sort regions by count (descending)
    const sortedRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Take top 8 regions for the chart
      .reduce((acc, [region, count]) => {
        acc[region] = count;
        return acc;
      }, {} as Record<string, number>);
    
    return {
      total,
      maleCount,
      femaleCount,
      otherGenderCount,
      activeCount,
      inactiveCount,
      regionCounts: sortedRegions
    };
  }, [patients]);
  
  // Prepare chart data for regions
  const regionChartData = useMemo(() => {
    const labels = Object.keys(patientStats.regionCounts);
    const data = Object.values(patientStats.regionCounts);
    
    // Generate random but consistent colors
    const colors = labels.map((_, i) => {
      const hue = (i * 137.5) % 360; // Golden angle approximation for good distribution
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('60%', '50%')),
          borderWidth: 1,
        },
      ],
    };
  }, [patientStats.regionCounts]);
  
  // Prepare chart data for gender distribution
  const genderChartData = useMemo(() => {
    return {
      labels: ['Male', 'Female', 'Other/Unspecified'],
      datasets: [
        {
          data: [patientStats.maleCount, patientStats.femaleCount, patientStats.otherGenderCount],
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
          borderColor: ['#36A2EB', '#FF6384', '#FFCE56'],
          borderWidth: 1,
        },
      ],
    };
  }, [patientStats]);
  
  // Export patients data to CSV
  const exportPatientsCSV = () => {
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Headers
      const headers = [
        "Medical Number",
        "Name",
        "Gender",
        "Birth Date",
        "Email",
        "Status",
        "Created At",
        "Updated At"
      ];
      
      csvContent += headers.join(",") + "\n";
      
      // Data rows
      filteredPatients.forEach(patient => {
        const name = formatFhirName(patient.name);
        const birthDate = patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : "";
        const createdAt = new Date(patient.createdAt).toISOString().split('T')[0];
        const updatedAt = new Date(patient.updatedAt).toISOString().split('T')[0];
        
        const row = [
          patient.medicalNumber,
          `"${name.replace(/"/g, '""')}"`, // Escape quotes in CSV
          patient.gender || "",
          birthDate,
          patient.email || "",
          patient.active ? "Active" : "Inactive",
          createdAt,
          updatedAt
        ];
        
        csvContent += row.join(",") + "\n";
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      toast.success("Patient data exported to CSV");
    } catch (error) {
      console.error("Error exporting patients:", error);
      toast.error("Failed to export patients data");
    }
  };
  
  return (
    <div className="container py-6">
      <PageHeader
        title="National Patient Registry"
        description="Centralized patient management system with FHIR standards"
      />
      
      {/* Patient Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{patientStats.total}</CardTitle>
            <CardDescription>Total Patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {patientStats.activeCount} active / {patientStats.inactiveCount} inactive
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {patientStats.maleCount} / {patientStats.femaleCount}
            </CardTitle>
            <CardDescription>Male / Female Patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[80px] flex justify-center">
              <Doughnut 
                data={genderChartData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {Object.keys(patientStats.regionCounts).length}
            </CardTitle>
            <CardDescription>Regions Represented</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Top region: {Object.entries(patientStats.regionCounts)[0]?.[0] || "Unknown"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions and Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex-1 w-full md:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, medical number, or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportPatientsCSV} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" asChild>
            <a href="/register">
              <UserPlus className="h-4 w-4 mr-2" />
              Patient Registration Portal
            </a>
          </Button>
        </div>
      </div>
      
      {/* Tabs for different views */}
      <Tabs defaultValue="patients-table" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="patients-table">FHIR Patient Records</TabsTrigger>
          <TabsTrigger value="region-chart">Regional Distribution</TabsTrigger>
        </TabsList>
        
        {/* Patients Table Tab */}
        <TabsContent value="patients-table">
          <Card>
            <CardHeader>
              <CardTitle>FHIR Patient Directory</CardTitle>
              <CardDescription>
                All registered patients in the national healthcare system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : statusMessage ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{statusMessage}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">Patient records will appear here once they have been registered in the system.</p>
                  <Button onClick={() => router.push('/register')} size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register New Patient
                  </Button>
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medical #</TableHead>
                        <TableHead>Email/Phone</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead aria-label="Actions"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Apply pagination to filtered patients */}
                      {currentPatients.map((patient) => {
                        // Prioritize different name sources in order of preference
                        const patientName = patient.fullName || patient.displayName || (patient.User?.name) || formatFhirName(patient.name);
                        const patientInitials = getInitialsFromFhirName(patient.name);
                        
                        // Get patient age with prioritized sources and fallbacks
                        let patientAge = '--';
                        if (patient.age !== undefined && patient.age !== null && patient.age !== 'Unknown') {
                          // First priority: Use age from API if it exists
                          patientAge = typeof patient.age === 'number' ? patient.age.toString() : patient.age;
                        } else if (patient.birthDate || patient.dob) {
                          // Second priority: Calculate from birthDate
                          const birthDateStr = patient.birthDate || patient.dob;
                          patientAge = calculateAge(birthDateStr).toString();
                        } else if (patient.displayAge) {
                          // Third priority: Use displayAge field if available
                          patientAge = patient.displayAge;
                        } else {
                          // Keep as unknown
                          patientAge = '--';
                        }
                        
                        // Extract phone number from telecom
                        let phoneNumber = '';
                        try {
                          if (patient.telecom) {
                            // Parse telecom if it's a string
                            const telecomData = typeof patient.telecom === 'string'
                              ? JSON.parse(patient.telecom)
                              : patient.telecom;
                              
                            if (Array.isArray(telecomData)) {
                              const phoneEntry = telecomData.find(entry => entry.system === 'phone');
                              if (phoneEntry) {
                                phoneNumber = phoneEntry.value;
                              }
                            }
                          }
                        } catch (e) {
                          console.error('Error parsing telecom:', e);
                        }
                        
                        // Get registration date
                        const registrationDate = patient.createdAt 
                          ? new Date(patient.createdAt).toLocaleDateString() 
                          : 'Unknown';
                          
                        return (
                          <TableRow key={patient.id}>
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 ring-2 ring-blue-50 border border-slate-200">
                                  <AvatarImage 
                                    src={patient.avatarUrl || 
                                         patient.profilePicture?.imageUrl || 
                                         patient.User?.photo || 
                                         `/api/patients/${patient.id}/photo` || 
                                         ''} 
                                    alt={patient.fullName || patient.displayName || formatFhirName(patient.name)}
                                    onError={(e) => {
                                      // Hide the broken image icon
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }} 
                                  />
                                  <AvatarFallback className="bg-blue-600 text-white">
                                    {(() => {
                                      // Get patient initials from name
                                      const name = patient.fullName || patient.displayName || formatFhirName(patient.name);
                                      if (!name || name === "Unknown") {
                                        return patient.medicalNumber?.substring(0, 2).toUpperCase() || patient.medicalId?.substring(0, 2).toUpperCase() || "P";
                                      }
                                      // Extract initials from full name
                                      const nameParts = name.split(' ');
                                      if (nameParts.length >= 2) {
                                        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
                                      }
                                      // If only one name, use first two letters
                                      return name.substring(0, 2).toUpperCase();
                                    })()} 
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold">{patient.fullName || patient.displayName || (patient.User?.name) || formatFhirName(patient.name)}</div>
                                  <div className="text-xs text-gray-500">Registered: {registrationDate}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {/* Priorities: 
                                    1. displayMedicalNumber (from API with P prefix removed) 
                                    2. Individual consistent medical ID from registration
                                    3. mrn as last resort
                                 */}
                                {patient.displayMedicalNumber || patient.medicalNumber || patient.medicalId || patient.mrn || 'Not Assigned'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {patient.email && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Email:</span> {patient.email}
                                  </div>
                                )}
                                {phoneNumber && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Phone:</span> {phoneNumber}
                                  </div>
                                )}
                                {!patient.email && !phoneNumber && (
                                  <div className="text-sm text-gray-500">No contact info</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{patient.gender || 'Unknown'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{patientAge}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={patient.active ? "default" : "outline"}>
                                {patient.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  asChild
                                >
                                  <Link href={`/superadmin/users/patient/${patient.id}`}>
                                    <FileText className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-muted-foreground mb-2">No patients found</div>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "Try a different search term" : "Add patients to see them here"}
                  </p>
                </div>
              )}
              <CardFooter className="pt-6 pb-2 px-0 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <div>
                  Showing {Math.min(itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients 
                  (page {currentPage} of {Math.max(1, Math.ceil(filteredPatients.length / itemsPerPage))})
                </div>
                
                {/* Pagination Controls */}
                {(searchTerm ? filteredPatients.length > itemsPerPage : totalPatients > itemsPerPage) && (
                  <div className="flex justify-between items-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        // Calculate page numbers logic
                        const totalPages = searchTerm 
                          ? Math.ceil(filteredPatients.length / itemsPerPage)
                          : Math.ceil(totalPatients / itemsPerPage);
                        
                        let pageNum;
                        
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all page numbers
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // If near start, show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // If near end, show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Otherwise show 2 before and 2 after current page
                          pageNum = currentPage - 2 + i;
                        }
                        
                        // Only render if the page number is valid
                        if (pageNum <= totalPages) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => 
                        Math.min(Math.ceil(searchTerm 
                          ? filteredPatients.length / itemsPerPage 
                          : totalPatients / itemsPerPage), prev + 1)
                      )}
                      disabled={currentPage >= Math.ceil(searchTerm 
                        ? filteredPatients.length / itemsPerPage 
                        : totalPatients / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                )}
                
                <div className="hidden sm:block">FHIR compliant patient records</div>
              </CardFooter>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Region Chart Tab */}
        <TabsContent value="region-chart">
          <Card>
            <CardHeader>
              <CardTitle>Patient Distribution by Region</CardTitle>
              <CardDescription>
                Geographic distribution of patients across regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-[350px] w-full flex justify-center items-center">
                  <Pie
                    data={regionChartData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            boxWidth: 15,
                            padding: 15
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                              const percentage = Math.round((value as number / total) * 100);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
