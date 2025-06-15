'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HospitalAnalytics({ hospitalId }: { hospitalId: string }) {
  // Mock data for hospital-wide adherence analytics
  const monthlyData = [
    { month: 'Jan', adherenceRate: 74, missedDoses: 126, onTimeRate: 68 },
    { month: 'Feb', adherenceRate: 71, missedDoses: 135, onTimeRate: 65 },
    { month: 'Mar', adherenceRate: 76, missedDoses: 118, onTimeRate: 70 },
    { month: 'Apr', adherenceRate: 78, missedDoses: 110, onTimeRate: 72 },
    { month: 'May', adherenceRate: 82, missedDoses: 98, onTimeRate: 75 },
    { month: 'Jun', adherenceRate: 79, missedDoses: 105, onTimeRate: 74 },
  ];

  const departmentData = [
    { name: 'Cardiology', adherenceRate: 84, patientCount: 45 },
    { name: 'Oncology', adherenceRate: 92, patientCount: 37 },
    { name: 'Neurology', adherenceRate: 78, patientCount: 29 },
    { name: 'Geriatrics', adherenceRate: 71, patientCount: 52 },
    { name: 'Pediatrics', adherenceRate: 89, patientCount: 18 },
    { name: 'Psychiatry', adherenceRate: 68, patientCount: 31 },
  ];

  const medicationData = [
    { name: 'Lisinopril', adherenceRate: 82, patientCount: 37 },
    { name: 'Metformin', adherenceRate: 76, patientCount: 29 },
    { name: 'Atorvastatin', adherenceRate: 85, patientCount: 42 },
    { name: 'Levothyroxine', adherenceRate: 91, patientCount: 35 },
    { name: 'Amlodipine', adherenceRate: 79, patientCount: 31 },
    { name: 'Omeprazole', adherenceRate: 73, patientCount: 28 },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Hospital-wide Medication Adherence</CardTitle>
          <CardDescription>
            Tracking patient medication compliance across all departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="adherenceRate" 
                  name="Adherence Rate (%)" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="onTimeRate" 
                  name="On-time Rate (%)" 
                  stroke="#10b981" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="departments">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="medications">By Medication</TabsTrigger>
        </TabsList>
        
        <TabsContent value="departments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Adherence by Department</CardTitle>
              <CardDescription>
                Comparing medication adherence rates across hospital departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="adherenceRate" 
                      name="Adherence Rate (%)" 
                      fill="#3b82f6" 
                    />
                    <Bar 
                      dataKey="patientCount" 
                      name="Patient Count" 
                      fill="#f59e0b" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="medications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Adherence by Medication</CardTitle>
              <CardDescription>
                Comparing adherence rates for different medications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={medicationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="adherenceRate" 
                      name="Adherence Rate (%)" 
                      fill="#3b82f6" 
                    />
                    <Bar 
                      dataKey="patientCount" 
                      name="Patient Count" 
                      fill="#f59e0b" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
