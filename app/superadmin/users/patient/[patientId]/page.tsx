"use client"

import { useState, useEffect } from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
import { Loader2, RefreshCw, ArrowLeft, Edit, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDistance } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Import patient data utilities for consistent contact handling
import { parseContactJson, getPatientEmail, getPatientPhone } from "@/lib/patient-data-utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Name {
  given?: string | string[]
  family?: string
  text?: string
  [key: string]: any
}

interface Address {
  line?: string | string[]
  city?: string
  state?: string
  postalCode?: string
  country?: string
  [key: string]: any
}

interface ContactData {
  email?: string
  phone?: string
  address?: string | Address
}

interface PatientData {
  id: string;
  medicalNumber?: string;
  name?: any;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  contact?: string | ContactData;
  registrationData?: string | {
    name?: string;
    email?: string;
    phone?: string;
    address?: string | Record<string, any>;
    gender?: string;
    dateOfBirth?: string;
    photo?: string;
    [key: string]: any;
  };
  photo?: string
  User?: {
    photo?: string
    email?: string
  }
  user?: {
    photo?: string
  }
  Hospital?: {
    name?: string
  }
  telecom?: string | Array<{ system: string; value: string }>
  medicalHistory?: string | Record<string, any>
  // registrationData is defined above
  onboardingCompleted?: boolean
  displayMedicalNumber?: string
  [key: string]: any
}

function PatientInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      <div className="space-y-4">
        <div className="h-28 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminPatientProfile() {
  const params = useParams<{ patientId: string }>();
  const patientId = params?.patientId;
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    email: '',
    phone: '',
    address: ''
  });
  const [updatingContact, setUpdatingContact] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const calculateAge = (birthDateStr?: string): number => {
    if (!birthDateStr) return 0;
    
    try {
      const birthDate = new Date(birthDateStr);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        console.error('Invalid birth date:', birthDateStr);
        return 0;
      }
      
      if (birthDate > today) {
        console.warn('Birth date is in the future:', birthDate);
        return 0;
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  };

  const fetchPatientData = async () => {
    if (!patientId) {
      setError("Patient ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch patient data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setPatient(data);
    } catch (error) {
      console.error("Error fetching patient:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error fetching patient data";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  useEffect(() => {
    if (patient) {
      try {
        console.log('Setting up contact form with patient data');

        // Simply use our direct getter functions to populate the form
        const emailValue = getEmail() !== 'No email on record' ? getEmail() : '';
        const phoneValue = getPhone() !== 'No phone on record' ? getPhone() : '';
        
        // Get address from contact data if available
        let addressValue = '';
        try {
          const contactData = typeof patient.contact === 'string'
            ? JSON.parse(patient.contact || '{}')
            : (patient.contact || {});
            
          if (contactData && contactData.address) {
            addressValue = typeof contactData.address === 'string' 
              ? contactData.address 
              : JSON.stringify(contactData.address, null, 2);
            console.log('Using contact data address');
          }
        } catch (e) {
          console.error('Error parsing address from contact:', e);
        }

        // Direct assignment of form values
        console.log('Setting contact form with direct values:', {
          email: emailValue,
          phone: phoneValue,
          hasAddress: !!addressValue
        });
        
        // Set the form values
        setContactForm({
          email: emailValue,
          phone: phoneValue,
          address: addressValue
        });
      } catch (e) {
        console.error('Error processing contact data:', e);
        setContactForm({
          email: '',
          phone: '',
          address: ''
        });
      }
    }
  }, [patient, loading]);

  const handleUpdateContact = async () => {
    try {
      setUpdatingContact(true);
      
      let addressValue: string | Address = contactForm.address;
      if (contactForm.address && contactForm.address.trim().startsWith('{')) {
        try {
          addressValue = JSON.parse(contactForm.address);
        } catch (e) {
          console.error('Address isn\'t valid JSON, keeping as string:', e);
        }
      }
      
      const response = await fetch(`/api/patients/update-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          email: contactForm.email,
          phone: contactForm.phone,
          address: addressValue,
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Contact information updated successfully',
        });
        setLoading(true);
        fetchPatientData();
        setIsEditingContact(false);
      } else {
        throw new Error(data.message || 'Failed to update contact information');
      }
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update contact information',
        variant: 'destructive',
      });
    } finally {
      setUpdatingContact(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsResetting(true);
      setResetSuccess(false);

      let contactData: ContactData = {};
      let patientEmail = '';

      try {
        if (patient?.contact) {
          contactData = typeof patient.contact === 'string'
            ? JSON.parse(patient.contact)
            : patient.contact;

          patientEmail = contactData.email || '';
        }
      } catch (e) {
        console.error('Error parsing patient contact:', e);
      }

      if (!patientEmail && patient) {
        toast({
          variant: "destructive",
          title: "Missing Email",
          description: "This patient doesn't have an email address. Please add one before resetting password.",
        });
        setIsResetting(false);
        setIsResetDialogOpen(false);
        setIsEditingContact(true);
        return;
      }

      if (patient?.mrn) {
        toast({
          title: "Processing...",
          description: "Sending password reset link",
        });

        const response = await fetch("/api/patients/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicalNumber: patient.mrn,
            email: patientEmail,
          }),
        });

        if (!response.ok) {
          let errorText;
          try {
            const errorData = await response.json();
            errorText = errorData.error || 'Failed to send password reset';
          } catch {
            errorText = `Error: ${response.status}`;
          }

          throw new Error(errorText);
        }

        setResetSuccess(true);
        toast({
          title: "Success",
          description: `Password reset link sent to ${patientEmail}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Missing medical record number",
        });
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage = error?.message || "Failed to send password reset link";
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: errorMessage,
      });
    } finally {
      setIsResetting(false);
      setIsResetDialogOpen(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return "Invalid date";
    }
  };

  if (!patientId) {
    return <div>Patient ID is missing</div>;
  }

  if (loading) {
    return <PatientInfoSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error loading patient</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => fetchPatientData()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!patient) {
    return <div>No patient data found</div>;
  }

  const getName = (): string => {
    // Try all possible sources for patient's name in priority order
    if (patient.fullName) return patient.fullName;
    if (patient.displayName) return patient.displayName;
    
    // Try registration data for name
    if (patient.registrationData) {
      const regData = typeof patient.registrationData === 'string' ?
        JSON.parse(patient.registrationData || '{}') : patient.registrationData;
      if (regData?.name) {
        return regData.name;
      }
    }
    
    // Try FHIR name structure
    if (patient.name) {
      if (Array.isArray(patient.name) && patient.name.length > 0) {
        const nameObj = patient.name[0];
        if (nameObj.text) return nameObj.text;
        
        const given = Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given || '';
        const family = nameObj.family || '';
        return `${given} ${family}`.trim();
      } else if (typeof patient.name === 'object') {
        const nameObj = patient.name;
        if (nameObj.text) return nameObj.text;
        
        const given = Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given || '';
        const family = nameObj.family || '';
        return `${given} ${family}`.trim();
      }
    }
    
    // Try firstName/lastName composition
    if (patient.firstName || patient.lastName) {
      return `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    }
    
    return 'Unknown Patient';
  };

  const getInitials = (): string => {
    const name = getName();
    if (!name || name === "Unknown Patient") {
      return patient.medicalNumber?.substring(0, 2).toUpperCase() || "P";
    }
    
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    
    // If just one name part, use first two letters
    if (nameParts.length === 1 && nameParts[0].length >= 2) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    // Fallback
    return name.substring(0, 1).toUpperCase() || "P";
    
    return name.substring(0, 2).toUpperCase();
  };

  // Direct function to get email from patient data
  const getEmail = (): string => {
    // Most direct approach - check properties in priority order
    if (!patient) return 'No email on record';
    
    console.log('Getting email - patient data available:', {
      hasDirectEmail: !!patient.email,
      hasUser: !!patient.User,
      hasUserEmail: !!(patient.User && patient.User.email),
      hasContact: !!patient.contact
    });
    
    // Direct email property is highest priority
    if (patient.email) {
      console.log('Using direct email property:', patient.email);
      return patient.email;
    }
    
    // User relation email is next priority
    if (patient.User && patient.User.email) {
      console.log('Using User.email:', patient.User.email);
      return patient.User.email;
    }
    
    // Fall back to contact data
    try {
      const contactData = typeof patient.contact === 'string'
        ? JSON.parse(patient.contact || '{}')
        : (patient.contact || {});
      
      if (contactData && contactData.email) {
        console.log('Using contact.email:', contactData.email);
        return contactData.email;
      }
    } catch (e) {
      console.error('Error parsing contact data for email:', e);
    }
    
    return 'No email on record';
  };

  // Direct function to get phone from patient data
  const getPhone = (): string => {
    // Most direct approach - check properties in priority order
    if (!patient) return 'No phone on record';
    
    console.log('Getting phone - patient data available:', {
      hasDirectPhone: !!patient.phone,
      hasContact: !!patient.contact
    });
    
    // Direct phone property is highest priority
    if (patient.phone) {
      console.log('Using direct phone property:', patient.phone);
      return patient.phone;
    }
    
    // Fall back to contact data
    try {
      const contactData = typeof patient.contact === 'string'
        ? JSON.parse(patient.contact || '{}')
        : (patient.contact || {});
      
      if (contactData && contactData.phone) {
        console.log('Using contact.phone:', contactData.phone);
        return contactData.phone;
      }
    } catch (e) {
      console.error('Error parsing contact data for phone:', e);
    }
    
    return 'No phone on record';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/superadmin/patients/${patientId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setIsResetDialogOpen(true)}>
                Reset Password
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Patient Password</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset the patient's password? They will receive an email with instructions to set a new password.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetPassword} 
                  disabled={isResetting}
                  className={isResetting ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {resetSuccess ? "Password Reset!" : "Reset Password"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditingContact(prev => !prev)}
          >
            {isEditingContact ? "Cancel Edit" : "Edit Contact Info"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-blue-50 border border-slate-200">
                <AvatarImage 
                  src={patient.photo || 
                       patient.User?.photo || 
                       patient.user?.photo || 
                       ''} 
                  alt={getName()} 
                  onError={() => console.log(`Using initials for patient ${patient.medicalNumber || patient.mrn}`)} 
                />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xl block">{getName()}</span>
                <Badge variant="outline" className="mt-1">{patient.gender || 'Unknown'}</Badge>
              </div>
            </div>
            {resetSuccess && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Reset Email Sent
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Medical Record #: {patient.medicalNumber || patient.mrn || 'Not Assigned'} | Created: {formatDate(patient.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">Date of Birth</h4>
              <p>
                {patient.birthDate ? (
                  <>
                    {formatDate(patient.birthDate)}
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({calculateAge(patient.birthDate)} years old)
                    </span>
                  </>
                ) : 'Not available'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Contact</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">{isEditingContact ? 'Edit mode' : 'View mode'}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingContact(!isEditingContact)}
                >
                  {isEditingContact ? 'Cancel' : 'Edit Contact'}
                </Button>
              </div>
              {isEditingContact ? (
                <div className="space-y-2 mt-2">
                  <div className="grid gap-3">
                    <p className="text-sm font-medium">Email:</p>
                    <div className="flex justify-between items-center">
                      <p className="text-primary">
                        {!isEditingContact ? getEmail() : contactForm.email || 'No email on record'}
                      </p>
                      {isEditingContact && (
                        <input 
                          type="email" 
                          className="p-2 border rounded text-sm w-full" 
                          value={contactForm.email}
                          onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                          placeholder="Enter patient email"
                          required
                        />
                      )}
                    </div>

                    <p className="text-sm font-medium">Phone:</p>
                    <div className="flex justify-between items-center">
                      <p className="text-primary">
                        {!isEditingContact ? getPhone() : contactForm.phone || 'No phone on record'}
                      </p>
                      {isEditingContact && (
                        <input 
                          type="tel" 
                          className="p-2 border rounded text-sm w-full" 
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                          placeholder="Enter patient phone"
                        />
                      )}
                    </div>

                    <p className="text-sm font-medium">Address:</p>
                    <div className="flex justify-between items-center">
                      <p className="whitespace-pre-wrap text-primary">{contactForm.address || 'No address on record'}</p>
                      {isEditingContact && (
                        <textarea 
                          className="p-2 border rounded text-sm w-full h-20" 
                          value={contactForm.address}
                          onChange={(e) => setContactForm({...contactForm, address: e.target.value})}
                          placeholder="Enter address or JSON object"
                        />
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={handleUpdateContact}
                    disabled={updatingContact || !contactForm.email.trim()}
                    className="w-full mt-2"
                  >
                    {updatingContact ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Contact Information
                  </Button>
                </div>
              ) : (
                <div className="border p-3 rounded-md">
                  <div className="flex flex-col space-y-1">
                    <div className="flex">
                      <span className="text-muted-foreground w-20">Email:</span>
                      <span className="font-medium">
                        {getEmail() !== 'No email on record' ? 
                          getEmail() : 
                          <span className="text-red-500">No email on record</span>
                        }
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-muted-foreground w-20">Phone:</span>
                      <span className="font-medium">
                        {getPhone() !== 'No phone on record' ? 
                          getPhone() : 
                          <span className="text-red-500">No phone on record</span>
                        }
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-muted-foreground w-20">Address:</span>
                      <span className="whitespace-pre-wrap">
                        {(() => {
                          try {
                            const contactData = typeof patient.contact === 'string' 
                              ? JSON.parse(patient.contact) 
                              : patient.contact;
                              
                            if (!contactData?.address) return 'No address on record';
                            
                            if (typeof contactData.address === 'string') {
                              return contactData.address;
                            }
                            
                            if (typeof contactData.address === 'object') {
                              const addr = contactData.address as Address;
                              const lines = addr.line ? (Array.isArray(addr.line) ? addr.line.join(', ') : addr.line) : '';
                              const city = addr.city || '';
                              const state = addr.state || '';
                              const postalCode = addr.postalCode || '';
                              const country = addr.country || '';
                              
                              return [lines, city, state, postalCode, country]
                                .filter(Boolean)
                                .join(', ');
                            }
                            
                            return JSON.stringify(contactData.address, null, 2);
                          } catch (e) {
                            return 'Error parsing address data';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              {isEditingContact ? null : (
                <>
                  {(() => {
                    try {
                      const contactData = typeof patient.contact === 'string'
                        ? JSON.parse(patient.contact)
                        : patient.contact;
                      const address = (contactData as ContactData)?.address as Address;
                      
                      if (!address) return <p>No address on record</p>;
                      
                      if (typeof address === 'string') return <p>{address}</p>;
                      
                      return (
                        <>
                          <p>{Array.isArray(address.line) ? address.line.join(', ') : address.line || 'No street address'}</p>
                          <p>
                            {address.city ? `${address.city}, ` : ''}
                            {address.state || ''}
                            {address.postalCode ? ` ${address.postalCode}` : ''}
                          </p>
                          <p>{address.country || ''}</p>
                        </>
                      );
                    } catch (e) {
                      return <p>Error parsing address data</p>;
                    }
                  })()}
                </>
              )}
            </div>
          </div>

          <Separator className="my-2" />

          <Tabs defaultValue="registration" className="w-full mt-2">
            <TabsList className="grid grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
            </TabsList>
            <TabsContent value="registration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registration & Onboarding Details</CardTitle>
                  <CardDescription>
                    Complete registration information and onboarding status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Account Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Onboarding Status</p>
                        <div className="flex items-center gap-2">
                          {patient.onboardingCompleted ? (
                            <Badge className="bg-green-500">Completed</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-500">Incomplete</Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                        <p>{formatDate(patient.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Patient Identifiers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Medical Record Number (MRN)</p>
                        <p className="font-mono">{patient.mrn || 'Not assigned'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Display Medical ID</p>
                        <p className="font-mono">{patient.displayMedicalNumber || 'Not assigned'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">System ID</p>
                        <p className="font-mono text-xs">{patient.id}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p>{getName()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Gender</p>
                        <p>{patient.gender || 'Not specified'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                        <p>
                          {patient.birthDate ? (
                            <>
                              {formatDate(patient.birthDate)}
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({calculateAge(patient.birthDate)} years old)
                              </span>
                            </>
                          ) : (
                            'Not specified'
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Hospital</p>
                        <p>{patient.Hospital?.name || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{patient.email || patient.User?.email || 'No email on record'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p>{getPhone()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <div className="pt-2">
                        {patient.address ? (
                          <div>
                            <p>{Array.isArray(patient.address.line) ? patient.address.line.join(', ') : patient.address.line || 'No street address'}</p>
                            <p>
                              {patient.address.city ? `${patient.address.city}, ` : ''}
                              {patient.address.state || ''} 
                              {patient.address.postalCode || ''}
                            </p>
                            <p>{patient.address.country || ''}</p>
                          </div>
                        ) : (
                          <p>No address on record</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Medical History</h3>
                    {patient.medicalHistory ? (
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const medicalHistory = typeof patient.medicalHistory === 'string'
                              ? JSON.parse(patient.medicalHistory)
                              : patient.medicalHistory;
                            
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {medicalHistory.allergies && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                                    {Array.isArray(medicalHistory.allergies) && medicalHistory.allergies.length > 0 ? (
                                      <ul className="list-disc pl-5">
                                        {medicalHistory.allergies.map((allergy: any, index: number) => (
                                          <li key={index}>{typeof allergy === 'string' ? allergy : JSON.stringify(allergy)}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p>No allergies recorded</p>
                                    )}
                                  </div>
                                )}
                                
                                {medicalHistory.conditions && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Medical Conditions</p>
                                    {Array.isArray(medicalHistory.conditions) && medicalHistory.conditions.length > 0 ? (
                                      <ul className="list-disc pl-5">
                                        {medicalHistory.conditions.map((condition: any, index: number) => (
                                          <li key={index}>{typeof condition === 'string' ? condition : JSON.stringify(condition)}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p>No medical conditions recorded</p>
                                    )}
                                  </div>
                                )}
                                
                                {medicalHistory.medications && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Medications</p>
                                    {Array.isArray(medicalHistory.medications) && medicalHistory.medications.length > 0 ? (
                                      <ul className="list-disc pl-5">
                                        {medicalHistory.medications.map((medication: any, index: number) => (
                                          <li key={index}>{typeof medication === 'string' ? medication : JSON.stringify(medication)}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p>No medications recorded</p>
                                    )}
                                  </div>
                                )}
                                
                                {Object.entries(medicalHistory)
                                  .filter(([key]) => !['allergies', 'conditions', 'medications'].includes(key))
                                  .map(([key, value]) => (
                                    <div className="space-y-1" key={key}>
                                      <p className="text-sm font-medium text-muted-foreground">
                                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                      </p>
                                      <p>{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                                    </div>
                                  ))}
                              </div>
                            );
                          } catch (e) {
                            console.error('Error parsing medical history:', e);
                            return <p>Error parsing medical history data</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <p>No medical history on record</p>
                    )}
                  </div>

                  {patient.registrationData && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Registration Details</h3>
                        <div className="border rounded p-3 bg-slate-50">
                          {(() => {
                            try {
                              const regData = typeof patient.registrationData === 'string'
                                ? JSON.parse(patient.registrationData)
                                : patient.registrationData;

                              return (
                                <div className="space-y-2">
                                  {Object.entries(regData).map(([key, value]) => {
                                    if (['id', 'photo', 'name'].includes(key)) return null;
                                    
                                    return (
                                      <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="text-sm font-medium">
                                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                        </div>
                                        <div className="md:col-span-2 break-all">
                                          {typeof value === 'object' 
                                            ? JSON.stringify(value)
                                            : String(value)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } catch (e) {
                              console.error('Error parsing registration data:', e);
                              return <p>Error parsing registration data</p>;
                            }
                          })()}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">System Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Created At</p>
                        <p>{formatDate(patient.createdAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                        <p>{formatDate(patient.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Patient summary information will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Medical records will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="medications">
              <Card>
                <CardHeader>
                  <CardTitle>Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Medication information will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Appointment history will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}