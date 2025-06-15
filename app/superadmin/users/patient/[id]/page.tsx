"use client"

import React, { useState, useEffect, useCallback, cache } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Building, 
  Activity, 
  Heart, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  UserCheck
} from "lucide-react"

// FHIR-compliant type definitions
interface FHIRHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

interface FHIRContactPoint {
  system: string;
  value: string;
  use?: string;
  rank?: number;
  period?: {
    start?: string;
    end?: string;
  };
}

interface FHIRAddress {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface FHIRPatient {
  id: string;
  resourceType: string;
  medicalNumber: string;
  active: boolean;
  name: FHIRHumanName[] | string;
  telecom?: FHIRContactPoint[] | string;
  gender?: string;
  birthDate?: string;
  address?: FHIRAddress[] | string;
  contact?: any;
  communication?: any;
  email?: string;
  hospitalId?: string;
  hospitalName?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface MedicalRecord {
  id: string;
  resourceType: string;
  status: string;
  code: string;
  subject: string;
  encounter?: string;
  effectiveDateTime: string;
  issued: string;
  performer: string;
  valueString?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  bodySite?: string;
  method?: string;
  device?: string;
  referenceRange?: any;
  interpretation?: string;
  note?: string;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientVisit {
  id: string;
  date: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  provider: string;
  diagnosis: string;
  status: string;
}

interface PatientParams {
  id: string;
}

// Helper function to format FHIR name
function formatFhirName(nameObj: any): string {
  try {
    if (!nameObj) return "Unknown";
    
    // Parse the name object if it's a string
    const nameData = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
    
    // Use the text representation if available
    if (nameData.text) return nameData.text;
    
    // Try to get from given and family name
    if (Array.isArray(nameData)) {
      // Use the first name in the array
      const firstNameObj = nameData[0];
      
      // Return text if available
      if (firstNameObj.text) return firstNameObj.text;
      
      // Construct from given and family
      const given = firstNameObj.given ? firstNameObj.given.join(' ') : '';
      const family = firstNameObj.family || '';
      
      if (given || family) {
        return `${given} ${family}`.trim();
      }
    } else {
      // If it's a single name object
      const given = nameData.given ? nameData.given.join(' ') : '';
      const family = nameData.family || '';
      
      if (given || family) {
        return `${given} ${family}`.trim();
      }
    }
    
    return "Unknown";
  } catch (e) {
    console.error("Error parsing name:", e);
    return "Unknown";
  }
}

// Helper function to get initials
function getPatientInitials(nameObj: any): string {
  const name = formatFhirName(nameObj);
  return name.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase().substring(0, 2) || '??';
}

// Helper function to calculate age
function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to get contact info
function getContactInfo(telecom: any): { phone: string, email: string } {
  let phone = '';
  let email = '';
  
  try {
    if (!telecom) return { phone, email };
    
    // Parse the telecom if it's a string
    const telecomData = typeof telecom === 'string' ? JSON.parse(telecom) : telecom;
    
    if (Array.isArray(telecomData)) {
      // Find phone
      const phoneContact = telecomData.find((t: any) => t.system === 'phone');
      if (phoneContact) phone = phoneContact.value;
      
      // Find email
      const emailContact = telecomData.find((t: any) => t.system === 'email');
      if (emailContact) email = emailContact.value;
    }
    
    return { phone, email };
  } catch (e) {
    console.error("Error parsing contact info:", e);
    return { phone, email };
  }
}

// Helper function to get address
function getFormattedAddress(address: any): string {
  try {
    if (!address) return '';
    
    // Parse the address if it's a string
    const addressData = typeof address === 'string' ? JSON.parse(address) : address;
    
    if (Array.isArray(addressData) && addressData.length > 0) {
      const addr = addressData[0];
      
      // Return text representation if available
      if (addr.text) return addr.text;
      
      // Construct address from components
      const lines = addr.line ? addr.line.join(', ') : '';
      const city = addr.city ? addr.city : '';
      const state = addr.state ? addr.state : '';
      const postalCode = addr.postalCode ? addr.postalCode : '';
      const country = addr.country ? addr.country : '';
      
      return [lines, city, state, postalCode, country]
        .filter(Boolean)
        .join(', ');
    } else if (!Array.isArray(addressData)) {
      // If it's a single address object
      // Return text representation if available
      if (addressData.text) return addressData.text;
      
      // Construct address from components
      const lines = addressData.line ? addressData.line.join(', ') : '';
      const city = addressData.city ? addressData.city : '';
      const state = addressData.state ? addressData.state : '';
      const postalCode = addressData.postalCode ? addressData.postalCode : '';
      const country = addressData.country ? addressData.country : '';
      
      return [lines, city, state, postalCode, country]
        .filter(Boolean)
        .join(', ');
    }
    
    return '';
  } catch (e) {
    console.error("Error parsing address:", e);
    return '';
  }
}

// Define the page props with current params handling in Next.js
interface PageProps {
  params: Promise<PatientParams>
}

// Use cache to ensure stable reference for ID extraction
const getPatientId = cache((params: PatientParams): string => {
  return params.id;
});

// Export the page component as a Client Component
export default function PatientDetailsPage({ params }: PageProps) {
  // Correctly unwrap params using React.use()
  const resolvedParams = React.use(params);
  const router = useRouter();
  
  const [patient, setPatient] = useState<FHIRPatient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [hospitalVisits, setHospitalVisits] = useState<PatientVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For Next.js 15.x, properly handle params access using useCallback
  const fetchPatientData = useCallback(async (id: string) => {
    // All data fetching uses this id parameter rather than params.id directly
    // This avoids the React warning while still accessing the data we need
    setLoading(true);
    setError(null);
    try {
      // Fetch patient details
      const patientResponse = await fetch(`/api/patients/${id}`);
      if (!patientResponse.ok) {
        const errorData = await patientResponse.json();
        throw new Error(errorData.error || "Failed to fetch patient");
      }
      const patientData = await patientResponse.json();
      setPatient(patientData);
      
      try {
        // Fetch patient medical records
        const recordsResponse = await fetch(`/api/patients/${id}/records`);
        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          setMedicalRecords(recordsData.records || []);
        } else {
          // Handle missing endpoint gracefully
          console.log('Medical records API not available');
          setMedicalRecords([]);
        }
      } catch (recordsError) {
        console.warn('Could not fetch medical records:', recordsError);
        setMedicalRecords([]);
      }
      
      try {
        // Fetch patient hospital visits
        const visitsResponse = await fetch(`/api/patients/${id}/visits`);
        if (visitsResponse.ok) {
          const visitsData = await visitsResponse.json();
          setHospitalVisits(visitsData.visits || []);
        } else {
          // Handle missing endpoint gracefully
          console.log('Visits API not available');
          setHospitalVisits([]);
        }
      } catch (visitsError) {
        console.warn('Could not fetch hospital visits:', visitsError);
        setHospitalVisits([]);
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load patient data");
      setError(error instanceof Error ? error.message : "Failed to load patient data");
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch patient data when component mounts using the resolved params
  useEffect(() => {
    const patientId = getPatientId(resolvedParams);
    if (patientId) {
      fetchPatientData(patientId);
    }
  }, [resolvedParams, fetchPatientData]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="mr-2 h-16 w-16 animate-spin" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Error Loading Patient</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }
  
  if (!patient) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Patient Not Found"
          description="The requested patient record could not be found"
        />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Patient Record Not Found</h2>
              <p className="text-muted-foreground max-w-md">
                The patient record you are looking for does not exist or you may not have permission to view it.
              </p>
              <Button asChild>
                <Link href="/superadmin/users/patient">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Patient Directory
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Format patient information
  const patientName = formatFhirName(patient.name);
  const patientInitials = getPatientInitials(patient.name);
  const patientAge = patient.birthDate ? calculateAge(patient.birthDate) : "--";
  const { phone, email } = getContactInfo(patient.telecom);
  const address = getFormattedAddress(patient.address);
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Patient Record"
            description="FHIR-compliant patient health record"
          />
          <Button variant="outline" asChild>
            <Link href="/superadmin/users/patient">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patient Directory
            </Link>
          </Button>
        </div>
        
        {/* Patient Profile Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Patient Profile</CardTitle>
            <CardDescription>
              Medical Number: <span className="font-mono">{patient.medicalNumber}</span> | ID: {patient.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Patient Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {patient.photo ? (
                      <AvatarImage src={patient.photo} alt={patientName} />
                    ) : (
                      <AvatarFallback className="text-lg">{patientInitials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{patientName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={patient.active ? "default" : "secondary"}>
                        {patient.active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {patient.gender && `${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`}
                        {patient.birthDate && ` • ${patientAge} years`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Medical Number</div>
                    <div className="font-mono">{patient.medicalNumber}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                    <div>{patient.birthDate ? formatDate(patient.birthDate) : "--"}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Gender</div>
                    <div className="capitalize">{patient.gender || "--"}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Registered</div>
                    <div>{formatDate(patient.createdAt)}</div>
                  </div>
                </div>
              </div>
              
              {/* Patient Contact Info */}
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-sm text-muted-foreground">{phone || "--"}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{email || patient.email || "--"}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-sm text-muted-foreground">{address || "--"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for different sections */}
        <Tabs defaultValue="medical-records" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="medical-records">
              <Activity className="mr-2 h-4 w-4" />
              Medical Records
            </TabsTrigger>
            <TabsTrigger value="hospital-visits">
              <Building className="mr-2 h-4 w-4" />
              Hospital Visits
            </TabsTrigger>
            <TabsTrigger value="fhir-data">
              <FileText className="mr-2 h-4 w-4" />
              FHIR Data
            </TabsTrigger>
          </TabsList>
          
          {/* Medical Records Tab */}
          <TabsContent value="medical-records" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>
                  Clinical observations and reports from all healthcare facilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalRecords.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Hospital</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medicalRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.effectiveDateTime)}</TableCell>
                            <TableCell>{record.hospitalName}</TableCell>
                            <TableCell>{record.code}</TableCell>
                            <TableCell>
                              <Badge variant={record.status === "final" ? "default" : "secondary"}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.performer}</TableCell>
                            <TableCell>
                              {record.valueString || 
                              (record.valueQuantity ? 
                                `${record.valueQuantity.value} ${record.valueQuantity.unit}` : 
                                "--")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No medical records found for this patient
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Hospital Visits Tab */}
          <TabsContent value="hospital-visits" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hospital Visits</CardTitle>
                <CardDescription>
                  History of patient visits across all healthcare facilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hospitalVisits.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Hospital</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Diagnosis</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hospitalVisits.map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell>{formatDate(visit.date)}</TableCell>
                            <TableCell>{visit.hospitalName}</TableCell>
                            <TableCell>{visit.department}</TableCell>
                            <TableCell>{visit.provider}</TableCell>
                            <TableCell>{visit.diagnosis}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  visit.status === "completed" ? "default" : 
                                  visit.status === "in-progress" ? "outline" : 
                                  "secondary"
                                }
                              >
                                {visit.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hospital visits found for this patient
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* FHIR Data Tab */}
          <TabsContent value="fhir-data" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>FHIR Patient Resource</CardTitle>
                <CardDescription>
                  Complete FHIR-compliant patient resource data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                  {JSON.stringify(patient, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
