// ---------------------------------------------------------------
// Imports
// ---------------------------------------------------------------
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/User'); // Import User model
const { sendOTPEmail } = require('../Utils/Email'); // Import email helper
require('dotenv').config();

// ---------------------------------------------------------------
// [ POST /api/auth/register ]
// Handles new user registration.
// ---------------------------------------------------------------
exports.registerUser = async (req, res) => {
  const { name, contactNumber, email, password, confirmPassword } = req.body;

  // --- 1. Validation ---
  if (!name || !contactNumber || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // --- 2. Check if user already exists ---
    let existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'An active account with this email already exists' });
    }

    // --- 3. Generate OTP ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // --- 4. Send OTP Email ---
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Error sending verification email' });
    }

    // --- 5. Hash Password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- 6. Save or Update User ---
    if (existingUser) {
      // User exists but is not verified, update their info and OTP
      existingUser.name = name;
      existingUser.contactNumber = contactNumber;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      existingUser.isVerified = false; // Ensure it's set to false
      await existingUser.save();
    } else {
      // New user, create and save
      const newUser = new User({
        name,
        contactNumber,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
      });
      await newUser.save();
    }

    // --- 7. Send Success Response ---
    res.status(201).json({
      message: 'Registration successful! Please check your email for an OTP to verify your account.',
      email: email // Send back email to pre-fill verification screen
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ---------------------------------------------------------------
// [ POST /api/auth/verify-otp ]
// Verifies the OTP sent to the user's email.
// ---------------------------------------------------------------
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    // --- 1. Find User ---
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register again.' });
    }

    // --- 2. Check Verification Status ---
    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. Please log in.' });
    }

    // --- 3. Check OTP Validity ---
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // --- 4. Check OTP Expiry ---
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please register again to get a new one.' });
    }

    // --- 5. Success! Update User ---
    user.isVerified = true;
    user.otp = undefined; // Clear OTP
    user.otpExpires = undefined; // Clear expiry
    await user.save();
    
    // --- 6. Create JWT Token for auto-login ---
    const payload = {
      user: {
        id: user.id,
        name: user.name,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    res.status(200).json({
      message: 'Account verified successfully!',
      token: token,
    });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// ---------------------------------------------------------------
// [ POST /api/auth/login ]
// Handles user login.
// ---------------------------------------------------------------
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // --- 1. Find User ---
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials (user not found)' });
    }

    // --- 2. Check Verification Status ---
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: 'Account not verified. Please check your email for an OTP.',
        // We can send a "notVerified" code to our app to handle this
        code: 'NOT_VERIFIED',
        email: user.email // Send email to pre-fill verify screen
      });
    }

    // --- 3. Check Password ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials (password incorrect)' });
    }

    // --- 4. Create and Send JWT Token ---
    const payload = {
      user: {
        id: user.id,
        name: user.name,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token: token,
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
