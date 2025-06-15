'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function PatientAnalytics({ patientId }: { patientId: string }) {
  // In a real implementation, this would fetch data for the specific patient
  const adherenceRate = 85;
  const missedDoses = 3;
  const onTimeRate = 78;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medication Adherence</CardTitle>
        <CardDescription>
          Patient's medication compliance over the past 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Adherence</span>
              <span className="text-sm font-medium">{adherenceRate}%</span>
            </div>
            <Progress value={adherenceRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On-time Rate</span>
              <span className="text-sm font-medium">{onTimeRate}%</span>
            </div>
            <Progress value={onTimeRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold">{missedDoses}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Missed Doses
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold">4.2</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg. Hours Late
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
