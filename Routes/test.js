const express = require('express');
const router = express.Router();
const { testConfirmBooking, testVerifyPayment, testFinalVerify, testCaregiverCheckIn, testQuoteMedicineRequest, testAcceptMedicineOrder, testVerifyMedicinePayment } = require('../controllers/testController');

// @route   GET /api/test/confirm-booking/:id
// @desc    Manually confirms a booking and creates a notification
// @access  Public (for testing only)
router.get('/confirm-booking/:id', testConfirmBooking);

router.get('/verify-payment/:id', testVerifyPayment);


router.get('/final-verify/:id', testFinalVerify);

router.get('/check-in/:id', testCaregiverCheckIn);


router.get('/quote-medicine/:id', testQuoteMedicineRequest);


router.get('/accept-medicine-order/:id', testAcceptMedicineOrder);


router.get('/verify-medicine-payment/:id', testVerifyMedicinePayment);

module.exports = router;