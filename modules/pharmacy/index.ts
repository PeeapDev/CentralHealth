import { Express, Request, Response } from 'express';

/**
 * Pharmacy Module - Provides medication and prescription management
 * @param app Express application
 */
export default function register(app: Express): void {
  console.log('Registering internal pharmacy module routes...');

  // Get all medications
  app.get('/pharmacy/medications', (req: Request, res: Response) => {
    res.json({
      success: true,
      module: 'internal-pharmacy',
      data: [
        { id: 1, name: 'Paracetamol', dosage: '500mg', type: 'tablet', stock: 250 },
        { id: 2, name: 'Amoxicillin', dosage: '250mg', type: 'capsule', stock: 120 },
        { id: 3, name: 'Ibuprofen', dosage: '400mg', type: 'tablet', stock: 180 }
      ]
    });
  });

  // Get prescriptions for a patient
  app.get('/pharmacy/prescriptions/:patientId', (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    
    res.json({
      success: true,
      module: 'internal-pharmacy',
      patientId,
      data: [
        { 
          id: 1, 
          medication: 'Paracetamol', 
          dosage: '500mg', 
          frequency: 'Every 6 hours',
          duration: '5 days',
          prescribedBy: 'Dr. Smith',
          date: '2025-05-20'
        },
        { 
          id: 2, 
          medication: 'Amoxicillin', 
          dosage: '250mg', 
          frequency: 'Every 8 hours',
          duration: '7 days',
          prescribedBy: 'Dr. Johnson',
          date: '2025-05-22'
        }
      ]
    });
  });

  // Create new prescription
  app.post('/pharmacy/prescriptions', (req: Request, res: Response) => {
    const prescriptionData = req.body;
    
    res.status(201).json({
      success: true,
      module: 'internal-pharmacy',
      message: 'Prescription created successfully',
      data: {
        id: Date.now(),
        ...prescriptionData,
        createdAt: new Date().toISOString()
      }
    });
  });

  console.log('Internal pharmacy module routes registered successfully');
}
