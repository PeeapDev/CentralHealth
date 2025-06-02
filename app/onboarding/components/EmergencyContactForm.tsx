"use client"

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form'

// Form schema with validation
const formSchema = z.object({
  emergencyContactName: z.string().min(2, "Contact name must be at least 2 characters"),
  emergencyContactRelationship: z.string().min(1, "Please select a relationship"),
  emergencyContactPhone: z.string().min(8, "Phone number must be at least 8 digits"),
})

type FormData = z.infer<typeof formSchema>

interface EmergencyContactFormProps {
  formData: any
  updateFormData: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

export default function EmergencyContactForm({ formData, updateFormData, onNext, onPrevious }: EmergencyContactFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emergencyContactName: formData.emergencyContactName || '',
      emergencyContactRelationship: formData.emergencyContactRelationship || '',
      emergencyContactPhone: formData.emergencyContactPhone || '',
    },
  })

  function onSubmit(data: FormData) {
    updateFormData(data)
    onNext()
  }

  // Common relationships
  const relationships = [
    "Spouse", "Parent", "Child", "Sibling", "Friend", "Other Family", "Caregiver", "Guardian"
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Emergency Contact</h2>
        <p className="text-muted-foreground">
          Who should we contact in case of an emergency?
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactRelationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationships.map(relation => (
                      <SelectItem key={relation} value={relation.toLowerCase()}>{relation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+123456789" {...field} />
                </FormControl>
                <FormMessage />
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
