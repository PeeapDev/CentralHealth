"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  Save
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Types
interface PatientProfile {
  id: string;
  name: string;
  email: string;
  medicalNumber: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: {
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  photo?: string;
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
  };

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
      setPatient(data);

      // Initialize form data with current values
      setFormData({
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || {
          line: [""],
          city: "",
          state: "",
          postalCode: "",
          country: ""
        }
      });
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setError('Failed to load your profile. Please try again later.');
      // We'll stay on the page and show error instead of redirecting
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Profile component mounted');
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
    <div className="container mx-auto px-4 py-6">
      {/* Back to Dashboard Link */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4"
        onClick={() => router.push('/patient/dashboard')}
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Information Card */}
        <Card className="md:col-span-1">
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
                {patient.medicalNumber ? (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono text-sm py-1">
                      {patient.medicalNumber}
                    </Badge>
                    <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                  </div>
                ) : (
                  <Alert className="mt-2 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No Medical ID assigned yet</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Contact Information Card */}
        <Card className="md:col-span-2">
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
