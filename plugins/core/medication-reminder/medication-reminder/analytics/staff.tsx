'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users } from 'lucide-react';

export default function StaffAnalytics() {
  // Mock data for staff view - would come from API in real implementation
  const patientAlerts = [
    {
      id: '1',
      patientName: 'John Doe',
      patientId: '12345',
      medicationName: 'Lisinopril',
      issueType: 'missed',
      missedDoses: 3,
      lastTaken: '2025-06-10',
      risk: 'high',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientId: '23456',
      medicationName: 'Metformin',
      issueType: 'irregular',
      missedDoses: 1,
      lastTaken: '2025-06-11',
      risk: 'medium',
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      patientId: '34567',
      medicationName: 'Warfarin',
      issueType: 'missed',
      missedDoses: 2,
      lastTaken: '2025-06-09',
      risk: 'high',
    },
  ];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      default:
        return <Badge variant="outline">{risk}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Non-Adherence Alerts</CardTitle>
            <CardDescription>
              Patients requiring follow-up due to medication adherence issues
            </CardDescription>
          </div>
          <Button size="sm">
            <AlertCircle className="mr-2 h-4 w-4" />
            View All Alerts
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="font-medium">{alert.patientName}</div>
                    <div className="text-xs text-muted-foreground">ID: {alert.patientId}</div>
                  </TableCell>
                  <TableCell>{alert.medicationName}</TableCell>
                  <TableCell>
                    <div>
                      {alert.issueType === 'missed' 
                        ? `${alert.missedDoses} missed doses` 
                        : 'Irregular timing'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last taken: {alert.lastTaken}
                    </div>
                  </TableCell>
                  <TableCell>{getRiskBadge(alert.risk)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">Contact</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Adherence Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">76%</div>
                <div className="text-xs text-muted-foreground">Overall adherence rate</div>
              </div>
              <div className="text-muted-foreground">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">142</div>
                <div className="text-xs text-muted-foreground">Patients on medication plans</div>
              </div>
              <div className="text-muted-foreground">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-500">12</div>
                <div className="text-xs text-muted-foreground">Patients requiring intervention</div>
              </div>
              <div className="text-red-500">
                <AlertCircle className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
