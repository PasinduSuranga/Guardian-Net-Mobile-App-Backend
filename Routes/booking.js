const express = require('express');
const router = express.Router();
const { createBookingRequest, getBookingById, updateBooking, confirmBooking, generatePaymentUrl, submitAdvancePayment, caregiverCheckIn, submitFinalPayment } = require('../controllers/bookingController');
const protect = require('../Utils/authMiddleware'); // Your auth middleware

// @route   POST /api/bookings/request
// @desc    Create a new booking request
// @access  Private (User must be logged in)
router.post('/request', protect, createBookingRequest);


router.get('/:id', protect, getBookingById);


router.put('/:id', protect, updateBooking);


router.put('/:id/confirm', protect, confirmBooking);


router.post('/:id/payment-url', protect, generatePaymentUrl);

// @route   PUT /api/bookings/:id/submit-advance
// @desc    Submit the advance payment details (amount and URL)
// @access  Private
router.put('/:id/submit-advance', protect, submitAdvancePayment);


router.put('/:id/check-in', protect, caregiverCheckIn);

// @route   PUT /api/bookings/:id/submit-final-payment
// @desc    User submits their final payment (cash or bank)
// @access  Private (User)
router.put('/:id/submit-final-payment', protect, submitFinalPayment);

// You can add more routes here later, e.g.:
// router.get('/my-bookings', protect, getMyBookings);
// router.put('/:id/confirm', protect, confirmBooking); // For caregivers

module.exports = router;