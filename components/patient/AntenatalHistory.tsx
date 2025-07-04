import React from 'react';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AntenatalHistoryProps {
  patientId: string;
}

async function AntenatalHistory({ patientId }: AntenatalHistoryProps) {
  // Fetch antenatal registration with all related data
  const registration = await prisma.antenatalRegistration.findFirst({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      hospital: true,
      bookingVisit: true,
      medicalHistory: true,
      physicalExam: true,
      labResults: true,
      visitSchedule: true
    }
  });

  if (!registration) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No antenatal history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Registration Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Registration Date</p>
            <p>{format(registration.createdAt, 'MMMM d, yyyy')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Hospital</p>
            <p>{registration.hospital.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Risk Level</p>
            <div className="flex items-center gap-2">
              <Badge 
                variant={registration.riskLevel === 'high' ? 'destructive' : 
                        registration.riskLevel === 'medium' ? 'secondary' : 'outline'}
              >
                {registration.riskLevel?.toUpperCase() || 'LOW'}
              </Badge>
            </div>
          </div>
          {registration.transferredFrom && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Transferred From</p>
              <p>Hospital ID: {registration.transferredFrom}</p>
              <p className="text-xs text-muted-foreground">
                {registration.transferredAt ? format(registration.transferredAt, 'PPP') : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {registration.bookingVisit && (
        <div>
          <h3 className="text-lg font-medium mb-2">Booking Visit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Menstrual Period (LMP)</p>
              <p>{format(registration.bookingVisit.lmp, 'MMMM d, yyyy')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Expected Due Date (EDD)</p>
              <p>{format(registration.bookingVisit.edd, 'MMMM d, yyyy')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gravida</p>
              <p>{registration.bookingVisit.gravida}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Para</p>
              <p>{registration.bookingVisit.para}</p>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {registration.medicalHistory && (
        <div>
          <h3 className="text-lg font-medium mb-2">Medical History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Previous Pregnancies</p>
              <p>{registration.medicalHistory.previousPregnancies || 'None'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Complications</p>
              <p>{registration.medicalHistory.complications || 'None'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Chronic Conditions</p>
              <p>{registration.medicalHistory.chronicConditions || 'None'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Allergies</p>
              <p>{registration.medicalHistory.allergies || 'None'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Medications</p>
              <p>{registration.medicalHistory.medications || 'None'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Surgical History</p>
              <p>{registration.medicalHistory.surgicalHistory || 'None'}</p>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {registration.physicalExam && (
        <div>
          <h3 className="text-lg font-medium mb-2">Physical Examination</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Height (cm)</p>
              <p>{registration.physicalExam.height || 'Not recorded'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Weight (kg)</p>
              <p>{registration.physicalExam.weight || 'Not recorded'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">BMI</p>
              <p>{registration.physicalExam.bmi || 'Not calculated'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Blood Pressure</p>
              <p>{registration.physicalExam.bloodPressure || 'Not recorded'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pulse</p>
              <p>{registration.physicalExam.pulse || 'Not recorded'} bpm</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Temperature</p>
              <p>{registration.physicalExam.temperature || 'Not recorded'} °C</p>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {registration.labResults && (
        <div>
          <h3 className="text-lg font-medium mb-2">Laboratory Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Blood Group</p>
              <p>{registration.labResults.bloodGroup || 'Not tested'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Hemoglobin</p>
              <p>{registration.labResults.hemoglobin || 'Not tested'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">HIV Status</p>
              <p>{registration.labResults.hivStatus || 'Not tested'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Hepatitis</p>
              <p>{registration.labResults.hepatitis || 'Not tested'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Urinalysis</p>
              <p>{registration.labResults.urinalysis || 'Not tested'}</p>
            </div>
          </div>
        </div>
      )}

      {registration.riskFactors && registration.riskFactors.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-2">Risk Factors</h3>
            <div className="flex flex-wrap gap-2">
              {registration.riskFactors.map((risk, index) => (
                <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {risk}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AntenatalHistory;
