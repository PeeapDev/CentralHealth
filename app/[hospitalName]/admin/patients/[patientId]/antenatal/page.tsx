"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AntenatalForm } from "@/components/antenatal/antenatal-form";

export default function AntenatalPage() {
  const params = useParams();
  const hospitalName = params?.hospitalName as string;
  const patientId = params?.patientId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [antenatalData, setAntenatalData] = useState<any>(null);
  
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
        
        // Fetch antenatal plugin data
        const antenatalResponse = await fetch(`/api/patients/${patientId}/plugin-data?pluginName=antenatal`);
        
        if (!antenatalResponse.ok) {
          // If no data exists yet, we'll start with empty data
          if (antenatalResponse.status === 404) {
            setAntenatalData({});
          } else {
            throw new Error(`Failed to fetch antenatal data: ${antenatalResponse.status}`);
          }
        } else {
          const antenatalResult = await antenatalResponse.json();
          setAntenatalData(antenatalResult.data || {});
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
          Antenatal Care: {patientName}
        </h1>
        <p className="text-muted-foreground">
          MRN: {patientData?.medicalNumber || "Unknown"} • DOB: {patientData?.birthDate ? new Date(patientData.birthDate).toLocaleDateString() : "Unknown"}
        </p>
      </div>
      
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="pregnancy-history">Pregnancy History</TabsTrigger>
          <TabsTrigger value="visits">Visit Records</TabsTrigger>
          <TabsTrigger value="labs">Lab Results</TabsTrigger>
          <TabsTrigger value="care-plan">Care Plan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pregnancy Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">LMP:</dt>
                    <dd>{antenatalData?.lmp ? new Date(antenatalData.lmp).toLocaleDateString() : "Not recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">EDD:</dt>
                    <dd>{antenatalData?.edd ? new Date(antenatalData.edd).toLocaleDateString() : "Not recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Gravida:</dt>
                    <dd>{antenatalData?.gravida || "Not recorded"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Parity:</dt>
                    <dd>{antenatalData?.parity || "Not recorded"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                {antenatalData?.latestVitals ? (
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Blood Pressure:</dt>
                      <dd>{antenatalData.latestVitals.bp || "Not recorded"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Weight:</dt>
                      <dd>{antenatalData.latestVitals.weight ? `${antenatalData.latestVitals.weight} kg` : "Not recorded"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Fundal Height:</dt>
                      <dd>{antenatalData.latestVitals.fundalHeight ? `${antenatalData.latestVitals.fundalHeight} cm` : "Not recorded"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Fetal Heart Rate:</dt>
                      <dd>{antenatalData.latestVitals.fetalHeartRate ? `${antenatalData.latestVitals.fetalHeartRate} bpm` : "Not recorded"}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-muted-foreground">No vitals recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
              {antenatalData?.riskFactors && antenatalData.riskFactors.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {antenatalData.riskFactors.map((risk: string, idx: number) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No risk factors recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tab contents will be implemented later */}
        <TabsContent value="pregnancy-history">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Pregnancy History</h3>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Previous Pregnancy
                </Button>
              </div>
              
              {antenatalData?.previousPregnancies && antenatalData.previousPregnancies.length > 0 ? (
                <div className="space-y-4">
                  {/* Map through previous pregnancies */}
                  {antenatalData.previousPregnancies.map((pregnancy: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <dl className="grid grid-cols-2 gap-2">
                          <div>
                            <dt className="text-sm text-muted-foreground">Year</dt>
                            <dd>{pregnancy.year}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted-foreground">Delivery Type</dt>
                            <dd>{pregnancy.deliveryType}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted-foreground">Outcome</dt>
                            <dd>{pregnancy.outcome}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted-foreground">Complications</dt>
                            <dd>{pregnancy.complications || "None"}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No previous pregnancy records found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visits">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Antenatal Visits</h3>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Record New Visit
                </Button>
              </div>
              
              {antenatalData?.visits && antenatalData.visits.length > 0 ? (
                <div className="space-y-4">
                  {/* Map through visits */}
                  {antenatalData.visits.map((visit: any, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="bg-muted p-3 border-b">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">{new Date(visit.date).toLocaleDateString()} - Week {visit.pregnancyWeek}</h4>
                          <span className="text-sm text-muted-foreground">{visit.visitType}</span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Blood Pressure</p>
                            <p>{visit.vitals?.bp || "Not recorded"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Weight</p>
                            <p>{visit.vitals?.weight ? `${visit.vitals.weight} kg` : "Not recorded"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Fundal Height</p>
                            <p>{visit.vitals?.fundalHeight ? `${visit.vitals.fundalHeight} cm` : "Not recorded"}</p>
                          </div>
                        </div>
                        {visit.notes && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Notes</p>
                            <p>{visit.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No antenatal visits recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="labs">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Lab results will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="care-plan">
          <AntenatalForm 
            patientId={patientId}
            initialData={antenatalData} 
            onSaved={() => {
              // Refresh data after save
              setLoading(true);
              fetch(`/api/patients/${patientId}/plugin-data?pluginName=antenatal`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                  if (data) setAntenatalData(data.data || {});
                  setLoading(false);
                })
                .catch(err => {
                  console.error("Error refreshing data:", err);
                  setLoading(false);
                });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
