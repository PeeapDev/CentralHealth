"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
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
  receivingHospitalId: z.string().min(1, { message: "Receiving hospital is required" }),
  notes: z.string().optional(),
  priority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]).default("ROUTINE"),
  ambulanceRequired: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

interface Patient {
  id: string
  name: any // JSON structure representing name
  medicalNumber: string
  birthDate: string
}

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
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false)
  const router = useRouter()
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      priority: "ROUTINE",
      ambulanceRequired: false,
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
      // Filter out the current hospital
      const filteredHospitals = (data.hospitals || []).filter(
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
      if (typeof patient.name === 'string') {
        return patient.name
      }
      
      // Handle JSON structure for name
      const nameObj = patient.name as any
      if (nameObj.given && nameObj.family) {
        return `${nameObj.given.join(' ')} ${nameObj.family}`
      }
      
      return `Patient ${patient.medicalNumber}`
    } catch (error) {
      return `Patient ${patient.medicalNumber}`
    }
  }

  // Submit form
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/hospitals/${hospitalName}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create referral')
      }
      
      toast.success("Referral created successfully")
      setOpen(false)
      form.reset()
      
      // Refresh the page to show the new referral
      router.refresh()
    } catch (error: any) {
      console.error("Error creating referral:", error)
      toast.error(error.message || "Failed to create referral")
    } finally {
      setIsSubmitting(false)
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
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    disabled={isLoadingPatients}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPatients ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading patients...
                        </div>
                      ) : patients.length > 0 ? (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {getPatientName(patient)}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No patients found</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="receivingHospitalId"
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
                          <SelectItem key={hospital.id} value={hospital.id}>
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
              name="ambulanceRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Ambulance Required</FormLabel>
                    <FormDescription>
                      Check if patient requires ambulance transport
                    </FormDescription>
                  </div>
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
                    <Textarea
                      placeholder="Enter any additional notes or medical information"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include any relevant clinical information or reason for referral
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Referral
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
