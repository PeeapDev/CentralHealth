import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MedicalIDGenerator, MedicalIDFormatter, MedicalIDValidator } from '@/utils/medical-id';
import { toast } from 'sonner';
import { Loader2, RefreshCw, BadgeCheck, XCircle, Clipboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MedicalIdGeneratorProps {
  patientId: string;
  currentMedicalId?: string;
  hospitalId: string;
  onUpdate: (newMedicalId: string) => Promise<void>;
}

export function MedicalIdGenerator({ 
  patientId, 
  currentMedicalId, 
  hospitalId,
  onUpdate 
}: MedicalIdGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [medicalId, setMedicalId] = useState(currentMedicalId || '');
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    available: boolean;
    message: string;
    formatted?: string;
  } | null>(null);

  // Initialize with current ID
  useEffect(() => {
    if (currentMedicalId) {
      setMedicalId(currentMedicalId);
      checkAvailability(currentMedicalId);
    }
  }, [currentMedicalId]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      let attempts = 0;
      let newId = '';
      let isAvailable = false;
      
      // Try generating until we find an available ID (max 5 attempts)
      while (attempts < 5 && !isAvailable) {
        newId = MedicalIDGenerator.generateStandardID();
        const response = await checkAvailability(newId);
        isAvailable = response?.available || false;
        attempts++;
      }
      
      if (isAvailable) {
        setMedicalId(newId);
        toast.success('New Medical ID generated');
      } else {
        toast.error('Could not find available ID after several attempts');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate Medical ID');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAvailability = async (id: string) => {
    if (!id) return null;
    
    setIsChecking(true);
    setValidationStatus(null);
    
    try {
      // First validate locally
      const isValid = MedicalIDValidator.validate(id);
      if (!isValid) {
        setValidationStatus({
          valid: false,
          available: false,
          message: 'Invalid Medical ID format',
          formatted: MedicalIDFormatter.format(id)
        });
        return null;
      }

      // Then check with server
      const response = await fetch(`/api/patients/medical-id/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          hospitalId,
          patientId // Include to exclude current patient's ID from check
        }),
      });

      const data = await response.json();
      
      setValidationStatus({
        ...data,
        formatted: MedicalIDFormatter.format(id)
      });

      return data;
    } catch (error) {
      console.error('Check error:', error);
      toast.error('Failed to check availability');
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const handleAssign = async () => {
    if (!validationStatus?.valid || !validationStatus?.available) {
      toast.error('Please enter a valid and available Medical ID');
      return;
    }

    setIsLoading(true);
    
    try {
      await onUpdate(medicalId);
      toast.success('Medical ID assigned successfully');
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign Medical ID');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(medicalId);
    toast.success('Copied to clipboard');
  };

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
      const baseClasses = "flex items-center text-sm mt-1";
      
      if (!validationStatus.valid) {
        return (
          <div className={`${baseClasses} text-destructive`}>
            <XCircle className="h-3 w-3 mr-1" />
            {validationStatus.message}
          </div>
        );
      }

      if (!validationStatus.available) {
        return (
          <div className={`${baseClasses} text-destructive`}>
            <XCircle className="h-3 w-3 mr-1" />
            {validationStatus.message}
          </div>
        );
      }

      return (
        <div className={`${baseClasses} text-green-600`}>
          <BadgeCheck className="h-3 w-3 mr-1" />
          <span>{validationStatus.message}</span>
          {validationStatus.formatted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-2 text-green-600 hover:text-green-700"
                  onClick={copyToClipboard}
                >
                  <Clipboard className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border border-muted">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            Medical Identifier
            {currentMedicalId && (
              <Badge variant="outline" className="ml-2">
                Current: {MedicalIDFormatter.format(currentMedicalId)}
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Unique 5-character identifier following NHS-style format
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
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setMedicalId(value);
                  if (value.length === 5) {
                    checkAvailability(value);
                  }
                }}
                placeholder="e.g. A2B3C"
                className="uppercase font-mono tracking-widest"
                maxLength={5}
                onBlur={() => checkAvailability(medicalId)}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleGenerate}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate new ID</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {renderStatus()}
          </div>

          <Button 
            onClick={handleAssign} 
            disabled={
              isLoading || 
              isChecking || 
              !medicalId || 
              !validationStatus?.valid || 
              !validationStatus?.available
            }
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