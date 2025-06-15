'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Calendar as CalendarIcon, Plus } from 'lucide-react';

export default function MedicationSchedule() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<string>("day");
  
  // Mock medication schedule data
  const schedule = [
    { id: '1', time: '08:00 AM', name: 'Lisinopril', dosage: '10mg', instructions: 'Take with food', status: 'taken' },
    { id: '2', time: '08:00 AM', name: 'Aspirin', dosage: '81mg', instructions: 'Take with water', status: 'taken' },
    { id: '3', time: '01:00 PM', name: 'Metformin', dosage: '500mg', instructions: 'Take with lunch', status: 'upcoming' },
    { id: '4', time: '08:00 PM', name: 'Atorvastatin', dosage: '20mg', instructions: 'Take with dinner', status: 'upcoming' },
    { id: '5', time: '10:00 PM', name: 'Melatonin', dosage: '3mg', instructions: 'Take before bed', status: 'upcoming' },
  ];
  
  // Group medications by time
  const scheduleByTime = schedule.reduce((groups, medication) => {
    const timeKey = medication.time;
    if (!groups[timeKey]) {
      groups[timeKey] = [];
    }
    groups[timeKey].push(medication);
    return groups;
  }, {} as Record<string, typeof schedule>);

  const timeBlocks = Object.entries(scheduleByTime).map(([time, medications]) => ({
    time,
    medications,
    status: medications.every(m => m.status === 'taken') 
      ? 'taken' 
      : medications.some(m => m.status === 'taken') 
        ? 'partial' 
        : 'upcoming'
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return <Badge className="bg-green-100 text-green-800">Taken</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Medication Schedule</h2>
          <p className="text-muted-foreground">
            Manage and view your scheduled medications
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Medication
        </Button>
      </div>

      <div className="grid md:grid-cols-[250px_1fr] gap-6">
        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(day) => day && setDate(day)}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">All medications taken</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Partially taken</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Upcoming doses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>{formatDate(date)}</CardTitle>
              <Tabs defaultValue="day" value={view} onValueChange={setView}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timeBlocks.map(block => (
                <div key={block.time} className="relative pl-8 border-l-2 border-muted pb-6 last:pb-0">
                  <div className="absolute left-[-9px] top-0 rounded-full bg-background border-2 border-muted p-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{block.time}</div>
                    {getStatusBadge(block.status)}
                  </div>
                  <div className="space-y-3">
                    {block.medications.map(medication => (
                      <div key={medication.id} className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/medications/${medication.name.toLowerCase().replace(/\s/g, '-')}.png`} alt={medication.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {medication.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{medication.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {medication.dosage} • {medication.instructions}
                          </div>
                        </div>
                        {medication.status !== 'taken' ? (
                          <Button size="sm">Mark as Taken</Button>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            ✓ Taken
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {timeBlocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No medications scheduled</h3>
                  <p className="text-muted-foreground max-w-xs mt-2">
                    There are no medications scheduled for this day or you haven't been prescribed any medications yet.
                  </p>
                  <Button className="mt-4">Add Medication</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
