---
description: Implementing Specialized Care Dashboards (Neonatal and Antenatal)
---

# Specialized Care Dashboards Workflow

## Overview

This workflow details the implementation of specialized care dashboards for neonatal and antenatal care modules, ensuring they follow CentralHealth system rules including strict medical ID permanence, real clinical data usage, and role-based access controls.

## Prerequisites

1. Access to the patient database with proper authentication
2. Appropriate role-based permissions configured
3. Patient records with valid, permanent medical IDs (stored in mrn field)
4. No mock or test data in any environment

## Implementation Steps

### 1. Dashboard Component Structure

1. Create specialized dashboard components in `components/dashboard/specialized/`:
   - `NeonatalDashboard.tsx` for neonatal care
   - `AntenatalDashboard.tsx` for antenatal care

2. Implement shared utility functions in `lib/specialized-care-utils.ts`:
   - Data validation functions
   - Specialized care calculations
   - Role-based access helpers

3. Implement reusable widgets in `components/widgets/`:
   - `MedicalIdCard` for displaying patient IDs
   - `PatientSearch` for centralized patient searching
   - `DoctorDirectory` for listing doctors

### 2. Patient Medical ID Integration

1. Always display the permanent medical ID using the `MedicalIdCard` component
2. Never generate or modify medical IDs, only read from the database
3. Use the `mrn` field consistently for medical ID storage and display
4. Implement proper role-based visibility for patient data
5. Log all access to patient records for auditing purposes

### 3. Neonatal Dashboard Implementation

1. Create structured patient view with the following sections:
   - Patient identifiers (using `MedicalIdCard` component)
   - Birth details (date, time, facility)
   - Vital measurements (weight, length, head circumference)
   - APGAR scores with visualization
   - Gestational age data
   - Feeding schedule and records
   - Growth charts with percentile calculations

2. Create specialized components for neonatal data visualization:
   - `GrowthChart.tsx` for weight/height tracking
   - `ApgarScoreDisplay.tsx` for APGAR score visualization
   - `FeedingSchedule.tsx` for feeding plan and tracking

3. Implement robust data validation:
   - Validate all incoming neonatal data
   - Provide defaults for missing non-essential fields
   - Handle edge cases in neonatal measurements

### 4. Antenatal Dashboard Implementation

1. Create structured patient view with the following sections:
   - Patient identifiers (using `MedicalIdCard` component)
   - Pregnancy details (gestational age, EDD)
   - Vital signs tracking
   - Ultrasound data and scheduling
   - Risk assessment tools
   - Upcoming appointment management

2. Create specialized components for antenatal data visualization:
   - `PregnancyTimeline.tsx` for gestational progress
   - `FetusGrowthChart.tsx` for development tracking
   - `RiskFactorDisplay.tsx` for highlighting concerns

3. Implement data synchronization between appointments:
   - Track changes between visits
   - Highlight significant changes in measurements
   - Ensure consistent medical ID usage across all records

### 5. Role-Based Access Control

1. Apply consistent role-based filtering:
   - Super Admin/Hospital Admin: Full access to all data
   - Clinical Admin/Physician: Full access to clinical data
   - Nurse: Access to vital signs and care notes
   - Front Desk: Limited to scheduling and basic patient info
   - Patient: Access only to their own simplified dashboard

2. Implement access checks in each dashboard component:
   - Show/hide sensitive clinical data based on role
   - Disable edit functionality for unauthorized roles
   - Log access attempts for security auditing

### 6. Data Fetching and Management

1. Use centralized data fetching functions to access patient records:
   - Always fetch using permanent medical ID
   - Include proper error handling
   - Implement caching for performance
   - Log all data access for compliance

2. Data Transformation Layer:
   - Process API responses with proper validation
   - Normalize data structures for consistent rendering
   - Handle missing or unexpected data gracefully
   - Apply role-based filtering before displaying

### 7. Integration with Existing Hospital Systems

1. Connect to hospital appointment scheduling system
2. Integrate with electronic health records (EHR) system
3. Implement notification system for critical updates
4. Ensure bi-directional synchronization of patient records

### 8. Testing Guidelines

1. NEVER use mock/test patient data even for testing
2. Use anonymized real patient data with appropriate approvals
3. Test across all supported roles and permission levels
4. Verify medical ID consistency throughout all patient journeys
5. Test edge cases in medical measurements and calculations

### 9. Deployment Protocol

1. Perform comprehensive testing in staging environment
2. Schedule deployment during low-usage hospital hours
3. Have a rollback plan ready before deployment
4. Monitor system for 24 hours post-deployment
5. Verify medical ID consistency post-deployment

## Best Practices

1. Always use the `mrn` field for medical IDs
2. Never generate new medical IDs for existing patients
3. Implement robust error handling and logging
4. Follow role-based access control strictly
5. Use TypeScript for type safety in all implementations
6. Add comprehensive comments explaining medical domain concepts
7. Log all patient data access for compliance and auditing