const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Import controller functions
const {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
  updateProfile,
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


router.post(
    '/forgot-password',
    [check('email', 'Please include a valid email').isEmail()],
    forgotPassword
),


router.post(
    '/verify-reset-otp',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6}),
    ],
    verifyResetOtp
);


router.post(
    '/reset-password',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
        check(
            'newPassword',
            'Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number'
        ).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
    ],
    resetPassword 
    );
    
module.exports = router;
