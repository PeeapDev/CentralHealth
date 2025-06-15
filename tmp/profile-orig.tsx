"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail,
  Phone,
  MapPin,
  Shield,
  Edit,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Save,
  X,
  ExternalLink,
  QrCode,
  Maximize2
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Add type definition for QRCode which will be loaded from CDN
declare global {
  interface Window {
    QRCode: any;
  }
}

// Types
interface PatientProfile {
  id: string;
  name: string;
  email: string;
  medicalNumber: string;
  medicalId?: string;
  phn?: string;
  birthDate: string;
  gender: string;
  phone: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  organDonor?: boolean;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  address: {
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  photo?: string;
  onboardingCompleted?: boolean;
}

// Form data interface for editing
interface FormData {
  email: string;
  phone: string;
  address: {
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export default function PatientProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const qrCodeContainerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    phone: "",
    address: {
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: ""
    }
  });

  // Calculate age from birthdate
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "";
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Format address as a string
  const formatAddress = (address: any) => {
    if (!address) return "No address provided";
    
    try {
      const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
      const line = addressObj.line && addressObj.line.length > 0 ? addressObj.line.join(", ") : "";
      const city = addressObj.city || "";
      const state = addressObj.state || "";
      const postalCode = addressObj.postalCode || "";
      const country = addressObj.country || "";
      
      return [line, city, state, postalCode, country].filter(Boolean).join(", ");
    } catch (e) {
      return typeof address === 'string' ? address : "Invalid address format";
    }
  };;

  // Format name for display
  const formatName = (name: any) => {
    if (!name) return "Unknown";
    
    try {
      const nameData = typeof name === 'string' ? JSON.parse(name) : name;
      const nameObj = Array.isArray(nameData) ? nameData[0] : nameData;
      
      if (nameObj.text) return nameObj.text;
      
      const given = nameObj.given ? nameObj.given.join(' ') : '';
      const family = nameObj.family || '';
      
      return `${given} ${family}`.trim() || "Unknown";
    } catch (e) {
      return typeof name === 'string' ? name : "Unknown";
    }
  };

  // Handle form data changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prevFormData => {
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1];
        if (addressField === 'line') {
          return {
            ...prevFormData,
            address: {
              ...prevFormData.address,
              line: [value]
            }
          };
        } else {
          return {
            ...prevFormData,
            address: {
              ...prevFormData.address,
              [addressField]: value
            }
          };
        }
      } else {
        return {
          ...prevFormData,
          [field]: value
        };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/patients/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Important for sending cookies
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedData = await response.json();
      setPatient(updatedData);
      setEditing(false);
      toast('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch patient data
  const fetchPatientData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching patient data for profile...');
      const response = await fetch('/api/patients/session/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
      });

      console.log('Profile API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication failed, but staying on profile page');
          setError('You are not authenticated. Please login again.');
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Patient data received:', !!data);
      
      // Extract patient from the response
      const patientData = data.patient || data;
      console.log('Patient profile data:', patientData);
      setPatient(patientData);

      // Initialize form data with current values
      setFormData({
        email: patientData.email || "",
        phone: patientData.phone || "",
        address: patientData.address || {
          line: [""],
          city: "",
          state: "",
          postalCode: "",
          country: ""
        }
      });
      
      // Log complete patient data for debugging
      console.log('Patient full data:', {
        id: patientData.id,
        medicalNumber: patientData.medicalNumber || patientData.medicalId || patientData.phn,
        bloodGroup: patientData.bloodGroup,
        emergencyContact: patientData.emergencyContact,
        onboardingStatus: patientData.onboardingCompleted,
        allergies: patientData.allergies,
        chronicConditions: patientData.chronicConditions,
        organDonor: patientData.organDonor
      });
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setError('Failed to load your profile. Please try again later.');
      // We'll stay on the page and show error instead of redirecting
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR code once patient data is loaded
  useEffect(() => {
    if (patient?.medicalId && qrCodeContainerRef.current) {
      // Dynamically load QR code script
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js'
      script.async = true
      
      script.onload = () => {
        if (window.QRCode && qrCodeContainerRef.current) {
          // Clear previous QR code if any
          qrCodeContainerRef.current.innerHTML = ''
          
          // Generate QR code
          window.QRCode.toCanvas(
            qrCodeContainerRef.current,
            `CentralHealth:${patient.medicalId}`,
            {
              width: 120,
              margin: 0,
              color: {
                dark: '#000',
                light: '#fff'
              }
            },
            (error: Error | null) => {
              if (error) console.error('Error generating QR code:', error)
            }
          )
        }
      }
      
      document.body.appendChild(script)
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [patient]);

  useEffect(() => {
    // Fetch patient data on component mount
    async function fetchPatientData() {
      try {
        await fetchPatientData();
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    }
    fetchPatientData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading your profile...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mr-2" onClick={() => fetchPatientData()}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push('/patient/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Show not authenticated state
  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not Authenticated</h1>
          <p className="mt-2">Please log in to view your profile</p>
          <Button className="mr-2 mt-4" onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/patient/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-6 bg-muted/40">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Profile</h1>
        
        {patient.onboardingCompleted && (
          <Badge className="bg-green-500 px-3 py-1">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Onboarding Complete
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Personal Information Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={patient.photo || ""} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-xs">Full Name</Label>
                <p className="font-medium text-lg">{formatName(patient.name)}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-xs">Gender</Label>
                <p>{patient.gender || "Not specified"}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-xs">Date of Birth</Label>
                <p>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : "Not specified"}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-xs">Age</Label>
                <p>{patient.birthDate ? `${calculateAge(patient.birthDate)} years` : "Not specified"}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-xs">Medical ID</Label>
                {patient.medicalNumber || patient.medicalId || patient.phn ? (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-sm font-mono">
                      {patient.medicalNumber || patient.medicalId || patient.phn}
                    </Badge>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Not assigned</p>
                )}
              </div>
              
              {/* QR Code */}
              {patient.medicalId && (
                <div className="pt-3">
                  <Label className="text-muted-foreground text-xs">Patient QR Code</Label>
                  <div className="flex flex-col items-center pt-2 pb-1">
                    <div 
                      ref={qrCodeContainerRef} 
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">Medical ID: {patient.medicalId}</p>
                  </div>
                  <div className="mt-2">
                    <Link href="/patient/health-card">
                      <Button variant="outline" size="sm" className="w-full">
                        <QrCode className="mr-2 h-4 w-4" />
                        View Full Health Card
                        <Maximize2 className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {patient.onboardingCompleted !== undefined && (
                <div>
                  <Label className="text-muted-foreground text-xs">Onboarding Status</Label>
                  <div className="flex items-center space-x-2">
                    {patient.onboardingCompleted ? (
                      <Badge className="bg-green-500">Completed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">In Progress</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Combined Medical Information and Emergency Contact Card */}
        <Card className="md:col-span-9">
          <CardHeader>
            <CardTitle>Medical Information & Emergency Contacts</CardTitle>
            <CardDescription>Your health-related information and emergency contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Medical Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">Blood Group</Label>
                    <p className="font-medium">
                      {patient.bloodGroup ? (
                        <Badge variant="secondary" className="text-base">{patient.bloodGroup}</Badge>
                      ) : "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-xs">Allergies</Label>
                    <div>
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {patient.allergies.map((allergy, index) => (
                            <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">None reported</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-xs">Chronic Conditions</Label>
                    <div>
                      {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {patient.chronicConditions.map((condition, index) => (
                            <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">None reported</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-xs">Organ Donor</Label>
                    <p>
                      {patient.organDonor === true ? (
                        <Badge className="bg-green-500">Yes</Badge>
                      ) : patient.organDonor === false ? (
                        <Badge variant="outline">No</Badge>
                      ) : (
                        "Not specified"
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Emergency Contacts</h3>
                <div className="space-y-4">
                  {patient.emergencyContact ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Contact Name</Label>
                        <p className="font-medium">{patient.emergencyContact.name || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-muted-foreground text-xs">Relationship</Label>
                        <p>{patient.emergencyContact.relationship || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-muted-foreground text-xs">Phone Number</Label>
                        <p className="font-mono">{patient.emergencyContact.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No emergency contact information provided</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Contact Information Card */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Your contact details and address</CardDescription>
            </div>
            
            {!editing ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            ) : (
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <div className="flex items-start">
                  <Mail className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs">Email Address</Label>
                    {!editing ? (
                      <p>{patient.email || "No email provided"}</p>
                    ) : (
                      <Input 
                        value={formData.email} 
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <div className="flex items-start">
                  <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone Number</Label>
                    {!editing ? (
                      <p>{patient.phone || "No phone number provided"}</p>
                    ) : (
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Address */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div className="w-full">
                    <Label className="text-muted-foreground text-xs">Address</Label>
                    {!editing ? (
                      <p>{formatAddress(patient.address) || "No address provided"}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="md:col-span-2">
                          <Label>Street Address</Label>
                          <Input 
                            value={formData.address.line[0] || ""} 
                            onChange={(e) => handleInputChange('address.line', e.target.value)}
                            placeholder="Street address"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>City</Label>
                          <Input 
                            value={formData.address.city} 
                            onChange={(e) => handleInputChange('address.city', e.target.value)}
                            placeholder="City"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>State/Province</Label>
                          <Input 
                            value={formData.address.state} 
                            onChange={(e) => handleInputChange('address.state', e.target.value)}
                            placeholder="State or province"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>Postal Code</Label>
                          <Input 
                            value={formData.address.postalCode} 
                            onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                            placeholder="Postal code"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>Country</Label>
                          <Input 
                            value={formData.address.country} 
                            onChange={(e) => handleInputChange('address.country', e.target.value)}
                            placeholder="Country"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
