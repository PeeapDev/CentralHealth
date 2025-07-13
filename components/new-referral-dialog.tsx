"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { usePathname } from "next/navigation"
import ConnectedPatientSearch from "@/components/widgets/ConnectedPatientSearch"
import { saveReferral, PatientReferral, ReferralPriority, ReferralStatus } from "@/utils/referral-utils"

const referralFormSchema = z.object({
  patient: z.object({
    id: z.string(),
    medicalNumber: z.string().optional(),
    name: z.string(),
    photo: z.string().optional()
  }).refine(data => !!data.id, {
    message: "Patient is required",
    path: ["id"],
  }),
  referringHospitalId: z.string().min(1, "Referring hospital is required"),
  receivingHospitalId: z.string().min(1, "Receiving hospital is required"),
  priority: z.enum(["ROUTINE", "PRIORITY", "URGENT"]),
  notes: z.string().optional(),
  ambulanceRequired: z.boolean().default(false),
})

type ReferralFormValues = z.infer<typeof referralFormSchema>

type Hospital = {
  id: string;
  name: string;
  subdomain: string;
}

type Patient = {
  id: string;
  name: any;
  medicalNumber?: string;
}

interface NewReferralDialogProps {
  initialPatient?: {
    id: string;
    name: string;
    medicalNumber?: string;
    photo?: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReferralCreated?: (referral: any) => void;
}

export function NewReferralDialog({ open: externalOpen, onOpenChange, initialPatient, onReferralCreated }: NewReferralDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use either external or internal state management
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen;
  const pathname = usePathname()
  const hospitalName = pathname ? pathname.split('/')[1] : ''
  const [isPending, startTransition] = useTransition()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState({
    hospitals: false,
    patients: false
  })
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null)

  // Fetch all hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(prev => ({ ...prev, hospitals: true }))
        const response = await fetch('/api/hospitals')
        
        if (!response.ok) {
          throw new Error('Failed to fetch hospitals')
        }
        
        const responseData = await response.json()
        // Ensure data is an array before using array methods
        const hospitalsArray = Array.isArray(responseData) ? responseData : 
                              (responseData && responseData.hospitals && Array.isArray(responseData.hospitals)) ? 
                              responseData.hospitals : [];
        
        // Log data structure to help debug
        console.log('Hospital data structure:', { 
          isArray: Array.isArray(responseData),
          hasHospitalsProperty: responseData && typeof responseData === 'object' && 'hospitals' in responseData,
          hospitalsLength: hospitalsArray.length 
        })
        
        setHospitals(hospitalsArray)
        
        // Find current hospital
        const current = hospitalsArray.find((h: Hospital) => h && h.subdomain === hospitalName)
        if (current) {
          setCurrentHospital(current)
        }
      } catch (error) {
        console.error('Error fetching hospitals:', error)
      } finally {
        setLoading(prev => ({ ...prev, hospitals: false }))
      }
    }
    
    fetchHospitals()
  }, [hospitalName])

  // We don't need to pre-fetch patients anymore - the PatientSearchWidget will handle this
  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      patient: initialPatient ? {
        id: initialPatient.id,
        name: initialPatient.name,
        medicalNumber: initialPatient.medicalNumber || "",
        photo: initialPatient.photo || ""
      } : {
        id: "",
        name: "",
        medicalNumber: "",
        photo: ""
      },
      referringHospitalId: currentHospital?.id || "",
      receivingHospitalId: "",
      priority: "ROUTINE",
      notes: "",
      ambulanceRequired: false,
    },
  })

  // Using the standardized referral utilities imported at the top

  // Form submission handler
  function onSubmit(values: ReferralFormValues) {
    startTransition(async () => {
      try {
        // Ensure we have a valid patient
        if (!values.patient?.id) {
          toast({
            title: "Error",
            description: "Please select a valid patient",
            variant: "destructive",
          })
          return
        }
        
        // Get the receiving hospital name
        const receivingHospital = hospitals.find(h => h.id === values.receivingHospitalId);
        if (!receivingHospital) {
          toast({
            title: "Error",
            description: "Please select a valid receiving hospital",
            variant: "destructive",
          })
          return
        }
        
        // According to CentralHealth policies, we must preserve the medical ID
        // and never generate a new one for existing patients
        const newReferral: PatientReferral = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          referralCode: '', // Will be generated by saveReferral
          patientId: values.patient.id,
          patientName: values.patient.name,
          mrn: values.patient.medicalNumber || '', // Use mrn as the standard field for medical IDs
          referringHospitalId: values.referringHospitalId,
          referringHospitalName: currentHospital?.name || currentHospital?.subdomain || '',
          receivingHospitalId: values.receivingHospitalId,
          receivingHospitalName: receivingHospital.name || receivingHospital.subdomain || '',
          priority: values.priority as ReferralPriority,
          status: 'PENDING' as ReferralStatus,
          notes: values.notes,
          reason: values.notes || 'Patient referral', // Using notes as reason, with fallback
          requiresAmbulance: values.ambulanceRequired,
          statusHistory: [{
            from: '',
            to: 'PENDING',
            timestamp: new Date().toISOString()
          }]
        }
        
        console.log('Creating new referral:', newReferral);
        
        // Save using the standardized utility function
        const savedReferral = saveReferral(newReferral);
        
        toast({
          title: "Success",
          description: "Referral created successfully",
        })
        
        // Close the dialog and reset form
        setOpen(false)
        form.reset()
        
        // Dispatch a custom event to notify that a referral has been created
        // This will trigger the event listener in the referral page
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('referralCreated', { detail: savedReferral });
          window.dispatchEvent(event);
        }
        
        // Call the callback if provided
        if (onReferralCreated) {
          onReferralCreated(savedReferral)
        }
      } catch (error) {
        console.error('Error creating referral:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create referral",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Create New Referral
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {initialPatient ? `Refer Patient: ${initialPatient.name}` : 'Create New Referral'}
          </DialogTitle>
          <DialogDescription>
            {initialPatient 
              ? `Complete the referral details for this patient.` 
              : 'Fill in the details to create a new patient referral.'}
          </DialogDescription>
          {/* Add prominent referring hospital display */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm font-medium text-blue-700">Referring Hospital</div>
            <div className="text-base font-semibold text-blue-900">{currentHospital?.name || currentHospital?.subdomain || 'Current Hospital'}</div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patient"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2">
                  <FormLabel>Patient Information</FormLabel>
                  
                  {initialPatient ? (
                    /* If patient is pre-selected from profile, show prominently with fixed styling */
                    <div className="px-4 py-3 rounded-md bg-blue-50 border border-blue-200">
                      <div className="font-medium text-blue-900 text-base">{initialPatient.name}</div>
                      {initialPatient.medicalNumber && (
                        <div className="text-sm text-blue-700 font-mono">
                          Medical ID: <span className="font-semibold">{initialPatient.medicalNumber}</span>
                          <span className="ml-1 text-xs">• permanent</span>
                        </div>
                      )}
                      <div className="text-xs text-blue-600 mt-2">Patient selected from profile</div>
                    </div>
                  ) : (
                    /* If no pre-selected patient, show search field */
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="patient"
                        render={({ field: controllerField }) => (
                          <ConnectedPatientSearch
                            searchPlaceholder="Search by name, medical ID, or scan QR code"
                            onPatientSelect={(patient) => {
                              console.log('Selected patient:', patient)
                              controllerField.onChange({
                                id: patient.id,
                                name: `${patient.firstName} ${patient.lastName}`.trim(),
                                medicalNumber: patient.mrn,
                                photo: patient.photo
                              })
                            }}
                            showQrScanner={true}
                            className="w-full"
                          />
                        )}
                      />
                    </FormControl>
                  )}
                  
                  {/* Show selected patient details when available and NOT from pre-selection */}
                  {!initialPatient && field.value?.id && (
                    <div className="px-3 py-2 rounded-md bg-muted flex items-center">
                      <div className="flex-1">
                        <div className="font-medium">{field.value.name}</div>
                        {field.value.medicalNumber && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Medical ID: <span className="font-semibold">{field.value.medicalNumber}</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          form.setValue('patient', {
                            id: "",
                            name: "",
                            medicalNumber: "",
                            photo: ""
                          })
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Referring hospital is now displayed in the dialog header */}
            <FormField
              control={form.control}
              name="receivingHospitalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiving Hospital</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select receiving hospital" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loading.hospitals ? (
                        <SelectItem value="loading" disabled>
                          Loading hospitals...
                        </SelectItem>
                      ) : hospitals.length > 0 ? (
                        hospitals
                          .filter(hospital => hospital.id !== currentHospital?.id) // Filter out the current hospital
                          .map((hospital) => (
                            <SelectItem key={hospital.id} value={hospital.id}>
                              {hospital.name || hospital.subdomain}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No hospitals found
                        </SelectItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ROUTINE">Routine</SelectItem>
                      <SelectItem value="PRIORITY">Priority</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter any additional notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ambulanceRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Ambulance Required</FormLabel>
                    <FormDescription>
                      Check if the patient requires ambulance transport
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : initialPatient ? "Complete Referral" : "Create Referral"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
