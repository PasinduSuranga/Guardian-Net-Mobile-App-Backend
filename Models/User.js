const mongoose = require('mongoose');

// ---------------------------------------------------------------
// User Model (Schema)
// ---------------------------------------------------------------
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
});

// Create and export the model
const User = mongoose.model('User', UserSchema);
module.exports = User;
