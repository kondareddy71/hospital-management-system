/**
 * ABHA Data Store
 * Simple in-memory database for ABHA records
 * (In production, this would connect to a real database)
 */

const abhaUtils = require('./abha-utils');

class ABHADataStore {
  constructor() {
    this.abhaRecords = [];
    this.consentLogs = [];
    this.accessLogs = [];
    this.healthDataSyncs = [];
  }

  // Create new ABHA account
  createABHAAccount(userData) {
    const abhaId = abhaUtils.generateABHAId();
    
    // Validate inputs
    if (!abhaUtils.validatePhone(userData.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
    if (!abhaUtils.validateAadhar(userData.aadharNumber)) {
      throw new Error('Invalid Aadhar number format');
    }
    
    const abhaRecord = abhaUtils.createABHARecord({
      abhaId,
      ...userData
    });
    
    this.abhaRecords.push(abhaRecord);
    return abhaRecord;
  }

  // Get ABHA record by ID
  getABHARecord(abhaId) {
    return this.abhaRecords.find(r => r.abhaId === abhaId);
  }

  // Get ABHA record by phone number
  getABHARecordByPhone(phoneNumber) {
    return this.abhaRecords.find(r => r.phoneNumber === phoneNumber);
  }

  // Get ABHA record by Aadhar
  getABHARecordByAadhar(aadharNumber) {
    return this.abhaRecords.find(r => r.aadharNumber === aadharNumber);
  }

  // Update ABHA record
  updateABHARecord(abhaId, updateData) {
    const record = this.getABHARecord(abhaId);
    if (!record) {
      throw new Error('ABHA record not found');
    }
    
    Object.assign(record, updateData);
    record.lastUpdated = new Date().toISOString();
    return record;
  }

  // Update consents
  updateConsent(abhaId, consentType, granted) {
    const record = this.getABHARecord(abhaId);
    if (!record) {
      throw new Error('ABHA record not found');
    }
    
    record.consents[consentType] = granted;
    
    // Log the consent change
    this.consentLogs.push(
      abhaUtils.logConsentChange(abhaId, consentType, granted ? 'Granted' : 'Revoked')
    );
    
    return record;
  }

  // Get health record
  getPortableHealthRecord(abhaId, patientData = null) {
    const record = this.getABHARecord(abhaId);
    if (!record) {
      throw new Error('ABHA record not found');
    }
    
    return abhaUtils.createPortableHealthRecord(record, patientData);
  }

  // Add medical history
  addMedicalHistory(abhaId, medicalData) {
    const record = this.getABHARecord(abhaId);
    if (!record) {
      throw new Error('ABHA record not found');
    }
    
    record.healthRecords.push({
      ...medicalData,
      addedAt: new Date().toISOString()
    });
    
    record.lastUpdated = new Date().toISOString();
    return record;
  }

  // Sync health data
  syncHealthData(abhaId, syncData) {
    const record = this.getABHARecord(abhaId);
    if (!record) {
      throw new Error('ABHA record not found');
    }
    
    const syncRecord = {
      abhaId,
      syncedData: syncData,
      syncedAt: new Date().toISOString(),
      syncSource: syncData.source || 'Hospital System'
    };
    
    this.healthDataSyncs.push(syncRecord);
    record.lastUpdated = new Date().toISOString();
    
    return syncRecord;
  }

  // Log data access for audit trail
  logDataAccess(abhaId, accessDetails) {
    this.accessLogs.push({
      abhaId,
      ...accessDetails,
      timestamp: new Date().toISOString()
    });
  }

  // Get access history
  getAccessHistory(abhaId) {
    return this.accessLogs.filter(log => log.abhaId === abhaId);
  }

  // Get consent logs
  getConsentLogs(abhaId = null) {
    if (abhaId) {
      return this.consentLogs.filter(log => log.abhaId === abhaId);
    }
    return this.consentLogs;
  }

  // Get statistics
  getStatistics() {
    return {
      totalABHAAccounts: this.abhaRecords.length,
      activeAccounts: this.abhaRecords.filter(r => r.consents.emergencyAccess).length,
      hospitalSharingEnabled: this.abhaRecords.filter(r => r.consents.hospitalSharing).length,
      pharmacySharingEnabled: this.abhaRecords.filter(r => r.consents.pharmacySharing).length,
      researchSharingEnabled: this.abhaRecords.filter(r => r.consents.researchSharing).length,
      totalConsentLogs: this.consentLogs.length,
      totalAccessLogs: this.accessLogs.length,
      totalHealthSyncs: this.healthDataSyncs.length
    };
  }

  // Search ABHA records
  searchRecords(query) {
    return this.abhaRecords.filter(record => {
      const queryLower = query.toLowerCase();
      return (
        record.name.toLowerCase().includes(queryLower) ||
        record.abhaId.includes(query) ||
        record.phoneNumber.includes(query)
      );
    });
  }

  // Get all records (for admin)
  getAllRecords(limit = null) {
    const records = this.abhaRecords.map(r => ({
      abhaId: r.abhaId,
      name: r.name,
      phoneNumber: r.phoneNumber,
      registeredAt: r.registeredAt,
      lastUpdated: r.lastUpdated,
      bloodType: r.bloodType,
      emergencyAccessEnabled: r.consents.emergencyAccess
    }));
    
    if (limit) {
      return records.slice(0, limit);
    }
    return records;
  }

  // Delete ABHA record (with confirmation)
  deleteABHARecord(abhaId) {
    const index = this.abhaRecords.findIndex(r => r.abhaId === abhaId);
    if (index === -1) {
      throw new Error('ABHA record not found');
    }
    
    const deleted = this.abhaRecords.splice(index, 1);
    return deleted[0];
  }
}

// Export singleton instance
module.exports = new ABHADataStore();
