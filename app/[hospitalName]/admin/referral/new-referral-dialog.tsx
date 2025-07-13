"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { saveReferral, PatientReferral, generateReferralCode } from "@/utils/referral-utils"
import ConnectedPatientSearch from "@/components/widgets/ConnectedPatientSearch"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { Patient as PatientSearchResult } from "@/components/widgets/PatientSearch/types"

// Form schema
const formSchema = z.object({
  patientId: z.string().min(1, { message: "Patient is required" }),
  toHospitalId: z.string().min(1, { message: "Receiving hospital is required" }),
  reason: z.string().min(1, { message: "Reason for referral is required" }),
  notes: z.string().optional(),
  priority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]).default("ROUTINE"),
  requiresAmbulance: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>
type Patient = PatientSearchResult

interface Hospital {
  id: string
  name: string
  subdomain: string
}

export function NewReferralDialog({ hospitalName }: { hospitalName: string }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null)
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      toHospitalId: "",
      priority: "ROUTINE",
      notes: "",
      reason: "",
      requiresAmbulance: false,
    },
  })

  const loadHospitals = async () => {
    try {
      setIsLoadingHospitals(true)
      const response = await fetch("/api/hospitals")
      if (!response.ok) throw new Error("Failed to fetch hospitals")

      const data = await response.json()
      const allHospitals: Hospital[] = data.hospitals || []

      const current = allHospitals.find(
        (hospital: Hospital) => hospital.subdomain === hospitalName
      )

      if (current) {
        setCurrentHospital(current)
      }

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

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (open && hospitals.length === 0) {
      loadHospitals()
    }
  }

  const getPatientName = (patient: Patient | null) => {
    if (!patient) return ""
    try {
      if (patient.firstName && patient.lastName) {
        return `${patient.firstName} ${patient.lastName}`.trim()
      }
      if (patient.fullName) {
        return patient.fullName.trim()
      }
      return `Patient ID: ${patient.id}`
    } catch (e) {
      console.error("Error formatting patient name:", e)
      return "Unknown Patient"
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!selectedPatient || !currentHospital) {
      toast.error("A patient and a referring hospital must be selected.")
      return
    }

    setIsSubmitting(true)
    toast.info("Creating referral...")

    const receivingHospital = hospitals.find((h) => h.id === values.toHospitalId)
    if (!receivingHospital) {
      toast.error("Selected receiving hospital not found.")
      setIsSubmitting(false)
      return
    }

    const newReferral: Omit<PatientReferral, "updatedAt" | "statusHistory"> = {
      id: `local-${Date.now()}`,
      patientId: selectedPatient.id,
      mrn: selectedPatient.mrn,
      patientName: getPatientName(selectedPatient),
      referringHospitalId: currentHospital.id,
      referringHospitalName: currentHospital.name,
      receivingHospitalId: values.toHospitalId,
      receivingHospitalName: receivingHospital.name,
      reason: values.reason,
      priority: values.priority,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      notes: values.notes,
      requiresAmbulance: values.requiresAmbulance,
      referralCode: generateReferralCode(),
    }

    try {
      // Try to save to localStorage and get the result
      try {
        const savedReferral = saveReferral(newReferral as PatientReferral)
        
        // Show explicit success message for localStorage save
        toast.success(`Referral ${savedReferral.referralCode} successfully saved to local storage.`)

        // Dispatch events to update UI components
        window.dispatchEvent(new CustomEvent("referralUpdated"))
        window.dispatchEvent(new Event("storage"))
      } catch (err) {
        const storageError = err as Error
        console.error('Failed to save referral to local storage:', storageError)
        toast.error(`Failed to save referral locally: ${storageError.message || 'Unknown error'}`)
        // Don't attempt server sync if local save failed
        setIsSubmitting(false)
        return
      }

      // Show immediate feedback that the local save was successful
      toast.success("Referral created successfully and saved locally!")
      
      // Wait 1 second to ensure the toast notification is visible before attempting server sync
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Now try to sync with server
      try {
        const response = await fetch(`/api/hospitals/${hospitalName}/referrals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReferral),
        })
        
        if (!response.ok) {
          // console.error("API Error: Failed to save referral to server.")
          toast.warning("Referral saved locally, but failed to sync with server.")
        } else {
          toast.success("Referral successfully synced with server!")
        }
      } catch (error) {
        console.error("API Fetch Error:", error)
        toast.warning("Referral saved locally, but a network error occurred when syncing to server.")
      }
      
      // Wait another second to ensure all toast notifications are visible
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form and close dialog only after all operations are complete
      form.reset()
      setSelectedPatient(null)
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error("Error creating referral:", error)
      toast.error("Failed to create referral. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePatientSelect = (patient: Patient | null) => {
    if (patient) {
      setSelectedPatient(patient)
      form.setValue("patientId", patient.id, { shouldValidate: true })
    } else {
      setSelectedPatient(null)
      form.setValue("patientId", "", { shouldValidate: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Referral
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Referral</DialogTitle>
          <DialogDescription>
            Fill out the form to create a new patient referral.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <FormControl>
                    <div>
                      <ConnectedPatientSearch onPatientSelect={handlePatientSelect} />
                      {selectedPatient && (
                        <div className="mt-2 text-sm text-gray-600 border p-2 rounded-md bg-muted">
                          Selected: {getPatientName(selectedPatient)} (MRN:{" "}
                          {selectedPatient.mrn})
                        </div>
                      )}
                    </div>
                  </FormControl>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingHospitals}>
                        <SelectValue placeholder="Select a hospital" />
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
                        <div className="p-2 text-sm text-muted-foreground">
                          No hospitals found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Create Referral
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default NewReferralDialog;
