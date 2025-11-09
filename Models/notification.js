const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false, 
    },
    medicineRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineRequest',
      required: false,
    },
    // --- ADD THIS NEW FIELD ---
    medicineOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineOrder',
      required: false,
    },
    // -------------------------
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);