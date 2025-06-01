import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateMedicalID, isValidMedicalID } from '@/utils/medical-id';
import { toast } from 'sonner';
import { Loader2, RefreshCw, BadgeCheck, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MedicalIdGeneratorProps {
  patientId: string;
  currentMedicalId?: string;
  onUpdate: (newMedicalId: string) => void;
}

export function MedicalIdGenerator({ 
  patientId, 
  currentMedicalId, 
  onUpdate 
}: MedicalIdGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [medicalId, setMedicalId] = useState(currentMedicalId || '');
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  // Generate a new random medical ID
  const handleGenerate = () => {
    const newId = generateMedicalID();
    setMedicalId(newId);
    checkAvailability(newId);
  };

  // Check if the current medical ID is valid and available
  const checkAvailability = async (id: string) => {
    if (!id) return;
    
    setIsChecking(true);
    setValidationStatus(null);
    
    try {
      const response = await fetch(`/api/patients/medical-id/check?id=${id}`);
      const data = await response.json();
      
      setValidationStatus(data);
    } catch (error) {
      console.error('Error checking medical ID:', error);
      toast.error('Failed to check medical ID availability');
    } finally {
      setIsChecking(false);
    }
  };

  // Assign the current medical ID to the patient
  const handleAssign = async () => {
    if (!medicalId || !isValidMedicalID(medicalId)) {
      toast.error('Please enter a valid medical ID');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/patients/medical-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          customMedicalId: medicalId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign medical ID');
      }

      toast.success('Medical ID assigned successfully');
      onUpdate(medicalId);
    } catch (error) {
      console.error('Error assigning medical ID:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign medical ID');
    } finally {
      setIsLoading(false);
    }
  };

  // Show status of current ID
  const renderStatus = () => {
    if (isChecking) {
      return (
        <div className="flex items-center text-muted-foreground text-sm mt-1">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Checking availability...
        </div>
      );
    }

    if (validationStatus) {
      if (!validationStatus.valid) {
        return (
          <div className="flex items-center text-destructive text-sm mt-1">
            <XCircle className="h-3 w-3 mr-1" />
            {validationStatus.message}
          </div>
        );
      }

      if (!validationStatus.available) {
        return (
          <div className="flex items-center text-destructive text-sm mt-1">
            <XCircle className="h-3 w-3 mr-1" />
            {validationStatus.message}
          </div>
        );
      }

      return (
        <div className="flex items-center text-green-600 text-sm mt-1">
          <BadgeCheck className="h-3 w-3 mr-1" />
          {validationStatus.message}
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Patient Medical ID
          {currentMedicalId && (
            <Badge variant="outline" className="ml-2">
              Current: {currentMedicalId}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Assign a unique 5-character alphanumeric identifier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicalId">Medical ID</Label>
            <div className="flex space-x-2">
              <Input
                id="medicalId"
                value={medicalId}
                onChange={(e) => setMedicalId(e.target.value.toUpperCase())}
                placeholder="e.g. A2B3C"
                className="uppercase"
                maxLength={5}
                onBlur={() => checkAvailability(medicalId)}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleGenerate}
                title="Generate new Medical ID"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {renderStatus()}
          </div>

          <Button 
            onClick={handleAssign} 
            disabled={isLoading || isChecking || !medicalId || (validationStatus && (!validationStatus.valid || !validationStatus.available))}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentMedicalId ? 'Update Medical ID' : 'Assign Medical ID'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
