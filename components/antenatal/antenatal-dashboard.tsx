"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import AntenatalPatientList from "./antenatal-patient-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Dashboard analytics interfaces
interface AntenatalStats {
  totalPatients: number;
  highRiskCount: number;
  trimesterCounts: {
    first: number;
    second: number;
    third: number;
  };
}

// Patient data interface adhering to CentralHealth data handling guidelines
interface AntenatalPatient {
  id: string;
  mrn: string; // Using standard medical record number field
  name: string;
  gestationalAge: number;
  estimatedDeliveryDate: string;
  riskLevel: "low" | "medium" | "high";
  lastCheckup?: string;
  nextAppointment?: string;
  careProvider?: string;
}

export default function AntenatalDashboard() {
  const params = useParams();
  const hospitalName = params?.hospitalName as string;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AntenatalStats>({
    totalPatients: 0,
    highRiskCount: 0,
    trimesterCounts: { first: 0, second: 0, third: 0 }
  });
  
  const [patients, setPatients] = useState<AntenatalPatient[]>([]);
  const [highRiskPatients, setHighRiskPatients] = useState<AntenatalPatient[]>([]);
  
  // Fetch antenatal data on component mount
  useEffect(() => {
    const fetchAntenatalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch antenatal patients from the API
        const response = await fetch(`/api/antenatal`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch antenatal patients: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process patient data
        const processedPatients: AntenatalPatient[] = data.patients.map((patient: any) => ({
          id: patient.id,
          mrn: patient.mrn || patient.medicalNumber || "",
          name: patient.fullName || 
                (typeof patient.name === 'string' ? patient.name : 
                (patient.name?.[0]?.text || 
                 [patient.name?.[0]?.family, ...(patient.name?.[0]?.given || [])].filter(Boolean).join(' ')) || 
                 patient.User?.name || "Unknown"),
          gestationalAge: patient.gestationalAge || 0,
          estimatedDeliveryDate: patient.estimatedDeliveryDate || "",
          riskLevel: patient.riskLevel || "low",
          lastCheckup: patient.lastCheckup,
          nextAppointment: patient.nextAppointment,
          careProvider: patient.careProvider
        }));
        
        // Set all patients
        setPatients(processedPatients);
        
        // Set high risk patients
        const highRisk = processedPatients.filter(p => p.riskLevel === "high");
        setHighRiskPatients(highRisk);
        
        // Calculate stats
        const trimesterCounts = {
          first: processedPatients.filter(p => p.gestationalAge < 14).length,
          second: processedPatients.filter(p => p.gestationalAge >= 14 && p.gestationalAge < 28).length,
          third: processedPatients.filter(p => p.gestationalAge >= 28).length
        };
        
        setStats({
          totalPatients: processedPatients.length,
          highRiskCount: highRisk.length,
          trimesterCounts
        });
        
        setLoading(false);
      } catch (err) {
        setError((err as Error).message || "An unknown error occurred");
        setLoading(false);
      }
    };
    
    fetchAntenatalData();
  }, []);
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Antenatal Dashboard</h2>
          <p className="text-muted-foreground">
            Manage and monitor all antenatal patients for {hospitalName}
          </p>
        </div>
        <Button
          className="mt-4 md:mt-0"
          onClick={() => window.location.href = `/${hospitalName}/admin/antenatal/search`}
        >
          Register New Antenatal Patient
        </Button>
      </div>
      
      <Tabs
        defaultValue="overview"
        className="space-y-4"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk Patients</TabsTrigger>
          <TabsTrigger value="all-patients">All Patients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Antenatal Patients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPatients}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      High Risk Patients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{stats.highRiskCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Patient Trimester Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">1st: {stats.trimesterCounts.first}</Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">2nd: {stats.trimesterCounts.second}</Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700">3rd: {stats.trimesterCounts.third}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {highRiskPatients.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>High Risk Patients Requiring Attention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AntenatalPatientList patients={highRiskPatients.slice(0, 5)} hospitalName={hospitalName} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="high-risk">
          {loading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>High Risk Antenatal Patients</CardTitle>
              </CardHeader>
              <CardContent>
                {highRiskPatients.length > 0 ? (
                  <AntenatalPatientList patients={highRiskPatients} hospitalName={hospitalName} />
                ) : (
                  <p className="text-muted-foreground">No high risk patients at this time.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all-patients">
          {loading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Antenatal Patients</CardTitle>
              </CardHeader>
              <CardContent>
                {patients.length > 0 ? (
                  <AntenatalPatientList patients={patients} hospitalName={hospitalName} />
                ) : (
                  <p className="text-muted-foreground">No antenatal patients registered yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
