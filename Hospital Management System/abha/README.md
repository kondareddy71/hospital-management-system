# ABHA (Ayushman Bharat Health Account) Module

## Overview
This is a complete ABHA application module for implementing Universal Health Coverage (UHC) digitalization in the Hospital Management System. It provides a secure, portable health records system following India's ABHA/ABDM standards.

## Features

### 1. ABHA Account Management
- Create ABHA ID (unique 14-digit identifier: XX-XXXX-XXXX-XXXX)
- Register with Aadhar number and phone verification
- Store patient profile with health information
- Blood type and allergy tracking
- Chronic disease management

### 2. Portable Health Records (PHR)
- Access medical history across any healthcare provider
- Cross-hospital data sharing
- Encrypted health data
- Data integrity verification (SHA-256 hashing)

### 3. Consent Management
- Patient-controlled data sharing permissions
- Emergency access (always enabled)
- Hospital sharing consent
- Pharmacy sharing consent
- Research sharing consent
- Detailed audit trail of all consent changes

### 4. Health Data Synchronization
- Sync health records across ABDM network
- Real-time data updates
- Nationwide portability
- Data consistency checks

### 5. Security & Privacy
- Data encryption using AES-256-CBC
- Audit logging of all access
- Consent-based access control
- Emergency emergency access for critical situations
- IP address and device tracking

### 6. Analytics & Reporting
- Health risk score calculation
- Personalized health recommendations
- Access history tracking
- Consent audit logs
- System statistics

## File Structure

```
abha/
├── abha-utils.js       # Utility functions and validations
├── abha-store.js       # In-memory data store (replace with DB)
├── abha-routes.js      # All API endpoints
├── README.md           # This file
└── docs/               # Documentation files
```

## API Endpoints

### Authentication & Registration
- `POST /abha/register` - Create new ABHA account
- `GET /abha/register` - Registration page

### Dashboard & Records
- `GET /abha/dashboard?abhaId=XX-XXXX-XXXX-XXXX` - View ABHA dashboard
- `GET /abha/portable-health-record/:abhaId` - Get portable health record (JSON)

### Consent Management
- `POST /abha/manage-consent` - Update consent preferences
- `GET /abha/consent-history/:abhaId` - View consent changes

### Health Data
- `POST /abha/add-medical-history` - Add medical records
- `POST /abha/sync-health-data` - Sync health data

### Access & Audit
- `GET /abha/access-history/:abhaId` - View who accessed your data
- `GET /abha/health-profile/:abhaId` - Get health profile with risk assessment

### Admin
- `GET /abha/admin/records` - List all ABHA records
- `GET /abha/admin/search?q=query` - Search records

### System
- `GET /abha/statistics` - System statistics

## Usage

### 1. Integrate into Server
```javascript
// In server.js
const abhaRoutes = require('./abha/abha-routes');
app.use('/abha', abhaRoutes);
```

### 2. Create ABHA Account
```bash
POST /abha/register
{
  "name": "John Doe",
  "phone": "9876543210",
  "aadhar": "123456789012",
  "bloodType": "O+",
  "gender": "Male"
}
```

### 3. Access Health Records
```bash
GET /abha/portable-health-record/12-3456-7890-1234
# Returns portable health record as JSON
```

### 4. Manage Consents
```bash
POST /abha/manage-consent
{
  "abhaId": "12-3456-7890-1234",
  "consentType": "hospitalSharing",
  "grant": true
}
```

## Data Schema

### ABHA Record
```javascript
{
  abhaId: "12-3456-7890-1234",
  phoneNumber: "9876543210",
  aadharNumber: "123456789012",
  name: "John Doe",
  email: "john@example.com",
  dob: "1990-01-01",
  gender: "Male",
  registeredAt: "2026-04-10",
  lastUpdated: "2026-04-10T10:30:00Z",
  bloodType: "O+",
  allergies: ["Penicillin", "Nuts"],
  chronicDiseases: ["Diabetes"],
  healthRecords: [],
  consents: {
    emergencyAccess: true,
    hospitalSharing: false,
    pharmacySharing: false,
    researchSharing: false
  },
  emergencyContacts: []
}
```

## Security Considerations

1. **Data Encryption**: All sensitive data is encrypted using AES-256
2. **Audit Trails**: All access is logged with timestamp and IP address
3. **Consent-Based**: Hospital access requires explicit patient consent
4. **Emergency Override**: Emergency mode bypasses consent for critical access
5. **Data Integrity**: SHA-256 hashing ensures data hasn't been tampered with

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] OTP verification for registration
- [ ] Biometric authentication
- [ ] Mobile app integration
- [ ] AI-based health predictions
- [ ] Blockchain integration for data integrity
- [ ] Real-time notifications
- [ ] Integration with pharmacy systems
- [ ] Lab integration for test results
- [ ] Prescription management system

## Global Compliance

This module follows standards from:
- 🇮🇳 **India**: ABHA/ABDM guidelines
- 🇪🇺 **EU**: GDPR and EHDS standards
- 🇪🇪 **Estonia**: e-Health security practices
- 🇦🇺 **Australia**: My Health Record standards
- 🇸🇬 **Singapore**: HealthHub architecture

## Support

For issues, questions, or contributions, please refer to the main project documentation.

## License

Part of Hospital Management System - Ayushman Bharat Digital Mission
