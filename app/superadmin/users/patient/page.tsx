"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
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
    
    // Parse the name object if it's a string
    const nameData = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
    
    // Try to get initials from given and family name
    let initials = '';
    
    if (nameData.given && nameData.given.length > 0) {
      initials += nameData.given[0][0];
    }
    
    if (nameData.family) {
      initials += nameData.family[0];
    }
    
    return initials.toUpperCase();
  } catch (e) {
    console.error("Error parsing name:", e);
    return "?";
  }
}

// Helper function to format name from FHIR structure
function formatFhirName(nameObj: any): string {
  try {
    if (!nameObj) return "Unknown";
    
    // Parse the name object if it's a string
    const nameData = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
    
    // Use the text representation if available
    if (nameData.text) return nameData.text;
    
    // Otherwise construct from parts
    let name = '';
    
    // Add prefix if available (Dr., Mr., etc.)
    if (nameData.prefix && nameData.prefix.length > 0) {
      name += nameData.prefix[0] + ' ';
    }
    
    // Add given names (first name, middle name, etc.)
    if (nameData.given && nameData.given.length > 0) {
      name += nameData.given.join(' ') + ' ';
    }
    
    // Add family name (last name)
    if (nameData.family) {
      name += nameData.family;
    }
    
    return name.trim() || "Unknown";
  } catch (e) {
    console.error("Error formatting name:", e);
    return "Unknown";
  }
}

// Helper function to get age from birthDate
function calculateAge(birthDateStr: string): number {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
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
  const [patients, setPatients] = useState<FHIRPatient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredPatients, setFilteredPatients] = useState<FHIRPatient[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all-patients");
  
  // Fetch patients data
  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        const response = await fetch("/api/patients");
        
        // Even if response is not OK, we'll handle it gracefully
        const data = await response.json();
        
        // If we have patients data, set it, otherwise use an empty array
        if (data && Array.isArray(data.patients)) {
          setPatients(data.patients);
        } else {
          console.log("No patients data available or invalid format", data);
          setPatients([]);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        // Don't show error toast to user, just set empty array
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPatients();
  }, []);
  
  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/patients");
      
      // Even if response is not OK, we'll handle it gracefully
      const data = await response.json();
      
      // If we have patients data, set it, otherwise use an empty array
      if (data && Array.isArray(data.patients)) {
        setPatients(data.patients);
        toast.success("Patient data refreshed");
      } else {
        console.log("No patients data available or invalid format", data);
        setPatients([]);
        toast.info("No patient records found");
      }
    } catch (error) {
      console.error("Error refreshing patients:", error);
      // Set empty array but show a more gentle message
      setPatients([]);
      toast.info("No patient data available");
    } finally {
      setLoading(false);
    }
  };
  
  // Filter patients when search term or patients change
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = patients.filter(patient => {
        // Search in name
        const nameMatch = patient.name && formatFhirName(patient.name).toLowerCase().includes(lowercasedSearch);
        
        // Search in medical number
        const medicalNumberMatch = patient.medicalNumber && patient.medicalNumber.toLowerCase().includes(lowercasedSearch);
        
        // Search in email
        const emailMatch = patient.email && patient.email.toLowerCase().includes(lowercasedSearch);
        
        return nameMatch || medicalNumberMatch || emailMatch;
      });
      
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);
  
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
              ) : filteredPatients.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medical #</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead aria-label="Actions"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => {
                        const patientName = formatFhirName(patient.name);
                        const patientInitials = getInitialsFromFhirName(patient.name);
                        const patientAge = patient.birthDate ? calculateAge(patient.birthDate) : '--';
                        const formattedDate = new Date(patient.createdAt).toLocaleDateString();
                        
                        return (
                          <TableRow key={patient.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  {patient.photo ? (
                                    <AvatarImage src={patient.photo} alt={patientName} />
                                  ) : (
                                    <AvatarFallback>{patientInitials}</AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-medium">{patientName}</div>
                                  <div className="text-sm text-muted-foreground">{patient.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{patient.medicalNumber}</TableCell>
                            <TableCell>{patient.gender}</TableCell>
                            <TableCell>{patientAge}</TableCell>
                            <TableCell>
                              <Badge variant={patient.active ? "default" : "secondary"}>
                                {patient.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formattedDate}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/superadmin/users/patient/${patient.id}`}>
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">View patient record</span>
                                </Link>
                              </Button>
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
              <CardFooter className="pt-6 pb-2 px-0 flex justify-between text-sm text-muted-foreground">
                <div>Showing {filteredPatients.length} of {patients.length} patients</div>
                <div>FHIR compliant patient records</div>
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
