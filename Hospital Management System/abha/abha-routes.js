/**
 * ABHA Routes
 * All ABHA-related API endpoints and routes
 */

const express = require('express');
const router = express.Router();
const abhaStore = require('./abha-store');
const abhaUtils = require('./abha-utils');

// ==================== ABHA Registration ====================

// GET: ABHA Registration page
router.get('/register', (req, res) => {
  res.render('abha-register');
});

// POST: Create ABHA account
router.post('/register', (req, res) => {
  try {
    const { name, phone, aadhar, email, bloodType, gender, dob } = req.body;
    
    // Validation
    if (!name || !phone || !aadhar) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and Aadhar number are required'
      });
    }
    
    if (!abhaUtils.validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format (must be 10 digits)'
      });
    }
    
    if (!abhaUtils.validateAadhar(aadhar)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhar number format (must be 12 digits)'
      });
    }
    
    // Check if already exists
    if (abhaStore.getABHARecordByPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered with ABHA'
      });
    }
    
    if (abhaStore.getABHARecordByAadhar(aadhar)) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number already registered with ABHA'
      });
    }
    
    // Create account
    const account = abhaStore.createABHAAccount({
      name,
      phoneNumber: phone,
      aadharNumber: aadhar,
      email,
      bloodType,
      gender,
      dob
    });
    
    res.json({
      success: true,
      message: 'ABHA Account created successfully!',
      abhaId: account.abhaId,
      details: {
        name: account.name,
        abhaId: account.abhaId,
        registeredAt: account.registeredAt,
        bloodType: account.bloodType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ABHA Dashboard ====================

// GET: ABHA Dashboard
router.get('/dashboard', (req, res) => {
  try {
    const { abhaId } = req.query;
    
    if (!abhaId) {
      return res.status(400).send('ABHA ID is required');
    }
    
    if (!abhaUtils.validateABHAId(abhaId)) {
      return res.status(400).send('Invalid ABHA ID format');
    }
    
    const record = abhaStore.getABHARecord(abhaId);
    if (!record) {
      return res.status(404).send('ABHA record not found');
    }
    
    // Log access
    abhaStore.logDataAccess(abhaId, {
      action: 'Dashboard viewed',
      userType: 'Patient',
      ipAddress: req.ip
    });
    
    const consentLogs = abhaStore.getConsentLogs(abhaId);
    const healthRisk = abhaUtils.calculateHealthRiskScore(record.healthRecords);
    const recommendations = abhaUtils.generateHealthRecommendations(record);
    
    res.render('abha-dashboard', {
      record,
      consentLogs,
      healthRisk,
      recommendations
    });
  } catch (error) {
    res.status(500).send('Error loading ABHA dashboard: ' + error.message);
  }
});

// ==================== Portable Health Records ====================

// GET: Portable Health Record (JSON)
router.get('/portable-health-record/:abhaId', (req, res) => {
  try {
    const { abhaId } = req.params;
    
    if (!abhaUtils.validateABHAId(abhaId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ABHA ID format'
      });
    }
    
    const record = abhaStore.getABHARecord(abhaId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'ABHA record not found'
      });
    }
    
    // Check if hospital sharing is enabled
    if (!record.consents.hospitalSharing) {
      // Log unauthorized access attempt
      abhaStore.logDataAccess(abhaId, {
        action: 'Unauthorized access attempt',
        userType: 'Healthcare Provider',
        status: 'Denied - No consent'
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient consent required.'
      });
    }
    
    const portableRecord = abhaStore.getPortableHealthRecord(abhaId);
    
    // Log successful access
    abhaStore.logDataAccess(abhaId, {
      action: 'Portable health record accessed',
      userType: 'Healthcare Provider',
      status: 'Success'
    });
    
    res.json(portableRecord);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== Consent Management ====================

// POST: Update consent
router.post('/manage-consent', (req, res) => {
  try {
    const { abhaId, consentType, grant } = req.body;
    
    if (!abhaId || !consentType) {
      return res.status(400).json({
        success: false,
        message: 'ABHA ID and consent type are required'
      });
    }
    
    const granted = grant === 'true' || grant === true;
    const record = abhaStore.updateConsent(abhaId, consentType, granted);
    
    // Log the consent change
    abhaStore.logDataAccess(abhaId, {
      action: `Consent ${granted ? 'granted' : 'revoked'}`,
      consentType,
      userType: 'Patient'
    });
    
    res.json({
      success: true,
      message: `Consent ${granted ? 'granted' : 'revoked'} successfully`,
      consentType,
      status: granted ? 'Granted' : 'Revoked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET: Consent history
router.get('/consent-history/:abhaId', (req, res) => {
  try {
    const { abhaId } = req.params;
    
    const logs = abhaStore.getConsentLogs(abhaId);
    res.json({
      success: true,
      abhaId,
      consentHistory: logs,
      totalChanges: logs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== Health Data Management ====================

// POST: Add medical history
router.post('/add-medical-history', (req, res) => {
  try {
    const { abhaId, disease, doctor, medicines, billAmount, notes } = req.body;
    
    if (!abhaId || !disease || !doctor) {
      return res.status(400).json({
        success: false,
        message: 'ABHA ID, disease, and doctor name are required'
      });
    }
    
    const record = abhaStore.addMedicalHistory(abhaId, {
      disease,
      doctor,
      medicines: medicines || [],
      billAmount: billAmount || 0,
      notes,
      date: new Date().toLocaleDateString()
    });
    
    res.json({
      success: true,
      message: 'Medical history added successfully',
      record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST: Sync health data
router.post('/sync-health-data', (req, res) => {
  try {
    const { abhaId, syncData } = req.body;
    
    if (!abhaId || !syncData) {
      return res.status(400).json({
        success: false,
        message: 'ABHA ID and sync data are required'
      });
    }
    
    const syncRecord = abhaStore.syncHealthData(abhaId, syncData);
    
    res.json({
      success: true,
      message: 'Health data synced successfully across ABDM network',
      syncRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== Data Access & Audit ====================

// GET: Access history
router.get('/access-history/:abhaId', (req, res) => {
  try {
    const { abhaId } = req.params;
    
    const history = abhaStore.getAccessHistory(abhaId);
    res.json({
      success: true,
      abhaId,
      accessHistory: history,
      totalAccess: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== Statistics & Analytics ====================

// GET: ABHA statistics
router.get('/statistics', (req, res) => {
  try {
    const stats = abhaStore.getStatistics();
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET: User health profile
router.get('/health-profile/:abhaId', (req, res) => {
  try {
    const { abhaId } = req.params;
    
    const record = abhaStore.getABHARecord(abhaId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'ABHA record not found'
      });
    }
    
    const healthRisk = abhaUtils.calculateHealthRiskScore(record.healthRecords);
    const recommendations = abhaUtils.generateHealthRecommendations(record);
    
    res.json({
      success: true,
      profile: {
        abhaId: record.abhaId,
        name: record.name,
        bloodType: record.bloodType,
        allergies: record.allergies,
        chronicDiseases: record.chronicDiseases,
        healthRecordCount: record.healthRecords.length,
        healthRiskAssessment: healthRisk,
        recommendations,
        lastUpdated: record.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== Admin Routes ====================

// GET: All ABHA records (admin only)
router.get('/admin/records', (req, res) => {
  try {
    const records = abhaStore.getAllRecords();
    res.json({
      success: true,
      totalRecords: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET: Search ABHA records
router.get('/admin/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const results = abhaStore.searchRecords(q);
    res.json({
      success: true,
      query: q,
      results: results.map(r => ({
        abhaId: r.abhaId,
        name: r.name,
        phone: r.phoneNumber,
        registeredAt: r.registeredAt
      })),
      totalResults: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
