const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // ... (user, caregiver, patientName, etc... no changes here)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true, trim: true },
    guardianName: { type: String, required: true, trim: true },
    guardianContact: { type: String, required: true },
    careType: { type: String, enum: ['Home care', 'Hospital care'], required: true },
    address: { type: String },
    hospitalName: { type: String },
    wardNumber: { type: String },
    dayType: { type: String, enum: ['One Day', 'Multiple Days'], required: true },
    singleDate: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    packageType: { type: String, required: true, enum: ['Full Day Care', 'Half Day Care'] },
    totalPrice: { type: Number, required: true },
    
    // --- UPDATED PAYMENT FIELDS ---
    paymentStatus: {
      type: String,
      enum: [
        'pending_advance',        // Initial state
        'pending_verification',     // Advance receipt submitted
        'advance_paid',           // Advance approved
        'pending_final_verification', // Final payment (cash or bank) submitted
        'fully_paid'              // Final payment approved
      ],
      default: 'pending_advance',
    },
    advancePaid: {
      type: Number,
      default: 0,
    },
    paymentReceiptUrl: {
      type: String, // URL for the advance receipt
    },
    finalPaymentReceiptUrl: {
      type: String, // URL for the final payment receipt
    },
    // ----------------------------

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'cancelled', 'completed'], // 👈 ADDED 'in_progress'
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);