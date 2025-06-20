declare module '@/components/antenatal/antenatal-patient-list' {
  export interface AntenatalPatient {
    id: string;
    name: string;
    age: number;
    gestationalAge: number;
    nextAppointment: string | null;
    riskLevel: "low" | "medium" | "high";
    status: "active" | "completed" | "referred" | "transferred";
    trimester: 1 | 2 | 3;
    imageUrl?: string;
    expectedDueDate?: string | null;
  }

  export interface AntenatalPatientListProps {
    patients: AntenatalPatient[];
    isLoading: boolean;
    hospitalName: string;
  }

  export function AntenatalPatientList(props: AntenatalPatientListProps): JSX.Element;
}
