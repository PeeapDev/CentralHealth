"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface AntenatalFormProps {
  patientId: string;
  initialData?: any;
  onSaved?: () => void;
}

export function AntenatalForm({ patientId, initialData = {}, onSaved }: AntenatalFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lmp: initialData.lmp ? new Date(initialData.lmp) : undefined,
    edd: initialData.edd ? new Date(initialData.edd) : undefined,
    gravida: initialData.gravida || "",
    parity: initialData.parity || "",
    riskFactors: initialData.riskFactors || [],
    notes: initialData.notes || "",
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined, field: string) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleRiskFactorToggle = (risk: string) => {
    setFormData(prev => {
      const currentRisks = prev.riskFactors || [];
      
      if (currentRisks.includes(risk)) {
        return { ...prev, riskFactors: currentRisks.filter((r: string) => r !== risk) };
      } else {
        return { ...prev, riskFactors: [...currentRisks, risk] };
      }
    });
  };

  const calculateEDD = (lmpDate: Date | undefined) => {
    if (!lmpDate) return;
    
    // EDD is approximately 280 days (40 weeks) from LMP
    const edd = new Date(lmpDate);
    edd.setDate(edd.getDate() + 280);
    
    handleDateChange(edd, "edd");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/patients/${patientId}/plugin-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pluginName: "antenatal",
          data: formData,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }
      
      toast({
        title: "Antenatal record saved",
        description: "The patient's antenatal information has been updated.",
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error saving antenatal data:", error);
      toast({
        title: "Error saving record",
        description: "There was a problem saving the antenatal information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Antenatal Information</CardTitle>
          <CardDescription>
            Record or update the patient's antenatal care information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lmp">Last Menstrual Period (LMP)</Label>
              <DatePicker
                id="lmp"
                date={formData.lmp}
                onSelect={(date) => {
                  handleDateChange(date, "lmp");
                  calculateEDD(date);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edd">Estimated Delivery Date (EDD)</Label>
              <DatePicker
                id="edd"
                date={formData.edd}
                onSelect={(date) => handleDateChange(date, "edd")}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gravida">Gravida</Label>
              <Input
                id="gravida"
                name="gravida"
                value={formData.gravida}
                onChange={handleChange}
                placeholder="Number of pregnancies"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parity">Parity</Label>
              <Input
                id="parity"
                name="parity"
                value={formData.parity}
                onChange={handleChange}
                placeholder="Number of births"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Risk Factors</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {["Hypertension", "Diabetes", "Advanced maternal age", "Previous cesarean", "Multiple pregnancy"].map((risk) => (
                <div key={risk} className="flex items-center space-x-2">
                  <Checkbox
                    id={`risk-${risk}`}
                    checked={(formData.riskFactors || []).includes(risk)}
                    onCheckedChange={() => handleRiskFactorToggle(risk)}
                  />
                  <label
                    htmlFor={`risk-${risk}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {risk}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about the pregnancy"
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Antenatal Record"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
