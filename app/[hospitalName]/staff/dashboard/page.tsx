"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Clipboard, Activity, Layers } from "lucide-react";
import Link from "next/link";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  specialties?: string[];
  department?: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientMrn: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "canceled";
  type: string;
}

export default function StaffDashboard() {
  const params = useParams<{ hospitalName: string }>();
  const hospitalName = params?.hospitalName || "";
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState<StaffMember | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      
      try {
        // Fetch staff profile data
        const profileResponse = await fetch(`/api/hospitals/${hospitalName}/staff/profile`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch staff profile: ${profileResponse.status}`);
        }
        
        const profileData = await profileResponse.json();
        setStaffInfo(profileData);
        
        // Fetch staff appointments if the API exists
        try {
          const appointmentsResponse = await fetch(`/api/hospitals/${hospitalName}/staff/appointments`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            if (appointmentsData.appointments && Array.isArray(appointmentsData.appointments)) {
              setAppointments(appointmentsData.appointments);
            }
          }
        } catch (appointmentError) {
          console.log("Appointments API may not exist yet:", appointmentError);
          // Use sample data for demonstration
          setAppointments([
            {
              id: "apt-001",
              patientName: "John Smith",
              patientMrn: "AB123",
              date: "2025-06-29",
              time: "09:00 AM",
              status: "scheduled",
              type: "Consultation"
            },
            {
              id: "apt-002",
              patientName: "Emily Johnson",
              patientMrn: "CD456",
              date: "2025-06-29",
              time: "10:30 AM",
              status: "scheduled",
              type: "Follow-up"
            }
          ]);
        }
        
        setError(null);
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setError("Failed to load dashboard data");
        toast({
          title: "Error",
          description: "Could not load your dashboard information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (hospitalName) {
      fetchDashboardData();
    }
  }, [hospitalName, toast]);
  
  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "canceled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === today);
  };
  
  // Calculate upcoming appointments
  const upcomingAppointments = appointments.filter(apt => apt.status === "scheduled");
  const todayAppointments = getTodayAppointments();
  
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 text-xl flex items-center">
          <Activity className="mr-2" />
          {error}
        </div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, {staffInfo?.name || "Staff Member"}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Link href={`/${hospitalName}/staff/wallet`} passHref>
            <Button variant="outline" size="sm">
              Wallet
            </Button>
          </Link>
          <Button size="sm">
            Settings
          </Button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              {todayAppointments.length} appointment(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayAppointments.length > 0 ? 
                `Next: ${todayAppointments[0].time}` : 
                "No appointments"}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {todayAppointments.length > 0 ? 
                `${todayAppointments[0].patientName} - ${todayAppointments[0].type}` : 
                "Your schedule is clear for today"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700 flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Department
            </CardTitle>
            <CardDescription>
              {staffInfo?.specialties?.join(", ") || staffInfo?.department || "General"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffInfo?.role || "Staff"}
            </div>
            <Badge variant="outline" className="mt-1">
              ID: {staffInfo?.id || "Not assigned"}
            </Badge>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Upcoming
            </CardTitle>
            <CardDescription>
              {upcomingAppointments.length} upcoming appointment(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingAppointments.length}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {upcomingAppointments.length > 0 ? 
                "Scheduled appointments" : 
                "No upcoming appointments"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="appointments" className="mt-6">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Upcoming Appointments</CardTitle>
              <CardDescription>
                View and manage your scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clipboard className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-2">No appointments found</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add Appointment
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-700 font-medium">
                                {appointment.patientName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{appointment.patientName}</div>
                            <div className="text-sm text-gray-500">
                              {appointment.date} at {appointment.time} • {appointment.type}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              MRN: {appointment.patientMrn}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="patients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Patient Management</CardTitle>
              <CardDescription>
                View your assigned patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2">Patient section coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Tasks & Notifications</CardTitle>
              <CardDescription>
                Manage your tasks and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2">Tasks section coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
