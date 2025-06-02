"use client"

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription, Form } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useState } from 'react'

// Form schema with validation
const formSchema = z.object({
  bloodGroup: z.string().min(1, "Please select a blood group"),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  organDonor: z.boolean().default(false),
})

type FormData = z.infer<typeof formSchema>

interface HealthInfoFormProps {
  formData: any
  updateFormData: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

export default function HealthInfoForm({ formData, updateFormData, onNext, onPrevious }: HealthInfoFormProps) {
  const [newAllergy, setNewAllergy] = useState("")
  const [newCondition, setNewCondition] = useState("")
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bloodGroup: formData.bloodGroup || '',
      allergies: formData.allergies || [],
      chronicConditions: formData.chronicConditions || [],
      organDonor: formData.organDonor || false,
    },
  })

  const allergies = form.watch('allergies') || []
  const chronicConditions = form.watch('chronicConditions') || []

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      form.setValue('allergies', [...allergies, newAllergy.trim()])
      setNewAllergy("")
    }
  }

  const removeAllergy = (allergy: string) => {
    form.setValue('allergies', allergies.filter(a => a !== allergy))
  }

  const addCondition = () => {
    if (newCondition.trim() && !chronicConditions.includes(newCondition.trim())) {
      form.setValue('chronicConditions', [...chronicConditions, newCondition.trim()])
      setNewCondition("")
    }
  }

  const removeCondition = (condition: string) => {
    form.setValue('chronicConditions', chronicConditions.filter(c => c !== condition))
  }

  function onSubmit(data: FormData) {
    updateFormData(data)
    onNext()
  }

  // Common blood groups
  const bloodGroups = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Health Information</h2>
        <p className="text-muted-foreground">
          This information is important for your medical care
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="bloodGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Group</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bloodGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Allergies</Label>
            <div className="flex space-x-2">
              <Input 
                placeholder="Add an allergy"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAllergy()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addAllergy}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {allergies.map((allergy, index) => (
                <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                  {allergy}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeAllergy(allergy)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {allergies.length === 0 && (
                <p className="text-sm text-muted-foreground">No allergies added</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chronic Conditions</Label>
            <div className="flex space-x-2">
              <Input 
                placeholder="Add a chronic condition"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCondition()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addCondition}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {chronicConditions.map((condition, index) => (
                <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                  {condition}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeCondition(condition)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {chronicConditions.length === 0 && (
                <p className="text-sm text-muted-foreground">No chronic conditions added</p>
              )}
            </div>
          </div>

          <FormField
            control={form.control}
            name="organDonor"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Organ Donor</FormLabel>
                  <FormDescription>
                    I consent to organ donation in case of brain death or cardiac death
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Back
            </Button>
            <Button type="submit">
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
