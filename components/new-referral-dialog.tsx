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
import { useForm } from "react-hook-form"
import { usePathname } from "next/navigation"

const referralFormSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
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

export function NewReferralDialog() {
  const [open, setOpen] = useState(false)
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
        
        const data = await response.json()
        setHospitals(data)
        
        // Find current hospital
        const current = data.find((h: Hospital) => h.subdomain === hospitalName)
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

  // Fetch patients from current hospital
  useEffect(() => {
    const fetchPatients = async () => {
      if (!currentHospital) return
      
      try {
        setLoading(prev => ({ ...prev, patients: true }))
        const response = await fetch(`/api/hospitals/${hospitalName}/patients`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch patients')
        }
        
        const data = await response.json()
        setPatients(data)
      } catch (error) {
        console.error('Error fetching patients:', error)
      } finally {
        setLoading(prev => ({ ...prev, patients: false }))
      }
    }
    
    if (currentHospital) {
      fetchPatients()
    }
  }, [currentHospital, hospitalName])

  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      patientId: "",
      referringHospitalId: currentHospital ? currentHospital.id : "",
      receivingHospitalId: "",
      priority: "ROUTINE",
      notes: "",
      ambulanceRequired: false,
    },
  })

  function onSubmit(values: ReferralFormValues) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/hospitals/${hospitalName}/referrals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Failed to create referral")
        }

        toast({
          title: "Referral created",
          description: "The referral has been created successfully.",
        })
        
        form.reset()
        setOpen(false)
        
        // Refresh the page to see the new referral
        window.location.reload()
      } catch (error) {
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
          <DialogTitle>Create New Referral</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new patient referral.
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loading.patients ? (
                        <SelectItem value="loading" disabled>
                          Loading patients...
                        </SelectItem>
                      ) : patients.length > 0 ? (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name?.text || patient.medicalNumber || patient.id.substring(0, 6)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No patients found
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
              name="referringHospitalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referring Hospital</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || (currentHospital?.id || '')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select referring hospital" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loading.hospitals ? (
                        <SelectItem value="loading" disabled>
                          Loading hospitals...
                        </SelectItem>
                      ) : hospitals.length > 0 ? (
                        hospitals.map((hospital) => (
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
                          .filter(hospital => hospital.id !== form.getValues('referringHospitalId'))
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
                {isPending ? "Creating..." : "Create Referral"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
