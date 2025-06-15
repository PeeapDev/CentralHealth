'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Check, ArrowRight } from 'lucide-react';

const setupSchema = z.object({
  defaultReminders: z.boolean(),
  defaultLeadTime: z.string().min(1),
  notificationMethod: z.enum(['email', 'sms', 'app', 'all']),
  adherenceTracking: z.boolean(),
  allowPatientModification: z.boolean(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function MedicationReminderSetup() {
  const [step, setStep] = useState<number>(1);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      defaultReminders: true,
      defaultLeadTime: '30',
      notificationMethod: 'app',
      adherenceTracking: true,
      allowPatientModification: false,
    },
  });

  const onSubmit = (data: SetupFormValues) => {
    console.log('Setup data:', data);
    setIsComplete(true);
    // Here you would typically save these settings to your backend
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Setup Complete</CardTitle>
          <CardDescription className="text-center">
            The Medication Reminder plugin has been successfully configured
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-10">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-center text-muted-foreground">
            Your configuration has been saved. Patients will now receive medication reminders
            based on your settings.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => window.location.href = '/superadmin/settings/modules'}>
            Return to Modules
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Medication Reminder Setup</CardTitle>
        <CardDescription>
          Configure how medication reminders will work for your hospital
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="defaultReminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Default Reminders
                    </FormLabel>
                    <FormDescription>
                      Automatically set up reminders when medications are prescribed
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="defaultLeadTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Reminder Lead Time (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    How many minutes before the scheduled time to send reminders
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notificationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notification method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="app">App Notification Only</SelectItem>
                      <SelectItem value="all">All Methods</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How patients will be notified about their medications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="adherenceTracking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Track Medication Adherence
                    </FormLabel>
                    <FormDescription>
                      Log and report on whether patients take medications as prescribed
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="allowPatientModification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Allow Patient Modifications
                    </FormLabel>
                    <FormDescription>
                      Let patients update their reminder schedules and preferences
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Save Configuration
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
