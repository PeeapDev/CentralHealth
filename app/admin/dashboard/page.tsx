"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Users, RefreshCw } from "lucide-react"

interface Patient {
  id: string;
  medicalNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  birthDate: string;
  photo?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("patients");
  
  // Function to fetch patients
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/patients');
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Patients fetched from MongoDB:', data.patients);
        setPatients(data.patients || []);
      } else {
        throw new Error(data.error || 'Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError((err as Error).message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);
  
  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate age from birth date
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage patients, staff, and hospital resources
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPatients}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="default" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Add New Patient
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patients" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Patient Registry</CardTitle>
              <CardDescription>
                Showing all {patients.length} registered patients in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading patients...</span>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No patients registered yet.</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>
                    A list of all registered patients.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medical Number</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              {patient.photo ? (
                                <AvatarImage src={patient.photo} alt={`${patient.firstName} ${patient.lastName}`} />
                              ) : null}
                              <AvatarFallback>{`${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`}</AvatarFallback>
                            </Avatar>
                            <span>{`${patient.firstName} ${patient.lastName}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>{patient.medicalNumber}</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell>{calculateAge(patient.birthDate)}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>{formatDate(patient.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                />
                              </svg>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>
                Manage hospital staff and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 text-muted-foreground">
                <p>Staff management features coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Calendar</CardTitle>
              <CardDescription>
                View and manage patient appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 text-muted-foreground">
                <p>Appointment management features coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure hospital system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 text-muted-foreground">
                <p>System settings features coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
