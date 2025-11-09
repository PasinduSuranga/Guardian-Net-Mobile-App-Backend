const mongoose = require('mongoose');

const medicineOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicineRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineRequest',
      required: true,
    },
    pharmacyId: {
      type: String,
      required: true,
    },
    pharmacyName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    quantityUnit: {
      type: String,
      required: true,
      enum: ['tablets', 'days', 'units', 'bottles'],
    },
    price: { // This is the quoted price per unit
      type: Number,
      required: true,
    },
    // --- THIS IS THE FIX ---
    // The status of the order itself
    status: {
      type: String,
      enum: ['pending_confirmation', 'ready_for_pickup', 'payment_pending_verification', 'completed', 'cancelled'],
      default: 'pending_confirmation',
    },
    // The final payment method chosen by the user
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer'],
    },
    // The URL for the *final* payment receipt
    paymentReceiptUrl: {
      type: String, 
    },
    // -----------------------
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.MedicineOrder || mongoose.model('MedicineOrder', medicineOrderSchema);