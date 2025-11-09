const MedicineOrder = require('../Models/MedicineOrder');
const Notification = require('../Models/notification');
const MedicineRequest = require('../Models/MedicineRequest');
const { s3Client } = require('../config/s3Client'); // 👈 REQUIRED
const { PutObjectCommand } = require("@aws-sdk/client-s3"); // 👈 REQUIRED
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner"); // 👈 REQUIRED
const crypto = require('crypto'); // 👈 REQUIRED
const mongoose = require('mongoose');

// @desc    Create a new medicine order
exports.createMedicineOrder = async (req, res) => {
  try {
    // --- THIS IS THE FIX ---
    // We must read quantity and quantityUnit from the request body
    const {
      medicineRequestId,
      pharmacyId,
      pharmacyName,
      price,
      quantity,
      quantityUnit,
    } = req.body;

    // And validate them
    if (!medicineRequestId || !pharmacyId || !pharmacyName || !price || !quantity || !quantityUnit) {
      return res.status(400).json({ message: 'Missing required order details' });
    }

    const newOrder = new MedicineOrder({
      user: req.user.id,
      medicineRequest: medicineRequestId,
      pharmacyId,
      pharmacyName,
      price,
      quantity,     // 👈 Save the number
      quantityUnit, // 👈 Save the unit
      status: 'pending_confirmation',
    });
    // -----------------------

    await newOrder.save();
    
    await MedicineRequest.findByIdAndUpdate(medicineRequestId, { status: 'quoted' });

    const notification = new Notification({
      user: req.user.id,
      medicineOrder: newOrder._id, // Link to the new order
      message: `Your order request has been sent to ${pharmacyName}.`,
    });
    await notification.save();

    res.status(201).json({ message: 'Order request sent successfully.', order: newOrder });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};


// @desc    Get a single medicine order by ID
exports.getMedicineOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await MedicineOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Security check
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(order);

  } catch (err) {
    console.error("Failed to get medicine order:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate a presigned URL for a medicine receipt
exports.generateMedicinePaymentUrl = async (req, res) => {
  try {
    const { contentType } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;

    if (!contentType) {
      return res.status(400).json({ message: 'contentType is required.' });
    }

    const randomBytes = crypto.randomBytes(16).toString('hex');
    const extension = contentType.split('/')[1] || 'jpg';
    const key = `receipts/medicine/${userId}/${orderId}-${randomBytes}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.json({ uploadUrl, fileUrl });

  } catch (err) {
    console.error("Error generating medicine payment URL:", err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    User submits their final payment (cash or bank)
exports.submitFinalMedicinePayment = async (req, res) => {
  try {
    const { paymentMethod, paymentReceiptUrl } = req.body;
    const orderId = req.params.id;

    const order = await MedicineOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (order.status !== 'ready_for_pickup') {
      return res.status(400).json({ message: 'This order is not ready for payment.' });
    }

    let notificationMessage = '';
    order.paymentMethod = paymentMethod;

    if (paymentMethod === 'bank_transfer') {
      if (!paymentReceiptUrl) {
        return res.status(400).json({ message: 'Receipt URL is required for bank transfer' });
      }
      order.paymentReceiptUrl = paymentReceiptUrl;
      order.status = 'payment_pending_verification';
      notificationMessage = 'Your final payment receipt has been submitted for verification.';

    } else if (paymentMethod === 'cash') {
      order.status = 'payment_pending_verification'; 
      notificationMessage = 'You have marked the final payment as cash. Waiting for confirmation.';
    
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    
    // This .save() call is what was failing, but it will now work
    // because the 'quantityUnit' field is already in the document.
    await order.save();

    const notification = new Notification({
      user: order.user,
      medicineOrder: order._id,
      message: notificationMessage,
    });
    await notification.save();

    res.json({ message: 'Final payment details submitted.' });

  } catch (err) {
    console.error("Submitting final payment failed:", err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// --- Make sure to export all functions ---
