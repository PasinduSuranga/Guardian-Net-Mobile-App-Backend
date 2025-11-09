const express = require('express');
const router = express.Router();
const {
  createMedicineOrder,
  getMedicineOrderById,       // 👈 ADDED
  generateMedicinePaymentUrl,
  submitFinalMedicinePayment,
  // getMedicineOrderById (we'll add this later if needed)
} = require('../controllers/medicineOrderController');
const protect = require('../Utils/authMiddleware');

// @route   POST /api/medicine-orders
// @desc    Create a new medicine order from a quote
// @access  Private
router.post('/', protect, createMedicineOrder);

router.get('/:id', protect, getMedicineOrderById);

// --- ADD THIS ---
// @route   POST /api/medicine-orders/:id/payment-url
// @desc    Generate a presigned URL for a medicine receipt
// @access  Private
router.post('/:id/payment-url', protect, generateMedicinePaymentUrl);


router.put('/:id/submit-payment', protect, submitFinalMedicinePayment);

module.exports = router;