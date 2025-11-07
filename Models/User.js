const mongoose = require('mongoose');

// ---------------------------------------------------------------
// User Model (Schema)
// ---------------------------------------------------------------
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // --- ADDED ---
  profilePhotoUrl: { 
    type: String, 
    default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
  },
  // -----------

  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
}, {
  // --- ADDED ---
  // This automatically adds 'createdAt' (for joined date) and 'updatedAt'
  timestamps: true 
  // -----------
});

// Create and export the model
const User = mongoose.model('User', UserSchema);
module.exports = User;