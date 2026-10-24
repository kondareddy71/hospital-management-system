/**
 * ABHA (Ayushman Bharat Health Account) Utilities
 * Handles all ABHA-related operations and validations
 */

// Generate ABHA ID format: XX-XXXX-XXXX-XXXX (14 digits)
const generateABHAId = () => {
  const part1 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${part1}-${part2}-${part3}-${part4}`;
};

// Validate ABHA ID format
const validateABHAId = (abhaId) => {
  const regex = /^\d{2}-\d{4}-\d{4}-\d{4}$/;
  return regex.test(abhaId);
};

// Validate Aadhar number (12 digits)
const validateAadhar = (aadhar) => {
  return /^\d{12}$/.test(aadhar);
};

// Validate phone number (10 digits)
const validatePhone = (phone) => {
  return /^\d{10}$/.test(phone);
};

// Create ABHA health record
const createABHARecord = (data) => {
  return {
    abhaId: data.abhaId,
    phoneNumber: data.phoneNumber,
    aadharNumber: data.aadharNumber,
    name: data.name,
    email: data.email || null,
    dob: data.dob || null,
    gender: data.gender || null,
    registeredAt: new Date().toLocaleDateString(),
    lastUpdated: new Date().toISOString(),
    healthRecords: [],
    consents: {
      emergencyAccess: true,
      hospitalSharing: false,
      pharmacySharing: false,
      researchSharing: false
    },
    allergies: data.allergies || [],
    bloodType: data.bloodType || "Not specified",
    chronicDiseases: data.chronicDiseases || [],
    emergencyContacts: data.emergencyContacts || []
  };
};

// Create portable health record (PHR)
const createPortableHealthRecord = (abhaRecord, patientData) => {
  return {
    abhaId: abhaRecord.abhaId,
    patientName: abhaRecord.name,
    registeredDate: abhaRecord.registeredAt,
    bloodType: abhaRecord.bloodType,
    allergies: abhaRecord.allergies,
    chronicDiseases: abhaRecord.chronicDiseases,
    medicalHistory: patientData ? [{
      disease: patientData.disease,
      doctor: patientData.doctor,
      medicines: patientData.medicines,
      billAmount: patientData.total,
      date: patientData.appointmentDate
    }] : [],
    consents: abhaRecord.consents,
    lastUpdated: new Date().toISOString(),
    portabilityStatus: "Active - Available for any healthcare provider",
    dataIntegrity: generateDataHash(abhaRecord)
  };
};

// Generate data integrity hash
const generateDataHash = (data) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// Encrypt sensitive data
const encryptData = (data, key = process.env.ENCRYPTION_KEY || 'default-secret-key') => {
  const crypto = require('crypto');
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Decrypt sensitive data
const decryptData = (encryptedData, key = process.env.ENCRYPTION_KEY || 'default-secret-key') => {
  try {
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
};

// Log consent changes for audit trail
const logConsentChange = (abhaId, consentType, status, doctorId = null) => {
  return {
    abhaId,
    consentType,
    status,
    doctorId,
    timestamp: new Date().toISOString(),
    ipAddress: null, // Can be set by the route handler
    deviceInfo: null  // Can be set by the route handler
  };
};

// Calculate health risk score based on medical history
const calculateHealthRiskScore = (medicalHistory) => {
  let riskScore = 0;
  
  if (!medicalHistory || medicalHistory.length === 0) {
    return { score: 0, level: 'Low', status: 'Healthy' };
  }
  
  const chronicDiseases = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease'];
  const severeConditions = ['Cancer', 'High Blood Pressure', 'Severe Asthma'];
  
  medicalHistory.forEach(record => {
    if (severeConditions.includes(record.disease)) {
      riskScore += 10;
    } else if (chronicDiseases.includes(record.disease)) {
      riskScore += 5;
    } else {
      riskScore += 1;
    }
  });
  
  let level = 'Low';
  let status = 'Healthy';
  
  if (riskScore <= 5) {
    level = 'Low';
    status = 'Healthy';
  } else if (riskScore <= 15) {
    level = 'Moderate';
    status = 'Monitor Health';
  } else if (riskScore <= 30) {
    level = 'High';
    status = 'Consult Doctor';
  } else {
    level = 'Critical';
    status = 'Urgent Medical Attention';
  }
  
  return { score: riskScore, level, status };
};

// Generate recommendations
const generateHealthRecommendations = (abhaRecord) => {
  const recommendations = [];
  
  if (!abhaRecord.bloodType || abhaRecord.bloodType === 'Not specified') {
    recommendations.push('Get your blood type tested and updated');
  }
  
  if (abhaRecord.allergies.length === 0) {
    recommendations.push('Document any food or medication allergies');
  }
  
  if (abhaRecord.chronicDiseases.length === 0) {
    recommendations.push('Keep your chronic disease records updated');
  }
  
  if (!abhaRecord.consents.pharmacySharing) {
    recommendations.push('Enable pharmacy data sharing for faster prescriptions');
  }
  
  if (!abhaRecord.emergencyContacts || abhaRecord.emergencyContacts.length === 0) {
    recommendations.push('Add emergency contact details');
  }
  
  return recommendations;
};

// Export all utilities
module.exports = {
  generateABHAId,
  validateABHAId,
  validateAadhar,
  validatePhone,
  createABHARecord,
  createPortableHealthRecord,
  generateDataHash,
  encryptData,
  decryptData,
  logConsentChange,
  calculateHealthRiskScore,
  generateHealthRecommendations
};
