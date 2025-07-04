import React from 'react';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { format, differenceInDays, isBefore } from 'date-fns';
import Link from 'next/link';
import AntenatalHistory from '@/components/patient/AntenatalHistory';

// Function to get the status badge based on visit status and date
function getStatusBadge(status: string, visitDate: Date) {
  const now = new Date();
  const daysDiff = differenceInDays(visitDate, now);
  
  if (status === 'completed') {
    return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
  }
  
  if (status === 'missed' || (status === 'scheduled' && isBefore(visitDate, now))) {
    return <Badge variant="destructive">Missed</Badge>;
  }
  
  if (daysDiff <= 2) {
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Upcoming</Badge>;
  }
  
  return <Badge variant="outline">Scheduled</Badge>;
}

async function PatientAntenatalDashboard({ params }: { params: { hospitalName: string } }) {
  // Get the current logged-in user
  const session = await auth();
  if (!session || !session.user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p>Please log in to view your antenatal dashboard.</p>
      </div>
    );
  }

  // Get patient information for the current user
  const patient = await prisma.patient.findFirst({
    where: {
      User: {
        id: session.user.id
      }
    },
    include: {
      User: true
    }
  });

  if (!patient) {
    return (
      <div className="flex justify-center items-center h-96">
        <p>No patient profile found. Please contact hospital staff.</p>
      </div>
    );
  }

  // Get antenatal registration
  const antenatalRegistration = await prisma.antenatalRegistration.findFirst({
    where: {
      patientId: patient.id
    },
    include: {
      hospital: true,
      bookingVisit: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get upcoming visits
  const upcomingVisits = await prisma.antenatalVisit.findMany({
    where: {
      patientId: patient.id,
      status: 'scheduled',
      visitDate: {
        gte: new Date()
      }
    },
    include: {
      hospital: true
    },
    orderBy: {
      visitDate: 'asc'
    },
    take: 5
  });
  
  // Get notifications
  const notifications = await prisma.notification.findMany({
    where: {
      patientId: patient.id,
      status: {
        in: ['active', 'scheduled']
      },
      scheduledFor: {
        lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Within next 3 days
      }
    },
    orderBy: {
      scheduledFor: 'asc'
    },
    take: 10
  });

  // Get past visits
  const pastVisits = await prisma.antenatalVisit.findMany({
    where: {
      patientId: patient.id,
      OR: [
        {
          status: 'completed'
        },
        {
          status: 'scheduled',
          visitDate: {
            lt: new Date()
          }
        }
      ]
    },
    include: {
      hospital: true
    },
    orderBy: {
      visitDate: 'desc'
    },
    take: 5
  });

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Antenatal Care Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {patient.name}
          </p>
        </div>

        {antenatalRegistration?.bookingVisit?.edd && (
          <Card className="w-full md:w-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Due Date</p>
                  <p className="font-semibold">
                    {format(new Date(antenatalRegistration.bookingVisit.edd), 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!antenatalRegistration && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 p-2 mt-1">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Not Registered for Antenatal Care</h3>
                <p className="text-amber-700 mt-1">
                  You are not currently registered for antenatal care. Please visit your hospital to register.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Visits
            </CardTitle>
            <CardDescription>Your scheduled antenatal appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingVisits.length > 0 ? (
              <div className="space-y-4">
                {upcomingVisits.map((visit) => (
                  <div key={visit.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(visit.status, visit.visitDate)}
                        <p className="font-medium">{format(visit.visitDate, 'EEEE, MMMM d')}</p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(visit.visitDate, 'p')}</span>
                      </div>
                      <p className="text-sm">{visit.hospital.name}</p>
                      {visit.visitType && <p className="text-xs text-muted-foreground">{visit.visitType}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No upcoming visits scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Reminders & Notifications
            </CardTitle>
            <CardDescription>Important updates about your antenatal care</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border rounded-lg ${
                      differenceInDays(new Date(notification.scheduledFor), new Date()) <= 1
                        ? 'border-amber-200 bg-amber-50'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{notification.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(notification.scheduledFor), 'MMM d')}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No active notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Antenatal History */}
      {antenatalRegistration && (
        <Card>
          <CardHeader>
            <CardTitle>Antenatal History</CardTitle>
            <CardDescription>Your pregnancy journey and medical history</CardDescription>
          </CardHeader>
          <CardContent>
            <AntenatalHistory patientId={patient.id} />
          </CardContent>
        </Card>
      )}

      {/* Past Visits */}
      {pastVisits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Visit History
            </CardTitle>
            <CardDescription>Your previous antenatal appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastVisits.map((visit) => (
                <div key={visit.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(visit.status, visit.visitDate)}
                      <p className="font-medium">{format(visit.visitDate, 'MMMM d, yyyy')}</p>
                    </div>
                    <p className="text-sm">{visit.hospital.name}</p>
                    {visit.notes && <p className="text-sm text-muted-foreground">{visit.notes}</p>}
                  </div>
                  {visit.status === 'completed' && (
                    <Link href={`/${params.hospitalName}/patient-dashboard/antenatal/visits/${visit.id}`}>
                      <Button size="sm" variant="outline" className="ml-2">
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PatientAntenatalDashboard;
