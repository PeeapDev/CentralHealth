# Hospital Referral System Implementation Plan

## Current Issues to Fix

1. **Prisma Schema Error**: The error shows that `referringHospitalId` and `receivingHospitalId` fields are being used in queries but aren't properly defined in the Prisma schema.

2. **Mock Data Removal**: We need to replace any mock referral data with connections to the real database.

3. **Notification System**: Implement a notification bubble for receiving hospitals to show incoming referrals.

4. **Patient Dashboard Integration**: Add a referral section to the patient dashboard.

## Implementation Plan

### Phase 1: Fix Database Schema & API

1. **Update Prisma Schema**
   - Add proper referral model with `referringHospitalId` and `receivingHospitalId` fields
   - Define relationships between hospitals and referrals
   - Add fields for referral status, priority, and case details

2. **Create/Update API Endpoints**
   - `/api/hospitals/[hospitalId]/referrals` - GET (list all referrals for a hospital)
   - `/api/hospitals/[hospitalId]/referrals/sent` - GET (referrals sent by this hospital)
   - `/api/hospitals/[hospitalId]/referrals/received` - GET (referrals received by this hospital)
   - `/api/hospitals/[hospitalId]/referrals/[referralId]` - GET (specific referral details)
   - `/api/hospitals/[hospitalId]/referrals` - POST (create new referral)
   - `/api/hospitals/[hospitalId]/referrals/[referralId]` - PUT (update referral status)
   - `/api/hospitals/[hospitalId]/ambulance/availability` - GET (check ambulance availability)

### Phase 2: Hospital Admin Dashboard Components

1. **Referral List Component**
   - Display sent and received referrals
   - Filter by status (pending, accepted, rejected, completed)
   - Sort by priority, date, etc.

2. **Referral Detail Component**
   - Show complete referral information
   - Patient details
   - Medical information
   - Reason for referral
   - Status tracking

3. **Notification System**
   - Create notification component for new referrals
   - Implement priority-based visual indicators (color coding for urgency)
   - Add real-time updates using WebSockets or polling

4. **Ambulance Integration**
   - Display ambulance availability status
   - Allow requesting ambulance as part of referral
   - Track ambulance dispatch status

### Phase 3: Patient Dashboard Integration

1. **Patient Referral Section**
   - Create `/patient/referral` route
   - Display patient's referral history
   - Show status of current referrals
   - Allow patients to view referral details

2. **Patient Sidebar Update**
   - Add referral navigation item to patient sidebar
   - Include notification indicator for new/updated referrals

## Detailed Tasks

### Task 1: Fix Prisma Schema
```prisma
// Update schema.prisma
model Referral {
  id                  String   @id @default(uuid())
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Hospital relationships
  referringHospital   Hospital @relation("ReferringSent", fields: [referringHospitalId], references: [id])
  referringHospitalId String
  
  receivingHospital   Hospital @relation("ReceivingReceived", fields: [receivingHospitalId], references: [id])
  receivingHospitalId String
  
  // Patient relationship
  patient             Patient  @relation(fields: [patientId], references: [id])
  patientId           String
  
  // Referral details
  reason              String
  notes               String?
  priority            ReferralPriority @default(NORMAL)
  status              ReferralStatus @default(PENDING)
  
  // Medical details
  diagnosis           String?
  treatmentHistory    String?
  
  // Ambulance request
  requiresAmbulance   Boolean @default(false)
  ambulanceStatus     AmbulanceStatus? @relation(fields: [ambulanceStatusId], references: [id])
  ambulanceStatusId   String?
}

model Hospital {
  // Existing hospital fields...
  
  // Add relations for referrals
  sentReferrals       Referral[] @relation("ReferringSent")
  receivedReferrals   Referral[] @relation("ReceivingReceived")
  
  // Ambulance information
  ambulanceFleet      Ambulance[]
}

model Ambulance {
  id                  String   @id @default(uuid())
  registrationNumber  String   @unique
  hospital            Hospital @relation(fields: [hospitalId], references: [id])
  hospitalId          String
  status              String   @default("AVAILABLE") // AVAILABLE, IN_USE, MAINTENANCE
  currentLocation     String?  // Could be GPS coordinates or address
  capacity            Int      @default(1)
  equipmentLevel      String   @default("BASIC") // BASIC, ADVANCED, CRITICAL
  
  // Status tracking
  statuses            AmbulanceStatus[]
}

model AmbulanceStatus {
  id                  String   @id @default(uuid())
  ambulance           Ambulance @relation(fields: [ambulanceId], references: [id])
  ambulanceId         String
  status              String   // DISPATCHED, EN_ROUTE, ARRIVED, RETURNING, COMPLETED
  timestamp           DateTime @default(now())
  location            String?
  notes               String?
  
  // Referral relationship
  referrals           Referral[]
}

enum ReferralPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum ReferralStatus {
  PENDING
  ACCEPTED
  REJECTED
  COMPLETED
  CANCELLED
}
```

### Task 2: Create API Routes

1. Create/update the following API routes:
   - `/app/api/hospitals/[hospitalId]/referrals/route.ts`
   - `/app/api/hospitals/[hospitalId]/referrals/sent/route.ts`
   - `/app/api/hospitals/[hospitalId]/referrals/received/route.ts`
   - `/app/api/hospitals/[hospitalId]/referrals/[referralId]/route.ts`
   - `/app/api/hospitals/[hospitalId]/ambulance/availability/route.ts`

2. Implement proper error handling and validation

### Task 3: Hospital Admin Dashboard Components

1. Update `/app/[hospitalName]/admin/referral/page.tsx`
2. Create components:
   - `components/referral/referral-list.tsx`
   - `components/referral/referral-detail.tsx`
   - `components/referral/referral-notification.tsx`
   - `components/referral/create-referral-form.tsx`
   - `components/ambulance/ambulance-status.tsx`
   - `components/ambulance/request-ambulance.tsx`

### Task 4: Patient Dashboard Integration

1. Create `/app/patient/referral/page.tsx`
2. Update patient sidebar to include referral link
3. Create patient-specific referral components

## Timeline Estimate

1. **Phase 1 (Database & API)**: 2-3 days
2. **Phase 2 (Hospital Admin Dashboard)**: 3-4 days
3. **Phase 3 (Patient Dashboard)**: 2-3 days
4. **Ambulance Integration**: 2-3 days

Total: 9-13 days for complete implementation

## Future Enhancements

1. **Real-time Ambulance Tracking**
   - Integrate with mapping services to show ambulance location in real-time
   - Provide ETA to patients and receiving hospitals

2. **Automated Referral Matching**
   - Suggest appropriate hospitals based on:
     - Specialty needed
     - Distance/travel time
     - Current capacity
     - Equipment availability

3. **Integration with Electronic Health Records**
   - Automatically transfer relevant patient records with referral
   - Ensure compliance with data protection regulations

4. **Mobile Notifications**
   - Send SMS or push notifications to patients about referral status
   - Alert hospital staff about urgent incoming referrals

5. **Analytics Dashboard**
   - Track referral patterns and outcomes
   - Identify bottlenecks in the referral process
   - Measure ambulance response times and efficiency
