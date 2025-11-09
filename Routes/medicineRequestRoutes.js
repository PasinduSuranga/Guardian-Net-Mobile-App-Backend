const express = require('express');
const router = express.Router();
const {
  createMedicineRequest,
  generatePrescriptionUploadUrl,
  getMedicineRequestById,
} = require('../controllers/medicineRequestController');
const protect = require('../Utils/authMiddleware');

// @route   POST /api/medicine-requests
// @desc    Create a new medicine request
// @access  Private
router.post('/add', protect, createMedicineRequest);

// @route   POST /api/medicine-requests/upload-url
// @desc    Generate a presigned URL for a prescription
// @access  Private
router.post('/upload-url', protect, generatePrescriptionUploadUrl);


router.get('/:id', protect, getMedicineRequestById);

module.exports = router;