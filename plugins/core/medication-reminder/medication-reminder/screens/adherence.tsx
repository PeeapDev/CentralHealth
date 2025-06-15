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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function AdherenceTracker() {
  // Mock data for adherence tracking
  const weeklyData = [
    { day: 'Mon', adherence: 100 },
    { day: 'Tue', adherence: 100 },
    { day: 'Wed', adherence: 75 },
    { day: 'Thu', adherence: 100 },
    { day: 'Fri', adherence: 50 },
    { day: 'Sat', adherence: 100 },
    { day: 'Sun', adherence: 100 },
  ];

  const monthlyData = [
    { week: 'Week 1', adherence: 92 },
    { week: 'Week 2', adherence: 85 },
    { week: 'Week 3', adherence: 90 },
    { week: 'Week 4', adherence: 78 },
  ];

  const medicationData = [
    { name: 'Lisinopril', adherence: 95, dosesTaken: 28, dosesTotal: 30 },
    { name: 'Metformin', adherence: 82, dosesTaken: 51, dosesTotal: 62 },
    { name: 'Aspirin', adherence: 100, dosesTaken: 30, dosesTotal: 30 },
    { name: 'Atorvastatin', adherence: 90, dosesTaken: 27, dosesTotal: 30 },
  ];

  const calculateWeeklyAdherence = () => {
    const total = weeklyData.length;
    const taken = weeklyData.filter(d => d.adherence === 100).length;
    const partial = weeklyData.filter(d => d.adherence > 0 && d.adherence < 100).length;
    
    return {
      total,
      taken,
      partial,
      missed: total - taken - partial,
      adherenceRate: Math.round((taken + (partial * 0.5)) / total * 100),
    };
  };

  const weeklyStats = calculateWeeklyAdherence();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Medication Adherence</h2>
          <p className="text-muted-foreground">
            Track your medication adherence over time
          </p>
        </div>
        <Select defaultValue="30">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weeklyStats.adherenceRate}%</div>
            <div className="mt-4 h-2">
              <Progress value={weeklyStats.adherenceRate} className="h-2" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground grid grid-cols-3 gap-1">
              <div>Target: 90%</div>
              <div className="text-center">Current: {weeklyStats.adherenceRate}%</div>
              <div className="text-right">{weeklyStats.adherenceRate >= 90 ? '✅' : '⚠️'}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Doses This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold">{weeklyStats.taken}</div>
                <div className="text-xs text-muted-foreground">
                  Doses taken
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{weeklyStats.partial}</div>
                <div className="text-xs text-muted-foreground">
                  Partial
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-500">{weeklyStats.missed}</div>
                <div className="text-xs text-muted-foreground">
                  Missed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">4</div>
              <div className="text-lg">days</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Current streak of perfect adherence days
            </div>
            <div className="mt-4 flex justify-between">
              <div className="text-center">
                <div className="text-xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">
                  Best streak
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">87%</div>
                <div className="text-xs text-muted-foreground">
                  Perfect days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Daily Adherence</CardTitle>
              <CardDescription>
                Your medication adherence for each day of the current week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Adherence']} />
                    <Bar dataKey="adherence" name="Adherence Rate" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Adherence</CardTitle>
              <CardDescription>
                Your medication adherence for each week of the current month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Adherence']} />
                    <Line type="monotone" dataKey="adherence" name="Adherence Rate" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Medication Breakdown</CardTitle>
          <CardDescription>
            Adherence rates for individual medications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {medicationData.map((med) => (
              <div key={med.name} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{med.name}</span>
                  <span className="text-sm">{med.dosesTaken} of {med.dosesTotal} doses taken</span>
                </div>
                <Progress value={med.adherence} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{med.adherence}% adherence</span>
                  <span>{med.adherence >= 90 ? 'Great' : med.adherence >= 75 ? 'Good' : 'Needs improvement'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
