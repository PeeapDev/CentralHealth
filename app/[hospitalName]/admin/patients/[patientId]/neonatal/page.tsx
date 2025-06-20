"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeonatalForm } from "@/components/neonatal/neonatal-form";
import { Badge } from "@/components/ui/badge";

export default function NeonatalPage() {
  const params = useParams();
  const hospitalName = params?.hospitalName as string;
  const patientId = params?.patientId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [neonatalData, setNeonatalData] = useState<any>(null);
  
  // Fetch patient data on component mount
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch basic patient info
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        
        if (!patientResponse.ok) {
          throw new Error(`Failed to fetch patient: ${patientResponse.status}`);
        }
        
        const patientResult = await patientResponse.json();
        setPatientData(patientResult);
        
        // Fetch neonatal plugin data
        const neonatalResponse = await fetch(`/api/patients/${patientId}/plugin-data?pluginName=neonatal`);
        
        if (!neonatalResponse.ok) {
          // If no data exists yet, we'll start with empty data
          if (neonatalResponse.status === 404) {
            setNeonatalData({});
          } else {
            throw new Error(`Failed to fetch neonatal data: ${neonatalResponse.status}`);
          }
        } else {
          const neonatalResult = await neonatalResponse.json();
          setNeonatalData(neonatalResult.data || {});
        }
      } catch (err) {
        setError((err as Error).message);
        console.error("Error fetching patient data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId, hospitalName]);
  
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }
  
  const patientName = patientData?.name?.text || "Patient";

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Neonatal Care: {patientName}
        </h1>
        <p className="text-muted-foreground">
          MRN: {patientData?.medicalNumber || "Unknown"} • DOB: {patientData?.birthDate ? new Date(patientData.birthDate).toLocaleDateString() : "Unknown"}
        </p>
      </div>
      
      {neonatalData?.nicuAdmission && (
        <div className="mb-4">
          <Badge variant="destructive">NICU Admission</Badge>
        </div>
      )}
      
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="birth-details">Birth Details</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Birth Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Birth Date/Time:</dt>
                    <dd>{neonatalData?.birthDateTime ? new Date(neonatalData.birthDateTime).toLocaleString() : "Not recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Delivery Type:</dt>
                    <dd>{neonatalData?.deliveryType || "Not recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Birth Weight:</dt>
                    <dd>{neonatalData?.birthWeight ? `${neonatalData.birthWeight} g` : "Not recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Apgar Score:</dt>
                    <dd>{neonatalData?.apgarScores ? `${neonatalData.apgarScores.oneMinute}/10, ${neonatalData.apgarScores.fiveMinutes}/10` : "Not recorded"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Initial Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                {neonatalData?.initialAssessment ? (
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Jaundice:</dt>
                      <dd>{neonatalData.initialAssessment.jaundice ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Reflexes:</dt>
                      <dd>{neonatalData.initialAssessment.reflexesNormal ? "Normal" : "Abnormal"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Respiratory Rate:</dt>
                      <dd>{neonatalData.initialAssessment.respiratoryRate ? `${neonatalData.initialAssessment.respiratoryRate} bpm` : "Not recorded"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Heart Rate:</dt>
                      <dd>{neonatalData.initialAssessment.heartRate ? `${neonatalData.initialAssessment.heartRate} bpm` : "Not recorded"}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-muted-foreground">No assessment recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mother Information</CardTitle>
            </CardHeader>
            <CardContent>
              {neonatalData?.motherInfo ? (
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Mother's ID:</dt>
                    <dd>{neonatalData.motherInfo.motherId || "Not linked"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Mother's Name:</dt>
                    <dd>{neonatalData.motherInfo.motherName || "Not recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Blood Type:</dt>
                    <dd>{neonatalData.motherInfo.motherBloodType || "Not recorded"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-muted-foreground">No mother information linked</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tab contents will be implemented later */}
        <TabsContent value="birth-details">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Detailed birth information will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="immunizations">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Immunization records will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="followups">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Follow-up appointments will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
