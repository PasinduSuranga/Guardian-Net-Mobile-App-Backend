const Booking = require('../Models/Booking');
const Notification = require('../Models/notification');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { PutObjectCommand } = require("@aws-sdk/client-s3"); // 👈 --- THIS IS THE FIX ---
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require('../config/s3Client');


// This function receives the data from your app's booking screen
exports.createBookingRequest = async (req, res) => {
  try {
    // 1. Get all the data from the request body
    const {
      caregiverId,
      patientName,
      guardianName,
      guardianContact,
      careType,
      address,
      hospitalName,
      wardNumber,
      dayType,
      singleDate,
      startDate,
      endDate,
      packageType, // 👈 ADDED
      totalPrice,  // 👈 ADDED
    } = req.body;

    // 2. Get the user's ID from the 'protect' middleware
    const userId = req.user.id;

    // 3. Basic Validation
    if (!caregiverId || !patientName || !guardianName || !guardianContact || !packageType || !totalPrice) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 4. Create the new booking document
    const newBooking = new Booking({
      user: userId,
      caregiver: caregiverId,
      patientName,
      guardianName,
      guardianContact,
      careType,
      address,
      hospitalName,
      wardNumber,
      dayType,
      singleDate: dayType === 'One Day' ? new Date(singleDate) : null,
      startDate: dayType === 'Multiple Days' ? new Date(startDate) : null,
      endDate: dayType === 'Multiple Days' ? new Date(endDate) : null,
      packageType, // 👈 ADDED
      totalPrice,  // 👈 ADDED
      status: 'pending',
    });

    // 5. Save it to the database
    await newBooking.save();

    // 6. Create a "pending" notification for the user
    const newNotification = new Notification({
      user: userId,
      booking: newBooking._id,
      message: 'Your booking request is pending confirmation.',
    });
    await newNotification.save();

    // 7. Send the success response
    res.status(201).json({
      message: 'Booking request sent successfully. Please wait for confirmation.',
      booking: newBooking,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};


exports.getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // --- THIS IS THE FIX ---
    // You MUST add .populate() here to attach the caregiver's name
    const booking = await Booking.findById(bookingId)
      //.populate('caregiver', 'name'); 
    // -----------------------
      
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // This security check is still correct
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // This will now send the full booking object with the caregiver's name
    res.json(booking);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking can no longer be edited' });
    }

    // Get the new details from the body
    const {
      patientName,
      guardianName,
      guardianContact,
      careType,
      address,
      hospitalName,
      wardNumber,
      dayType,
      singleDate,
      startDate,
      endDate,
      packageType, // 👈 ADDED
      totalPrice,  // 👈 ADDED
    } = req.body;

    // Update the booking object
    booking.patientName = patientName || booking.patientName;
    booking.guardianName = guardianName || booking.guardianName;
    booking.guardianContact = guardianContact || booking.guardianContact;
    booking.careType = careType || booking.careType;
    booking.address = address; 
    booking.hospitalName = hospitalName; 
    booking.wardNumber = wardNumber; 
    booking.dayType = dayType || booking.dayType;
    booking.singleDate = dayType === 'One Day' ? new Date(singleDate) : null;
    booking.startDate = dayType === 'Multiple Days' ? new Date(startDate) : null;
    booking.endDate = dayType === 'Multiple Days' ? new Date(endDate) : null;
    booking.packageType = packageType || booking.packageType; // 👈 ADDED
    booking.totalPrice = totalPrice || booking.totalPrice;   // 👈 ADDED

    // Save the updated booking
    await booking.save();

    res.json({ message: 'Booking updated successfully', booking });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating booking' });
  }
};


exports.confirmBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const caregiverId = req.user.id; // Get the caregiver ID from their auth token

    // 1. Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 2. Check if this caregiver is authorized
    if (booking.caregiver.toString() !== caregiverId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 3. Update the booking status
    booking.status = 'confirmed';
    await booking.save();

    // 4. Create a notification for the USER who made the booking
    const notification = new Notification({
      user: booking.user, // The ID of the user who made the request
      booking: booking._id,
      message: 'Your booking request has been confirmed!',
    });
    await notification.save();

    res.json({ message: 'Booking confirmed successfully', booking });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while confirming booking' });
  }
};


exports.generatePaymentUrl = async (req, res) => {
  try {
    const { contentType } = req.body;
    const bookingId = req.params.id;
    const userId = req.user.id;

    if (!contentType) {
      return res.status(400).json({ message: 'contentType is required.' });
    }

    // Create a unique file key
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const extension = contentType.split('/')[1] || 'jpg';
    const key = `receipts/${userId}/${bookingId}-${randomBytes}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Get the presigned URL (expires in 10 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.json({ uploadUrl, fileUrl });

  } catch (err) {
    console.error("Error generating payment URL:", err);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.submitAdvancePayment = async (req, res) => {
  try {
    const { paymentReceiptUrl, amountPaid } = req.body;
    const bookingId = req.params.id;
    
    if (!paymentReceiptUrl || !amountPaid) {
      return res.status(400).json({ message: 'Receipt URL and amount are required.' });
    }

    // 1. Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 2. Check user authorization
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 3. Update the booking with payment details
    booking.paymentReceiptUrl = paymentReceiptUrl;
    booking.advancePaid = amountPaid;
    booking.paymentStatus = 'pending_verification';
    await booking.save();

    // 4. Create notification: "Advance payment submitted for verification"
    const notification = new Notification({
      user: booking.user,
      booking: booking._id,
      message: 'Your advance payment receipt has been submitted for verification.',
    });
    await notification.save();

    res.json({ message: 'Advance payment submitted.', booking });

  } catch (err) {
    console.error("Error submitting advance:", err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.caregiverCheckIn = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const caregiverId = req.user.id; // Get caregiver from auth

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Security check
    if (booking.caregiver.toString() !== caregiverId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Business logic check
    if (booking.status !== 'confirmed' || booking.paymentStatus !== 'advance_paid') {
      return res.status(400).json({ message: 'Booking is not confirmed or advance is not paid' });
    }

    // Update status
    booking.status = 'in_progress';
    await booking.save();

    // Create notifications for the user
    const startNotification = new Notification({
      user: booking.user,
      booking: booking._id,
      message: 'Your caregiver has checked in and the job has started!',
    });
    await startNotification.save();

    const paymentNotification = new Notification({
      user: booking.user,
      booking: booking._id,
      message: 'Please settle the remaining balance for your booking.',
    });
    await paymentNotification.save();
    
    res.json({ message: 'Check-in successful. Job started.' });

  } catch (err) {
    console.error("Check-in failed:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- ADDED: Submit Final Payment ---
exports.submitFinalPayment = async (req, res) => {
  try {
    const { paymentMethod, paymentReceiptUrl } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    let notificationMessage = '';

    if (paymentMethod === 'bank') {
      if (!paymentReceiptUrl) {
        return res.status(400).json({ message: 'Receipt URL is required for bank transfer' });
      }
      booking.finalPaymentReceiptUrl = paymentReceiptUrl;
      booking.paymentStatus = 'pending_verification'; // Admin must verify
      notificationMessage = 'Your final payment receipt has been submitted for verification.';

    } else if (paymentMethod === 'cash') {
      booking.paymentStatus = 'pending_final_verification'; // Caregiver must verify
      notificationMessage = 'You have marked the final payment as cash. Waiting for caregiver to confirm receipt.';
    
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    
    await booking.save();

    // Create notification for the user
    const notification = new Notification({
      user: booking.user,
      booking: booking._id,
      message: notificationMessage,
    });
    await notification.save();

    res.json({ message: 'Final payment details submitted.' });

  } catch (err) {
    console.error("Submitting final payment failed:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
// --- Make sure to export the new function ---
