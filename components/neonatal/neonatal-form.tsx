"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NeonatalFormProps {
  patientId: string;
  initialData?: any;
  onSaved?: () => void;
}

export function NeonatalForm({ patientId, initialData = {}, onSaved }: NeonatalFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    birthDateTime: initialData.birthDateTime ? new Date(initialData.birthDateTime) : undefined,
    deliveryType: initialData.deliveryType || "",
    birthWeight: initialData.birthWeight || "",
    apgarScores: initialData.apgarScores || {
      oneMinute: "",
      fiveMinutes: "",
      tenMinutes: "",
    },
    initialAssessment: initialData.initialAssessment || {
      jaundice: false,
      reflexesNormal: true,
      respiratoryRate: "",
      heartRate: "",
    },
    nicuAdmission: initialData.nicuAdmission || false,
    nicuNotes: initialData.nicuNotes || "",
    motherInfo: initialData.motherInfo || {
      motherId: "",
      motherName: "",
      motherBloodType: "",
    },
    immunizations: initialData.immunizations || [],
    notes: initialData.notes || "",
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDateTimeChange = (date: Date | undefined, field: string) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleCheckboxChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImmunizationToggle = (immunization: string) => {
    setFormData(prev => {
      const currentImmunizations = prev.immunizations || [];
      
      if (currentImmunizations.includes(immunization)) {
        return { 
          ...prev, 
          immunizations: currentImmunizations.filter((i: string) => i !== immunization) 
        };
      } else {
        return { 
          ...prev, 
          immunizations: [...currentImmunizations, immunization] 
        };
      }
    });
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
          pluginName: "neonatal",
          data: formData,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }
      
      toast({
        title: "Neonatal record saved",
        description: "The patient's neonatal information has been updated.",
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error saving neonatal data:", error);
      toast({
        title: "Error saving record",
        description: "There was a problem saving the neonatal information.",
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
          <CardTitle>Neonatal Information</CardTitle>
          <CardDescription>
            Record or update the newborn's birth and neonatal care information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Birth Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDateTime">Birth Date & Time</Label>
                <DateTimePicker
                  date={formData.birthDateTime}
                  setDate={(date) => handleDateTimeChange(date, "birthDateTime")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryType">Delivery Type</Label>
                <Select
                  value={formData.deliveryType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal Vaginal Delivery">Normal Vaginal Delivery</SelectItem>
                    <SelectItem value="Cesarean Section">Cesarean Section</SelectItem>
                    <SelectItem value="Assisted Vaginal Delivery">Assisted Vaginal Delivery</SelectItem>
                    <SelectItem value="Water Birth">Water Birth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthWeight">Birth Weight (grams)</Label>
                <Input
                  id="birthWeight"
                  name="birthWeight"
                  value={formData.birthWeight}
                  onChange={handleChange}
                  type="number"
                  placeholder="Birth weight in grams"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Apgar Score</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apgar1">1 Minute</Label>
                <Input
                  id="apgar1"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.apgarScores.oneMinute}
                  onChange={(e) => handleNestedChange("apgarScores", "oneMinute", e.target.value)}
                  placeholder="0-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apgar5">5 Minutes</Label>
                <Input
                  id="apgar5"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.apgarScores.fiveMinutes}
                  onChange={(e) => handleNestedChange("apgarScores", "fiveMinutes", e.target.value)}
                  placeholder="0-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apgar10">10 Minutes</Label>
                <Input
                  id="apgar10"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.apgarScores.tenMinutes}
                  onChange={(e) => handleNestedChange("apgarScores", "tenMinutes", e.target.value)}
                  placeholder="0-10"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Initial Assessment</h3>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jaundice"
                    checked={formData.initialAssessment.jaundice}
                    onCheckedChange={(checked) => handleNestedChange("initialAssessment", "jaundice", !!checked)}
                  />
                  <label
                    htmlFor="jaundice"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Jaundice present
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reflexesNormal"
                    checked={formData.initialAssessment.reflexesNormal}
                    onCheckedChange={(checked) => handleNestedChange("initialAssessment", "reflexesNormal", !!checked)}
                  />
                  <label
                    htmlFor="reflexesNormal"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Normal reflexes
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
                  <Input
                    id="respiratoryRate"
                    type="number"
                    value={formData.initialAssessment.respiratoryRate}
                    onChange={(e) => handleNestedChange("initialAssessment", "respiratoryRate", e.target.value)}
                    placeholder="Breaths per minute"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    value={formData.initialAssessment.heartRate}
                    onChange={(e) => handleNestedChange("initialAssessment", "heartRate", e.target.value)}
                    placeholder="Beats per minute"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">NICU</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nicuAdmission"
                  checked={formData.nicuAdmission}
                  onCheckedChange={(checked) => handleCheckboxChange("nicuAdmission", !!checked)}
                />
                <label
                  htmlFor="nicuAdmission"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Admitted to NICU
                </label>
              </div>
              
              {formData.nicuAdmission && (
                <div className="space-y-2">
                  <Label htmlFor="nicuNotes">NICU Notes</Label>
                  <Textarea
                    id="nicuNotes"
                    name="nicuNotes"
                    value={formData.nicuNotes}
                    onChange={handleChange}
                    placeholder="Notes about NICU admission and treatment"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mother Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motherId">Mother's Patient ID</Label>
                <Input
                  id="motherId"
                  value={formData.motherInfo.motherId}
                  onChange={(e) => handleNestedChange("motherInfo", "motherId", e.target.value)}
                  placeholder="Mother's patient ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherName">Mother's Name</Label>
                <Input
                  id="motherName"
                  value={formData.motherInfo.motherName}
                  onChange={(e) => handleNestedChange("motherInfo", "motherName", e.target.value)}
                  placeholder="Mother's name"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Immunizations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {["BCG", "Hepatitis B", "OPV-0", "Vitamin K"].map((immunization) => (
                <div key={immunization} className="flex items-center space-x-2">
                  <Checkbox
                    id={`imm-${immunization}`}
                    checked={(formData.immunizations || []).includes(immunization)}
                    onCheckedChange={() => handleImmunizationToggle(immunization)}
                  />
                  <label
                    htmlFor={`imm-${immunization}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {immunization}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about the newborn"
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Neonatal Record"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
