---
trigger: always_on
---

entralHealth System - Comprehensive Rules Document
1. Prohibition of Mock and Test Data
Zero Tolerance for Mock Data
The system must NEVER contain or generate test/mock patient data
All existing test patients, demo accounts, and sample records must be removed
All code paths that generate fake or placeholder medical IDs must be disabled
All patient data must be real clinical data from actual hospital patients
Any hardcoded email-based logic for test accounts must be eliminated
Data Authenticity Requirements
All patient records must correspond to actual patients
Development and testing must use properly anonymized real data
All conditional logic that creates special handling for test users must be removed
No predetermined fixed medical IDs for specific accounts
No synthetic patient records allowed in production environment
2. Medical ID Management
Permanent Medical ID Policy
Medical IDs must NEVER be regenerated for existing patients
Each patient receives ONE permanent medical ID for their lifetime in the system
All medical IDs must follow NHS-style 5-character alphanumeric format
Medical IDs must be stored consistently in the mrn field in patient records
Medical IDs must remain persistent across all hospital integrations
Medical ID Generation Rules
Generate new medical IDs ONLY for entirely new patients without existing IDs
New medical IDs must contain a mix of letters and numbers
Exclude confusing characters: i, l, 1, o, 0 from generated IDs
Once assigned, a medical ID becomes immutable and permanent
All medical ID generation must use the centralized utility function only
3. Session Management Protocol
Session Creation and Maintenance
Session creation must preserve existing medical IDs from the database exactly
Session refresh must maintain the exact same medical ID without changes
Never modify medical IDs during any authentication or session processes
All session cookies must store the exact medical ID from patient records
Session tokens must expire after appropriate inactivity periods
Session Security Requirements
All session cookies must be HttpOnly, secure, and properly encrypted
Implement proper CSRF protection on all session-related endpoints
Session invalidation must occur on password changes and suspicious activity
Clear error handling for expired or invalid sessions
Maintain comprehensive session audit logs for security review
4. Centralized Patient Information
Patient Data Structure
All patient data must follow a consistent, centralized data model
Personal data must be clearly segregated from clinical data
Centralized utility functions must handle all patient data transformations
Standard field naming conventions must be used across all interfaces
Full audit trail of all changes to patient information
Protected Personal Data Fields
The following personal data fields are immutable by hospital staff:
Name (first, middle, last)
Email address
Password/authentication credentials
Date of birth/age
Sex/gender
Physical location/address
Next of kin information
Contact details
Government ID numbers
These fields can only be modified through special administrative processes
Hospital-Updatable Data Fields
Hospital staff may update the following types of data:
Medical test results and reports
Booking and appointment information
Neonatal and pediatric records
Treatment plans and medication records
Clinical notes and observations
Billing and insurance information (non-personal)
Diagnosis and procedure codes
All updates must be logged with user ID and timestamp
5. Deployment Protocol
Deployment Preparation
All deployments must be preceded by comprehensive testing
Database migrations affecting patient records need senior developer approval
Changes to medical ID handling require explicit sign-off
Deployment schedule must consider hospital operational hours
Full backup of all data required before deployment
Deployment Execution
Deploy during predetermined low-usage windows
Implement staged rollout for major changes
Maintain detailed deployment logs
Have ready rollback procedures for all changes
Notify appropriate stakeholders before and after deployment
Post-Deployment Activities
Verify medical ID consistency after deployment
Run automated tests to confirm system functionality
Monitor error rates and performance for 24 hours post-deployment
Schedule post-deployment review session
Document any issues and resolutions
6. Performance Standards
Response Time Requirements
Database queries involving medical IDs: < 100ms
Patient record retrieval: < 300ms under normal load
Session validation operations: < 50ms
Page load times: < 1.5s for patient portal
Report generation: < 5s for standard reports
Scaling and Capacity
System must support concurrent users equal to 20% of total patient base
Database connections properly pooled and managed
Implement appropriate caching strategies for frequently accessed data
Optimize all queries touching patient records
Regular performance testing and optimization
7. Data Sharing Protocols
Internal Data Sharing
Patient data sharing between departments must follow role-based permissions
All internal data access must be logged with user, timestamp, and purpose
Maintain consistent medical ID references across all departments
Implement data minimization principle - share only necessary information
Regular audits of internal data access patterns
External Data Sharing
External sharing requires explicit administrative approval
All external sharing must be logged comprehensively
Patient data must be appropriately anonymized for research
Implement secure transfer protocols for external sharing
Regular review of all external data sharing agreements
8. Role-Based Access Control
Role Hierarchy
Super Admin: System-wide configuration only (no direct patient data access)
Hospital Admin: Hospital-wide settings and audit capabilities
Clinical Admin: Department-level administration
Physician: Full access to assigned patients' clinical data
Nurse: Limited clinical data access based on assignment
Front Desk: Appointment and basic demographic information only
Billing: Financial information only, limited clinical data
Permission Controls
Granular permissions for each data category
Time-limited elevated access when clinically necessary
Regular permission audits and reviews
Emergency access protocols with post-access justification required
Automatic revocation of unused permissions
9. Development Guidelines
Code Quality Requirements
TypeScript type definitions required for all new code
No implicit any types allowed
Consistent use of async/await patterns for database operations
Comprehensive error handling with appropriate user messaging
Follow established naming conventions and code style
API Development Restrictions
CRITICAL: NO NEW ROUTES can be created without explicit owner permission
Modifications to existing routes require thorough documentation
All API endpoints must validate appropriate permissions
Implement consistent error response format across all endpoints
API changes must maintain backward compatibility when possible
Security Best Practices
All user inputs must be properly sanitized and validated
Implement proper parameterized queries to prevent injection
Regular security scanning and vulnerability assessment
Follow OWASP security guidelines for all web components
Proper secrets management and no hardcoded credentials
10. Logging and Monitoring
Logging Requirements
Structured logging format for all system events
Appropriate log levels (info, warn, error) used consistently
Include contextual information in all log entries
Personal data must be redacted in logs
Implement proper log rotation and retention policies
Monitoring Setup
Real-time alerting for critical system errors
Dashboard for system performance metrics
Monitor authentication failures and suspicious activities
Regular review of error trends
Automated anomaly detection for unusual access patterns
These rules are binding for all development and operations of the CentralHealth System.

1. Database Schema Synchronization Protocol
Zero Tolerance for Database Schema Inconsistency
Database schema and Prisma schema MUST be kept in perfect synchronization at all times
ABSOLUTELY NO temporary database fixes or workarounds are permitted under any circumstances
If a migration would drop a database, the migration must proceed properly rather than implementing temporary fixes
STRICTLY FORBIDDEN to modify schema directly or through non-migration methods
All schema changes MUST go through proper Prisma migration processes - no exceptions
Temporary workarounds that bypass schema integrity are grounds for immediate code rejection
Database Migration Standards
Always use prisma migrate for all database schema changes
Create and test migrations in development before applying to production
All migrations must include proper up/down methods for reliability
Never use --accept-data-loss flag in production environments without proper approval
Include detailed comments in migration files explaining changes
Coordinate database migration timing with hospital operations
All migrations must be peer reviewed before deployment
Schema Integrity Verification
Verify database state after migrations via prisma db pull
Run automated tests to confirm data integrity post-migration
Check relations especially for patient-linked models
Document all schema changes in the system changelog
Implement automated schema validation checks in CI/CD pipeline
Regularly audit database schema for compliance with these rules
Emergency Recovery Procedures
Maintain recent database backups before any schema change
Have rollback scripts prepared for all schema modifications

this is a centralize application 
his is a centralized NHS-style hospital management system where:

Patients register and login at the main site (/register and /auth/login)
Hospitals access and update patient data at their own dashboard (/[hospital-name]/admin)
The superadmin dashboard manages the entire platform (hospitals, subscriptions, etc.)