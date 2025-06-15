'use client';

import React, { useState } from 'react';
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
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function CentralAnalytics() {
  const [timeframe, setTimeframe] = useState<string>('month');

  // Mock data for central system analytics
  const adherenceByHospital = [
    { name: 'General Hospital', adherenceRate: 83, patientsCount: 1250 },
    { name: 'Memorial Medical', adherenceRate: 78, patientsCount: 980 },
    { name: 'University Health', adherenceRate: 85, patientsCount: 1420 },
    { name: 'Children\'s Center', adherenceRate: 91, patientsCount: 540 },
    { name: 'Regional Medical', adherenceRate: 76, patientsCount: 890 },
  ];

  const adherenceTrend = [
    { month: 'Jan', systemWide: 79, benchmark: 75 },
    { month: 'Feb', systemWide: 78, benchmark: 75 },
    { month: 'Mar', systemWide: 80, benchmark: 76 },
    { month: 'Apr', systemWide: 82, benchmark: 76 },
    { month: 'May', systemWide: 83, benchmark: 77 },
    { month: 'Jun', systemWide: 85, benchmark: 77 },
  ];

  const medicationCategories = [
    { name: 'Cardiovascular', value: 32, color: '#3b82f6' },
    { name: 'Diabetes', value: 18, color: '#10b981' },
    { name: 'Psychiatric', value: 15, color: '#f59e0b' },
    { name: 'Pain Management', value: 12, color: '#ef4444' },
    { name: 'Antibiotics', value: 8, color: '#8b5cf6' },
    { name: 'Other', value: 15, color: '#6b7280' },
  ];

  const demographicData = [
    { age: '18-30', adherenceRate: 72 },
    { age: '31-45', adherenceRate: 78 },
    { age: '46-60', adherenceRate: 83 },
    { age: '61-75', adherenceRate: 79 },
    { age: '76+', adherenceRate: 68 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Medication Reminder Analytics</h2>
        <div className="flex items-center gap-4">
          <Select
            value={timeframe}
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>System-wide Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">82%</div>
            <div className="text-sm text-muted-foreground mt-1">
              +3% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">5,280</div>
            <div className="text-sm text-muted-foreground mt-1">
              Across all hospitals
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Interventions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-500">342</div>
            <div className="text-sm text-muted-foreground mt-1">
              Staff follow-ups this period
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adherence Trends</CardTitle>
          <CardDescription>
            System-wide medication adherence compared to national benchmark
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adherenceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="systemWide" 
                  name="System-wide Adherence (%)" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="benchmark" 
                  name="National Benchmark (%)" 
                  stroke="#6b7280" 
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Adherence by Hospital</CardTitle>
            <CardDescription>
              Comparing medication adherence rates across facilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={adherenceByHospital}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="adherenceRate" 
                    name="Adherence Rate (%)" 
                    fill="#3b82f6" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Medication Categories</CardTitle>
            <CardDescription>
              Distribution of medications tracked by category
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[350px] w-full max-w-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicationCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {medicationCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
