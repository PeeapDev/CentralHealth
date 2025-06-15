"use client";

import { useState, useEffect } from 'react';
import { Patient } from '@/lib/database/models';

export type PatientWalletData = {
  patientId: string;
  balance: number;
  pendingTransactions: number;
  totalSpent: number;
  rewardsPoints: number;
};

export type PatientTransaction = {
  id: string;
  type: "payment" | "deposit" | "refund";
  description: string;
  amount: number;
  date: string;
  time: string;
  status: string;
  reference: string;
  linkedId: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  expiryDate?: string;
  isDefault: boolean;
};

// Mock function to simulate API data fetch
// In a real implementation, replace this with actual API calls
async function fetchPatientData(): Promise<{
  patient: Partial<Patient>;
  walletData: PatientWalletData;
  transactions: PatientTransaction[];
  paymentMethods: PaymentMethod[];
}> {
  // This simulates an API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    patient: {
      patientId: "PT10029374",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("1985-07-12"),
      gender: "male",
      contact: {
        email: "john.doe@example.com",
        phone: "555-123-4567",
        emergencyContact: {
          name: "Jane Doe",
          phone: "555-987-6543",
          relationship: "Spouse"
        },
        address: {
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          zipCode: "62704",
          country: "USA"
        }
      },
      medical: {
        allergies: ["Penicillin", "Peanuts"],
        chronicConditions: ["Hypertension"],
        medications: ["Lisinopril 10mg daily"],
        insuranceInfo: {
          provider: "HealthFirst Insurance",
          policyNumber: "HF-1234567",
          groupNumber: "GRP-987654"
        }
      }
    },
    walletData: {
      patientId: "PT10029374",
      balance: 250.00,
      pendingTransactions: 2,
      totalSpent: 1450.75,
      rewardsPoints: 325
    },
    transactions: [
      { 
        id: "tx-001", 
        description: "Doctor Consultation", 
        date: "Jun 12, 2023", 
        time: "10:30 AM",
        reference: "Dr. Smith",
        linkedId: "APT12345",
        amount: -120.00, 
        status: "Completed", 
        type: "payment" 
      },
      { 
        id: "tx-002", 
        description: "Wallet Fund Deposit", 
        date: "Jun 10, 2023", 
        time: "3:45 PM",
        reference: "Bank Transfer",
        linkedId: "DEP54321",
        amount: 500.00, 
        status: "Completed", 
        type: "deposit" 
      },
      { 
        id: "tx-003", 
        description: "Pharmacy Purchase", 
        date: "Jun 7, 2023", 
        time: "2:15 PM",
        reference: "Medication",
        linkedId: "PHR78965",
        amount: -45.50, 
        status: "Pending", 
        type: "payment" 
      },
      {
        id: "tx-004",
        type: "refund",
        description: "Insurance Refund",
        amount: 175.25,
        date: "Jun 5, 2023",
        time: "11:20 AM",
        status: "Completed",
        reference: "HealthFirst Insurance",
        linkedId: "INS36987"
      }
    ],
    paymentMethods: [
      {
        id: "pm-001",
        name: "Visa ending in 4242",
        expiryDate: "04/26",
        isDefault: true
      },
      {
        id: "pm-002",
        name: "Mastercard ending in 5678",
        expiryDate: "09/25",
        isDefault: false
      },
      {
        id: "pm-003",
        name: "Bank Account - Wells Fargo",
        isDefault: false
      }
    ]
  };
}

export function usePatientData() {
  const [patient, setPatient] = useState<Partial<Patient> | null>(null);
  const [walletData, setWalletData] = useState<PatientWalletData | null>(null);
  const [transactions, setTransactions] = useState<PatientTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatientData() {
      try {
        setIsLoading(true);
        const data = await fetchPatientData();
        setPatient(data.patient);
        setWalletData(data.walletData);
        setTransactions(data.transactions);
        setPaymentMethods(data.paymentMethods);
        setError(null);
      } catch (err) {
        console.error("Error loading patient data:", err);
        setError("Failed to load patient data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPatientData();
  }, []);

  return { patient, walletData, transactions, paymentMethods, isLoading, error };
}

// In a real implementation, you would add these API functions:
// export async function fetchPatientProfile(): Promise<Patient> { ... }
// export async function fetchPatientWallet(): Promise<PatientWalletData> { ... }
// export async function fetchPatientTransactions(): Promise<PatientTransaction[]> { ... }
// export async function fetchPatientPaymentMethods(): Promise<PaymentMethod[]> { ... }
