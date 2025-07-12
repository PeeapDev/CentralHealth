"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import PatientSearch from "@/components/widgets/PatientSearch"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"

// Form schema
const formSchema = z.object({
  patientId: z.string().min(1, { message: "Patient is required" }),
  toHospitalId: z.string().min(1, { message: "Receiving hospital is required" }),
  reason: z.string().min(1, { message: "Reason for referral is required" }),
  notes: z.string().optional(),
  priority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]).default("ROUTINE"),
  requiresAmbulance: z.boolean().default(false),
  // referringDoctorId will be set on the server side using the authenticated user
  // or the development user ID in development mode
})

type FormValues = z.infer<typeof formSchema>
// Import the Patient interface from the PatientSearch component
import { Patient as PatientType } from "@/components/widgets/PatientSearch/types"

// Use the imported Patient type
type Patient = PatientType

interface Hospital {
  id: string
  name: string
  subdomain: string
}

export function NewReferralDialog({ hospitalName }: { hospitalName: string }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null)
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      notes: "",
      priority: "ROUTINE",
      requiresAmbulance: false,
    },
  })

  // Load patients and hospitals when dialog opens
  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (open) {
      loadPatients()
      loadHospitals()
    }
  }

  // Load patients from the current hospital
  const loadPatients = async () => {
    try {
      setIsLoadingPatients(true)
      const response = await fetch(`/api/hospitals/${hospitalName}/patients`)
      if (!response.ok) throw new Error('Failed to fetch patients')
      
      const data = await response.json()
      setPatients(data.patients || [])
    } catch (error) {
      console.error("Error loading patients:", error)
      toast.error("Failed to load patients")
    } finally {
      setIsLoadingPatients(false)
    }
  }
    // Load all hospitals except the current one
    const loadHospitals = async () => {
      try {
        setIsLoadingHospitals(true)
        const response = await fetch('/api/hospitals')
        if (!response.ok) throw new Error('Failed to fetch hospitals')
        
        const data = await response.json()
        const allHospitals = data.hospitals || [];
        
        // Find the current hospital
        const current = allHospitals.find(
          (hospital: Hospital) => hospital.subdomain === hospitalName
        );
        
        if (current) {
          setCurrentHospital(current);
        }
        
        // Filter out the current hospital for the receiving hospital dropdown
        const filteredHospitals = allHospitals.filter(
          (hospital: Hospital) => hospital.subdomain !== hospitalName
        )
        setHospitals(filteredHospitals)
      } catch (error) {
        console.error("Error loading hospitals:", error)
        toast.error("Failed to load hospitals")
      } finally {
        setIsLoadingHospitals(false)
      }
    }
  
    // Get formatted patient name
    const getPatientName = (patient: Patient) => {
      try {
        // First try well-formed name fields
        if (patient.firstName && patient.lastName) {
          return `${patient.firstName} ${patient.lastName}`;
        }
        
        // Then try fullName
        if (patient.fullName) {
          return patient.fullName;
        }
        
        // Try original data if available
        if (patient._original) {
          // Try fullName in original
          if (patient._original.fullName) {
            return patient._original.fullName;
          }
          
          // Try User.name in original
          if (patient._original.User?.name) {
            return patient._original.User.name;
          }
          
          // Handle FHIR name objects if present
          const fhirName = patient._original.name;
          if (Array.isArray(fhirName) && fhirName[0]) {
            if (fhirName[0].text) return fhirName[0].text;
            
            const parts = [];
            if (fhirName[0].family) parts.push(fhirName[0].family);
            if (Array.isArray(fhirName[0].given)) parts.push(...fhirName[0].given);
            
            if (parts.length > 0) {
              return parts.join(' ');
            }
          } else if (typeof fhirName === 'string') {
            return fhirName;
          }
        }
        
        // Last resort
        return `Patient ${patient.mrn || 'Unknown'}`;
      } catch (error) {
        return `Patient ${patient.mrn || 'Unknown'}`;
      }
    }
  
    // Submit form
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      console.log('Form data:', values);
      
      // Log the selected patient for debugging
      const selectedPatient = patients.find(p => p.id === values.patientId);
      console.log('Selected patient:', selectedPatient ? {
        id: selectedPatient.id,
        mrn: selectedPatient.mrn
      } : 'Not found');
      
      // Create the API payload
      const apiPayload = {
        patientId: values.patientId,
        toHospitalId: values.toHospitalId,
        reason: values.reason,
        notes: values.notes || "",
        priority: values.priority,
        requiresAmbulance: values.requiresAmbulance,
        referringDoctorId: 'dev_doctor_001' // This will be overridden by the server in production
      };
      
      console.log('Sending referral data:', apiPayload);
      console.log('Sending request to:', `/api/hospitals/${hospitalName}/referrals`);
      
      // Send the API request
      const response = await fetch(`/api/hospitals/${hospitalName}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });
      
      // Parse the response
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid server response format');
      }
      
      // Check if the response was successful
      if (!response.ok) {
        console.error('API error response:', responseData);
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create referral';
        throw new Error(errorMessage);
      }
      
      console.log('Referral created successfully:', responseData);
      
      // Show success message
      toast.success(responseData?.message || "Referral created successfully");
      
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      // Refresh the page to show the new referral
      router.refresh();
    } catch (error: any) {
      console.error('Error creating referral:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create referral");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Referral
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Patient Referral</DialogTitle>
          <DialogDescription>
            Refer a patient to another hospital. Enter the referral details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Display current hospital as referring hospital */}
            <div className="space-y-2">
              <div className="font-medium text-sm">Referring Hospital</div>
              <div className="px-4 py-3 rounded-md bg-muted border">
                <div className="font-medium">
                  {currentHospital?.name || hospitalName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  This referral will be created from your current hospital
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <FormControl>
                    <div className="w-full">
                      <PatientSearch
                        onPatientSelect={(patient) => {
                          // Update form field with patient ID
                          field.onChange(patient.id);
                          
                          // Store selected patient data for display
                          setSelectedPatient(patient);
                          setIsSearching(false);
                        }}
                        fetchPatients={async (searchTerm) => {
                          setIsSearching(true);
                          try {
                            // First try direct MRN lookup if the search term looks like an MRN
                            // Ensure we're using the standard NHS-style 5-character format
                            if (searchTerm.length === 5 && /^[A-Za-z0-9]{5}$/.test(searchTerm)) {
                              try {
                                // Use the centralized patient search API with the MRN parameter
                                // This ensures we're using the proper field (mrn) per CentralHealth requirements
                                const standardizedMrn = searchTerm.toUpperCase();
                                const response = await fetch(`/api/patients/search?medicalId=${encodeURIComponent(standardizedMrn)}`);
                                
                                if (response.ok) {
                                  const responseData = await response.json();
                                  
                                  // Check if we got a valid patient response
                                  if (responseData.success && responseData.patient) {
                                    const patientData = responseData.patient;
                                    // Convert to Patient format
                                    const patient: Patient = {
                                      id: patientData.id,
                                      mrn: patientData.mrn || '', // Use mrn as the standard field
                                      firstName: patientData.name?.split(' ')[0] || '',
                                      lastName: patientData.name?.split(' ').slice(1).join(' ') || '',
                                      fullName: patientData.name || '',
                                      dateOfBirth: patientData.dateOfBirth || patientData.birthDate,
                                      sex: patientData.gender || patientData.sex,
                                      _original: patientData
                                    };
                                    setIsSearching(false);
                                    return [patient];
                                  }
                                }
                              } catch (mrnError) {
                                console.log('MRN direct lookup failed, falling back to search:', mrnError);
                              }
                            }
                            
                            // Fall back to regular search using the centralized patient search API
                            // This ensures consistent handling of patient data across the application
                            const response = await fetch(`/api/patients/search?search=${encodeURIComponent(searchTerm)}`);
                            
                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({}));
                              throw new Error(errorData.message || 'Failed to search patients');
                            }
                            
                            const data = await response.json();
                            setIsSearching(false);
                            return data.patients || [];
                          } catch (error) {
                            console.error('Error searching patients:', error);
                            setIsSearching(false);
                            return [];
                          }
                        }}
                        fetchPatientByMrn={async (mrn) => {
                          setIsSearching(true);
                          try {
                            // Use the centralized patient search API with the medicalId parameter
                            // This ensures we're using the proper field (mrn) per CentralHealth requirements
                            const standardizedMrn = mrn.toUpperCase();
                            const response = await fetch(`/api/patients/search?medicalId=${encodeURIComponent(standardizedMrn)}`);
                            
                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({}));
                              throw new Error(errorData.message || 'Patient not found');
                            }
                            
                            const responseData = await response.json();
                            
                            // Check if we got a valid patient response
                            if (!responseData.success) {
                              throw new Error('Patient not found');
                            }
                            
                            // The API returns a single patient when searching by medicalId
                            const patientData = responseData.patient;
                            
                            // Log the successful result
                            console.log('Found patient with MRN:', patientData?.mrn || 'unknown');
                            
                            setIsSearching(false);
                            
                            // Return a single patient object in the expected format
                            // Ensure we're using mrn as the standard medical ID field per CentralHealth policy
                            return {
                              id: patientData.id,
                              mrn: patientData.mrn || '', // Use mrn as the primary field per CentralHealth policy
                              firstName: patientData.name?.split(' ')[0] || '',
                              lastName: patientData.name?.split(' ').slice(1).join(' ') || '',
                              fullName: patientData.name || '',
                              dateOfBirth: patientData.dateOfBirth || patientData.birthDate,
                              sex: patientData.gender || patientData.sex,
                              _original: patientData
                            };
                          } catch (error) {
                            console.error('Error fetching patient by MRN:', error);
                            // Show a toast notification with the error message
                            toast.error(error instanceof Error ? error.message : 'Failed to fetch patient by MRN');
                            setIsSearching(false);
                            return null;
                          }
                        }}
                        searchPlaceholder="Search by name, medical ID, or scan QR code"
                      />
                    </div>
                  </FormControl>
                  {selectedPatient && (
                    <div className="mt-2 p-2 border rounded-md bg-muted">
                      <div className="font-medium">{selectedPatient.fullName || `${selectedPatient.firstName} ${selectedPatient.lastName}`}</div>
                      <div className="text-xs text-muted-foreground">Medical ID: {selectedPatient.mrn}</div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="toHospitalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiving Hospital</FormLabel>
                  <Select
                    disabled={isLoadingHospitals}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select receiving hospital" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingHospitals ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading hospitals...
                        </div>
                      ) : hospitals.length > 0 ? (
                        hospitals.map((hospital) => (
                          <SelectItem 
                            key={hospital.id} 
                            value={hospital.id}
                          >
                            {hospital.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No hospitals found</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ROUTINE">Routine</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Indicates the urgency of the referral
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Referral</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for this referral"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Required: Specify why this patient is being referred
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Add any additional information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="requiresAmbulance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Ambulance Required
                    </FormLabel>
                    <FormDescription>
                      Check if the patient requires ambulance transport
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Referral'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}