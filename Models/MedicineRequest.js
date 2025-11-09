const mongoose = require('mongoose');

const medicineRequestSchema = new mongoose.Schema(
  {
    // The user who made the request
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Either medicineName or prescriptionUrl is required
    medicineName: {
      type: String,
      trim: true,
    },
    prescriptionUrl: {
      type: String, // Cloudflare R2 URL
    },
    additionalNotes: {
      type: String,
    },
    // Status for pharmacies to update
    status: {
      type: String,
      enum: ['pending', 'quoted', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Add a validator to ensure either medicineName or prescriptionUrl exists
medicineRequestSchema.pre('validate', function(next) {
  if (!this.medicineName && !this.prescriptionUrl) {
    next(new Error('Either medicine name or prescription is required.'));
  } else {
    next();
  }
});

module.exports = mongoose.models.MedicineRequest || mongoose.model('MedicineRequest', medicineRequestSchema);