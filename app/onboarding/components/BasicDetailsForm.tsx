"use client"

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Form schema with validation - only for address information
// Since we already collected personal info during registration
const formSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  district: z.string().min(2, "District must be at least 2 characters"),
  postalCode: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof formSchema>

interface BasicDetailsFormProps {
  formData: any
  updateFormData: (data: any) => void
  onNext: () => void
}

export default function BasicDetailsForm({ formData, updateFormData, onNext }: BasicDetailsFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: formData.address || '',
      city: formData.city || '',
      district: formData.district || '',
      postalCode: formData.postalCode || '',
    },
  })

  function onSubmit(values: FormData) {
    updateFormData(values)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Residential Address</h2>
        <p className="text-muted-foreground">
          Please provide your current residential address information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Freetown" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="western-area-urban">Western Area Urban</SelectItem>
                    <SelectItem value="western-area-rural">Western Area Rural</SelectItem>
                    <SelectItem value="eastern-province">Eastern Province</SelectItem>
                    <SelectItem value="northern-province">Northern Province</SelectItem>
                    <SelectItem value="southern-province">Southern Province</SelectItem>
                    <SelectItem value="north-west-province">North West Province</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Postal code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button type="submit" className="w-full">Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
