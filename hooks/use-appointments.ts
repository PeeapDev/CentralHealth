"use client";

import { useState, useEffect } from 'react';
import { usePatientData } from './use-patient-data';

export type Appointment = {
  id: number | string;
  title: string;
  doctor: string;
  date: string;
  time: string;
  location: string;
  type: "In-Person" | "Video Call" | "Phone Call";
  status: "confirmed" | "scheduled" | "completed" | "cancelled" | "no-show";
  avatar: string;
};

// Mock function to simulate API data fetch
// In a real implementation, replace this with actual API calls to your backend
async function fetchAppointments(patientId: string): Promise<{
  upcoming: Appointment[];
  past: Appointment[];
}> {
  // This simulates an API call delay
  await new Promise(resolve => setTimeout(resolve, 600));

  return {
    upcoming: [
      {
        id: 1,
        title: "Physical Therapy Session",
        doctor: "Lisa Chen, PT",
        date: "Today",
        time: "2:00 PM - 3:00 PM",
        location: "Room 205 - Therapy Wing",
        type: "In-Person",
        status: "confirmed",
        avatar: "LC",
      },
      {
        id: 2,
        title: "Follow-up Consultation",
        doctor: "Dr. Sarah Johnson",
        date: "Tomorrow",
        time: "10:00 AM - 10:30 AM",
        location: "Room 302A",
        type: "In-Person",
        status: "confirmed",
        avatar: "SJ",
      },
      {
        id: 3,
        title: "Lab Work",
        doctor: "Laboratory Team",
        date: "Oct 18, 2024",
        time: "8:00 AM - 8:30 AM",
        location: "Laboratory - 1st Floor",
        type: "In-Person",
        status: "scheduled",
        avatar: "LT",
      },
      {
        id: 4,
        title: "Cardiology Consultation",
        doctor: "Dr. Michael Roberts",
        date: "Oct 20, 2024",
        time: "3:00 PM - 4:00 PM",
        location: "Cardiology Department",
        type: "Video Call",
        status: "scheduled",
        avatar: "MR",
      },
    ],
    past: [
      {
        id: 5,
        title: "Initial Consultation",
        doctor: "Dr. Sarah Johnson",
        date: "Oct 15, 2024",
        time: "9:00 AM - 10:00 AM",
        location: "Room 302A",
        type: "In-Person",
        status: "completed",
        avatar: "SJ",
      },
      {
        id: 6,
        title: "Chest X-Ray",
        doctor: "Radiology Team",
        date: "Oct 15, 2024",
        time: "2:15 PM - 2:45 PM",
        location: "Radiology - 2nd Floor",
        type: "In-Person",
        status: "completed",
        avatar: "RT",
      },
      {
        id: 7,
        title: "Blood Work",
        doctor: "Laboratory Team",
        date: "Oct 14, 2024",
        time: "7:30 AM - 8:00 AM",
        location: "Laboratory - 1st Floor",
        type: "In-Person",
        status: "completed",
        avatar: "LT",
      },
    ]
  };
}

export function useAppointments() {
  const { patient } = usePatientData();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      if (!patient?.patientId) return;
      
      try {
        setIsLoading(true);
        const { upcoming, past } = await fetchAppointments(patient.patientId);
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
        setError(null);
      } catch (err) {
        console.error("Error loading appointments:", err);
        setError("Failed to load appointment data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    if (patient?.patientId) {
      loadAppointments();
    }
  }, [patient?.patientId]);

  return { upcomingAppointments, pastAppointments, isLoading, error };
}

// In a real implementation, you would add these API functions:
// export async function fetchPatientAppointments(patientId: string): Promise<{ upcoming: Appointment[], past: Appointment[] }> { ... }
// export async function scheduleAppointment(appointment: Appointment): Promise<{ appointmentId: string }> { ... }
// export async function cancelAppointment(appointmentId: string): Promise<{ success: boolean }> { ... }
