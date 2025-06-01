"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, Activity, Calendar, FileText } from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Pages in app/[hospitalName]/* get the hospitalName from dynamic route params
interface PatientsPageProps {
  params: Promise<{ hospitalName: string }>
}

// Use dynamic import to avoid SSR issues with React hooks
const PatientInfoCard = dynamic(() => import("./info-card"), {
  ssr: false
})

// Pagination interface
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// FHIR Patient interface
interface FHIRPatient {
  id: string;
  resourceType: string;
  medicalNumber: string;
  active: boolean;
  name?: Array<{
    text?: string;
    family?: string;
    given?: string[];
  }> | string;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }> | string;
  gender?: string;
  birthDate?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }> | string;
  photo?: string;
  email?: string;
  hospitalId?: string;
  hospitalName?: string;
  hospital?: {
    name: string;
    subdomain: string;
    id?: string;
  };
}

// Pagination component
function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const maxVisiblePages = 5;
  const pages = [];
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // First Page
  if (startPage > 1) {
    pages.push(
      <Button
        key="first"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
      >
        1
      </Button>
    );
    
    if (startPage > 2) {
      pages.push(
        <span key="ellipsis1" className="px-2">
          ...
        </span>
      );
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <Button
        key={i}
        variant={i === currentPage ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(i)}
      >
        {i}
      </Button>
    );
  }
  
  // Last Page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="ellipsis2" className="px-2">
          ...
        </span>
      );
    }
    
    pages.push(
      <Button
        key="last"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
      >
        {totalPages}
      </Button>
    );
  }
  
  return (
    <div className="flex items-center justify-center space-x-2 my-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <div className="flex items-center space-x-1">{pages}</div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
}

export default function PatientsPage({ params }: PatientsPageProps) {
  // Initialize router for navigation
  const router = useRouter();
  
  // Unwrap the Promise params using React.use()
  const resolvedParams = React.use(params);
  const { hospitalName } = resolvedParams;
  const formattedHospitalName = hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [medicalNumberQuery, setMedicalNumberQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<FHIRPatient[]>([]);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<FHIRPatient | null>(null);
  
  // Function to extract patient name from FHIR structure
  const getPatientName = (patient: FHIRPatient): string => {
    if (!patient.name) return "Unknown";
    
    try {
      // Parse JSON if it's a string
      const nameData = typeof patient.name === 'string' 
        ? JSON.parse(patient.name) 
        : patient.name;
      
      // Handle array of names or single name object
      const nameObj = Array.isArray(nameData) ? nameData[0] : nameData;
      
      // Use text if available
      if (nameObj.text) return nameObj.text;
      
      // Otherwise construct from parts
      const given = nameObj.given ? nameObj.given.join(' ') : '';
      const family = nameObj.family || '';
      
      return `${given} ${family}`.trim() || "Unknown";
    } catch (e) {
      console.error("Error parsing patient name:", e);
      return "Unknown";
    }
  };
  
  // Function to get patient initials for avatar
  const getPatientInitials = (patient: FHIRPatient): string => {
    const name = getPatientName(patient);
    return name.split(' ')
      .map(part => part?.[0] || '')
      .join('')
      .toUpperCase().substring(0, 2) || '??';
  };
  
  // Function to calculate age from birthDate
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Function to get primary contact information
  const getContactInfo = (patient: FHIRPatient): { phone: string, email: string } => {
    let phone = '';
    let email = patient.email || '';
    
    try {
      // Check telecom array
      if (patient.telecom) {
        const telecomData = typeof patient.telecom === 'string' 
          ? JSON.parse(patient.telecom) 
          : patient.telecom;
        
        if (Array.isArray(telecomData)) {
          // Find phone
          const phoneContact = telecomData.find(t => t.system === 'phone');
          if (phoneContact) phone = phoneContact.value;
          
          // Find email if not already set
          if (!email) {
            const emailContact = telecomData.find(t => t.system === 'email');
            if (emailContact) email = emailContact.value;
          }
        }
      }
      
      return { phone, email };
    } catch (e) {
      console.error('Error parsing contact info:', e);
      return { phone: '', email: '' };
    }
  };

  // Function to search patients - always scoped to current hospital
  const searchPatients = async () => {
    setIsLoading(true);
    setSearchPerformed(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (medicalNumberQuery) {
        params.append('medicalNumber', medicalNumberQuery);
      }
      
      // Always include hospital ID - hospital-scoped search only
      params.append('hospitalId', hospitalName);
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      // Log the URL being called for debugging
      const apiUrl = `/api/patients?${params.toString()}`;
      console.log('Calling API:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        throw new Error(`API returned ${response.status}`);
      }
      
      // Process response
      const data = await response.json();
      console.log('API response:', data);
      
      // Check if we have valid patient data
      if (data && Array.isArray(data.patients)) {
        // Use patients directly from the response
        setPatients(data.patients);
        setTotalPatients(data.total || 0);
        
        // Show a gentle notification if no results found after search
        if (data.patients.length === 0 && searchPerformed) {
          toast.info("No patients found matching your criteria");
        }
      } else {
        console.log("Invalid patient data format received:", data);
        setPatients([]);
        setTotalPatients(0);
        
        if (searchPerformed) {
          toast.info("No patient records available");
        }
      }
      
    } catch (error) {
      console.error('Error searching patients:', error);
      // Use a more friendly message rather than error
      toast.info('No patient records available');
      // Set empty state
      setPatients([]);
      setTotalPatients(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission for search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when performing a new search
    setCurrentPage(1); 
    searchPatients();
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    searchPatients();
  };
  
  // Initialize with data on first load
  useEffect(() => {
    searchPatients();
  }, [hospitalName]);

  const pageCount = Math.ceil(totalPatients / pageSize);

  // View patient details
  const viewPatientDetails = (patient: FHIRPatient) => {
    setSelectedPatient(patient);
  };
  
  // Handle record selection (used in the View Record button)
  const handleRecordSelect = (patient: FHIRPatient) => {
    viewPatientDetails(patient);
  };
  
  // Close patient details modal
  const closePatientDetails = () => {
    setSelectedPatient(null);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`${formattedHospitalName} - Patient Management`}
        description="Search and access patients from the hospital registry"
        breadcrumbs={[{ label: formattedHospitalName }, { label: "Admin" }, { label: "Patient Management" }]}
      />
      
      {selectedPatient ? (
        <PatientInfoCard patient={selectedPatient} onClose={closePatientDetails} />
      ) : (
        <>
          {/* Patient Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Search</CardTitle>
              <CardDescription>
                Search for patients in {formattedHospitalName} by name, email, or medical number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchQuery">Search by Name or Email</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="searchQuery"
                        placeholder="Enter patient name or email"
                        className="flex-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalNumberQuery">Medical Number</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="medicalNumberQuery"
                        placeholder="Enter medical number"
                        className="flex-1" 
                        value={medicalNumberQuery}
                        onChange={(e) => setMedicalNumberQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setMedicalNumberQuery('');
                    }}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center space-x-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                        <span>Searching...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <Search className="h-4 w-4 mr-2" />
                        <span>Search {formattedHospitalName}</span>
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Patient Results */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Directory</CardTitle>
              <CardDescription>
                {searchPerformed 
                  ? `Found ${totalPatients} patient(s) matching your search criteria` 
                  : `Showing patients from ${formattedHospitalName}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medical ID</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : patients.length > 0 ? (
                      patients.map((patient) => {
                        const patientName = getPatientName(patient);
                        const patientInitials = getPatientInitials(patient);
                        const age = patient.birthDate ? calculateAge(patient.birthDate) : null;
                        const contactInfo = getContactInfo(patient);
                        
                        return (
                          <TableRow key={patient.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => viewPatientDetails(patient)}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={patient.photo || ""} alt={patientName} />
                                  <AvatarFallback>{patientInitials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{patientName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    ID: {patient.id.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{patient.medicalNumber}</TableCell>
                            <TableCell>
                              {age !== null ? `${age} years` : 'N/A'} / {patient.gender || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <div>{contactInfo.email}</div>
                              <div>{contactInfo.phone}</div>
                            </TableCell>

                            <TableCell>
                              <Badge variant={patient.active ? "default" : "destructive"} className={patient.active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                {patient.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                viewPatientDetails(patient);
                              }}>
                                View
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                toast.info(`Edit details for ${patientName}`);
                              }}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                toast.info(`View timeline for ${patientName}`);
                              }}>
                                Timeline
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleRecordSelect(patient)}>
                                  View Record
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  onClick={() => router.push(`/${hospitalName}/admin/patients/${patient.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchPerformed 
                              ? "No patients found matching your search criteria" 
                              : "No patients found in the system"}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {patients.length > 0 && pageCount > 1 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={pageCount}
                  onPageChange={handlePageChange}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
