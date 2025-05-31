import { Express, Request, Response } from 'express';

/**
 * Billing Module - Provides billing and invoice management functionality
 * @param app Express application
 */
export default function register(app: Express): void {
  console.log('Registering internal billing module routes...');

  // Get all invoices
  app.get('/billing/invoices', (req: Request, res: Response) => {
    res.json({
      success: true,
      module: 'internal-billing',
      data: [
        { id: 1, patient: 'John Doe', amount: 150.00, status: 'paid', date: '2025-05-25' },
        { id: 2, patient: 'Jane Smith', amount: 75.50, status: 'pending', date: '2025-05-28' },
        { id: 3, patient: 'Robert Johnson', amount: 220.00, status: 'overdue', date: '2025-05-15' }
      ]
    });
  });

  // Get invoice by ID
  app.get('/billing/invoices/:id', (req: Request, res: Response) => {
    const invoiceId = req.params.id;
    res.json({
      success: true,
      module: 'internal-billing',
      data: {
        id: invoiceId,
        patient: 'John Doe',
        patientId: '123456',
        items: [
          { description: 'Consultation', amount: 50.00 },
          { description: 'Blood Test', amount: 75.00 },
          { description: 'Medication', amount: 25.00 }
        ],
        total: 150.00,
        status: 'paid',
        date: '2025-05-25'
      }
    });
  });

  // Create new invoice
  app.post('/billing/invoices', (req: Request, res: Response) => {
    const invoiceData = req.body;
    res.status(201).json({
      success: true,
      module: 'internal-billing',
      message: 'Invoice created successfully',
      data: {
        id: Date.now(),
        ...invoiceData,
        createdAt: new Date().toISOString()
      }
    });
  });

  console.log('Internal billing module routes registered successfully');
}
