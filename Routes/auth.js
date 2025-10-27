const express = require('express');
const router = express.Router();

// Import controller functions
const {
  registerUser,
  verifyOtp,
  loginUser
} = require('../controllers/AuthController');

// ---------------------------------------------------------------
// Define API Routes
// ---------------------------------------------------------------

// @route   POST /api/auth/register
// @desc    Register a new user and send OTP
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/verify-otp
// @desc    Verify user's OTP
// @access  Public
router.post('/verify-otp', verifyOtp);

// @route   POST /api/auth/login
// @desc    Log in a verified user
// @access  Public
router.post('/login', loginUser);

module.exports = router;
