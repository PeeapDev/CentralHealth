'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Bell, Calendar, AlertCircle } from 'lucide-react';

export interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  nextDue: string;
  status: 'upcoming' | 'due' | 'overdue' | 'taken';
}

export default function MedicationReminderMain() {
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // This would typically fetch from an API endpoint
    // For now, we'll use mock data
    const mockReminders: MedicationReminder[] = [
      {
        id: '1',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        nextDue: '08:00 AM',
        status: 'taken',
      },
      {
        id: '2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        nextDue: '01:00 PM',
        status: 'due',
      },
      {
        id: '3',
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily',
        nextDue: '08:00 PM',
        status: 'upcoming',
      },
    ];

    // Simulate API call
    setTimeout(() => {
      setReminders(mockReminders);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleMarkAsTaken = (id: string) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, status: 'taken' } : reminder
      )
    );
  };

  const handleSnooze = (id: string) => {
    // In a real implementation, this would reschedule the reminder
    alert(`Snoozed reminder ${id} for 30 minutes`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return <Badge className="bg-green-100 text-green-800">Taken</Badge>;
      case 'due':
        return <Badge className="bg-yellow-100 text-yellow-800">Due Now</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Medication Reminders</h2>
        <Button size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule View
        </Button>
      </div>

      <div className="grid gap-4">
        {reminders.map((reminder) => (
          <Card key={reminder.id} className="overflow-hidden">
            <CardHeader className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{reminder.name}</CardTitle>
                  <CardDescription>
                    {reminder.dosage} • {reminder.frequency}
                  </CardDescription>
                </div>
                {getStatusBadge(reminder.status)}
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Next dose: {reminder.nextDue}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 py-3 flex gap-2 justify-end">
              {reminder.status !== 'taken' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSnooze(reminder.id)}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Snooze
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleMarkAsTaken(reminder.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Taken
                  </Button>
                </>
              )}
              {reminder.status === 'taken' && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Taken at 08:15 AM
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Button variant="outline">
          View Medication History
        </Button>
      </div>
    </div>
  );
}
