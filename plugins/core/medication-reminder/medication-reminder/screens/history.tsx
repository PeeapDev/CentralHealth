'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function MedicationHistory() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [medicationFilter, setMedicationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Mock medication history data
  const historyData = [
    { 
      id: '1',
      medication: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '2025-06-12 08:00 AM',
      takenTime: '2025-06-12 08:15 AM',
      status: 'taken',
      note: 'Taken with breakfast'
    },
    { 
      id: '2',
      medication: 'Metformin',
      dosage: '500mg',
      scheduledTime: '2025-06-11 01:00 PM',
      takenTime: '2025-06-11 01:30 PM',
      status: 'taken',
      note: ''
    },
    { 
      id: '3',
      medication: 'Atorvastatin',
      dosage: '20mg',
      scheduledTime: '2025-06-11 08:00 PM',
      takenTime: '2025-06-11 08:05 PM',
      status: 'taken',
      note: ''
    },
    { 
      id: '4',
      medication: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '2025-06-11 08:00 AM',
      takenTime: '2025-06-11 08:10 AM',
      status: 'taken',
      note: ''
    },
    { 
      id: '5',
      medication: 'Metformin',
      dosage: '500mg',
      scheduledTime: '2025-06-10 01:00 PM',
      takenTime: null,
      status: 'missed',
      note: 'Was in a meeting'
    },
    { 
      id: '6',
      medication: 'Atorvastatin',
      dosage: '20mg',
      scheduledTime: '2025-06-10 08:00 PM',
      takenTime: '2025-06-10 09:45 PM',
      status: 'late',
      note: 'Forgot until bedtime'
    },
    { 
      id: '7',
      medication: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '2025-06-10 08:00 AM',
      takenTime: '2025-06-10 08:05 AM',
      status: 'taken',
      note: ''
    },
  ];

  // Get unique medication names for filter
  const medications = ['all', ...new Set(historyData.map(item => item.medication))];
  
  // Filter history data based on search and filters
  const filteredHistory = historyData.filter(item => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      item.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.note.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Medication filter
    const matchesMedication = medicationFilter === 'all' || item.medication === medicationFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesMedication && matchesStatus;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return <Badge className="bg-green-100 text-green-800">Taken</Badge>;
      case 'missed':
        return <Badge className="bg-red-100 text-red-800">Missed</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Medication History</h2>
        <p className="text-muted-foreground">
          View your complete medication history and adherence records
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medications or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select
          value={medicationFilter}
          onValueChange={setMedicationFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by medication" />
          </SelectTrigger>
          <SelectContent>
            {medications.map((med) => (
              <SelectItem key={med} value={med}>
                {med === 'all' ? 'All Medications' : med}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="taken">Taken</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline">Export</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Taken</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.medication}</div>
                    <div className="text-xs text-muted-foreground">{item.dosage}</div>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(item.scheduledTime)}
                  </TableCell>
                  <TableCell>
                    {item.takenTime ? formatDateTime(item.takenTime) : '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.note || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredHistory.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setMedicationFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
