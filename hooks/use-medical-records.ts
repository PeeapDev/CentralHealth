"use client";

import { useState, useEffect } from 'react';
import { usePatientData } from './use-patient-data';
import { Stethoscope, TestTube, Image as ImageIcon, Pill, Scissors } from 'lucide-react';

export type MedicalRecord = {
  id: string;
  type: "Consultation" | "Lab Report" | "Imaging" | "Prescription" | "Surgery";
  title: string;
  doctor: string;
  date: string;
  time: string;
  category: string;
  status: "Completed" | "Pending" | "Processing" | "Canceled";
  summary: string;
  diagnoses: string[];
  icon: any; // Lucide icon component
};

// Mock function to simulate API data fetch
// In a real implementation, replace this with actual API calls to your backend
async function fetchMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
  // This simulates an API call delay
  await new Promise(resolve => setTimeout(resolve, 700));

  return [
    {
      id: "med-001",
      type: "Consultation",
      title: "Cardiology Consultation",
      doctor: "Dr. Michael Roberts",
      date: "Oct 16, 2024",
      time: "10:30 AM",
      category: "Cardiology",
      status: "Completed",
      summary: "Patient shows improvement in cardiac function. Continue current medication regimen.",
      diagnoses: ["Hypertension", "Mild Arrhythmia"],
      icon: Stethoscope,
    },
    {
      id: "med-002",
      type: "Lab Report",
      title: "Complete Blood Count",
      doctor: "Dr. Jennifer Lee",
      date: "Oct 14, 2024",
      time: "8:45 AM",
      category: "Hematology",
      status: "Completed",
      summary: "All values within normal range except slight elevation in white blood cell count.",
      diagnoses: [],
      icon: TestTube,
    },
    {
      id: "med-003",
      type: "Imaging",
      title: "Chest X-Ray",
      doctor: "Dr. Robert Chen",
      date: "Oct 12, 2024",
      time: "2:15 PM",
      category: "Radiology",
      status: "Completed",
      summary: "No abnormalities detected. Lungs clear, heart size normal.",
      diagnoses: [],
      icon: ImageIcon,
    },
    {
      id: "med-004",
      type: "Prescription",
      title: "Medication Renewal",
      doctor: "Dr. Sarah Johnson",
      date: "Oct 18, 2024",
      time: "11:30 AM",
      category: "Pharmacy",
      status: "Processing",
      summary: "Renewal of Lisinopril 10mg daily for blood pressure management.",
      diagnoses: ["Hypertension"],
      icon: Pill,
    },
    {
      id: "med-005",
      type: "Surgery",
      title: "Arthroscopic Procedure",
      doctor: "Dr. Mark Williams",
      date: "Oct 05, 2024",
      time: "9:00 AM",
      category: "Orthopedics",
      status: "Completed",
      summary: "Successful arthroscopic procedure on right knee. No complications.",
      diagnoses: ["Meniscus tear"],
      icon: Scissors,
    },
  ];
}

export function useMedicalRecords() {
  const { patient } = usePatientData();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMedicalRecords() {
      if (!patient?.patientId) return;
      
      try {
        setIsLoading(true);
        const records = await fetchMedicalRecords(patient.patientId);
        setMedicalRecords(records);
        setError(null);
      } catch (err) {
        console.error("Error loading medical records:", err);
        setError("Failed to load medical records. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    if (patient?.patientId) {
      loadMedicalRecords();
    }
  }, [patient?.patientId]);

  return { medicalRecords, isLoading, error };
}

// In a real implementation, you would add these API functions:
// export async function fetchPatientMedicalRecords(patientId: string): Promise<MedicalRecord[]> { ... }
// export async function downloadMedicalRecord(recordId: string): Promise<Blob> { ... }
// export async function requestMedicalRecords(): Promise<{ requestId: string }> { ... }
