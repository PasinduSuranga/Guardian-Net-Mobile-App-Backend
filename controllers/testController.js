const Booking = require('../Models/Booking');
const Notification = require('../Models/notification');
const mongoose = require('mongoose');
const MedicineRequest = require('../Models/MedicineRequest');
const MedicineOrder = require('../Models/MedicineOrder');

exports.testConfirmBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // 1. Check if it's a valid ID format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).send('Invalid Booking ID format');
    }

    // 2. Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send(`Booking not found with ID: ${bookingId}`);
    }

    // 3. Update the booking status
    booking.status = 'confirmed';
    await booking.save();

    // --- THIS IS THE FIX ---
    // 4. Create the "Booking Confirmed" notification
    const confirmNotification = new Notification({
      user: booking.user,       // The ID of the user who made the booking
      booking: booking._id,     // The ID of this booking
      message: 'Your booking request has been confirmed!',
    });
    await confirmNotification.save();

    // 5. Create the "Payment Pending" notification
    const paymentNotification = new Notification({
      user: booking.user,
      booking: booking._id,
      message: 'Please pay the advance to finalize your booking.',
    });
    await paymentNotification.save();
    // -----------------------

    // 6. Send a success message to your browser
    res.status(200).send(`
      <h1>Success!</h1>
      <p>Booking ID: ${booking._id} has been set to "confirmed".</p>
      <p><b>Two notifications</b> created for User ID: ${booking.user}</p>
      <ol>
        <li>Your booking request has been confirmed!</li>
        <li>Please pay the advance to finalize your booking.</li>
      </ol>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
};


exports.testVerifyPayment = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // 1. Check for valid ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).send('Invalid Booking ID format');
    }

    // 2. Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send(`Booking not found with ID: ${bookingId}`);
    }

    // 3. Check if it's ready for verification
    if (booking.paymentStatus !== 'pending_verification') {
      return res.status(400).send(`
        <h1>Error</h1>
        <p>Booking status is <b>${booking.paymentStatus}</b>.</p>
        <p>Must be "pending_verification" to be verified.</p>
      `);
    }

    // 4. Update the payment status
    booking.paymentStatus = 'advance_paid';
    await booking.save();

    // 5. Create the "Advance Verified" notification
    const notification = new Notification({
      user: booking.user,
      booking: booking._id,
      message: 'Your advance payment has been verified! Your booking is now active.'
    });
    await notification.save();

    // 6. Send success response
    res.status(200).send(`
      <h1>Success!</h1>
      <p>Booking ID: ${booking._id} payment status set to "advance_paid".</p>
      <p>Notification created for User ID: ${booking.user}</p>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
};    


exports.testFinalVerify = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).send('Invalid Booking ID format');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send(`Booking not found with ID: ${bookingId}`);
    }

    // Check if it's ready for final verification
    if (booking.paymentStatus !== 'pending_verification' && booking.paymentStatus !== 'pending_final_verification') {
      return res.status(400).send(`<h1>Error</h1><p>Booking status is <b>${booking.paymentStatus}</b>. Cannot verify.</p>`);
    }

    // Update status to "fully_paid" and job to "completed"
    booking.paymentStatus = 'fully_paid';
    booking.status = 'completed';
    await booking.save();

    // Create the final notification
    const notification = new Notification({
      user: booking.user,
      booking: booking._id,
      message: 'Your final payment has been verified. This booking is now complete.'
    });
    await notification.save();

    res.status(200).send(`
      <h1>Success!</h1>
      <p>Booking ID: ${booking._id} status set to "completed" and payment set to "fully_paid".</p>
      <p>Final notification sent to User ID: ${booking.user}</p>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
};


exports.testCaregiverCheckIn = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).send('Invalid Booking ID format');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send(`Booking not found with ID: ${bookingId}`);
    }

    // 1. Check business logic: Must be confirmed AND advance paid
    if (booking.status !== 'confirmed') {
      return res.status(400).send(`<h1>Error</h1><p>Booking status is <b>"${booking.status}"</b>. Must be "confirmed" to check in.</p>`);
    }
    if (booking.paymentStatus !== 'advance_paid') {
      return res.status(400).send(`<h1>Error</h1><p>Payment status is <b>"${booking.paymentStatus}"</b>. Must be "advance_paid" to check in.</p>`);
    }

    // 2. Update status
    booking.status = 'in_progress';
    await booking.save();

    // 3. Create notifications for the user
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

    // 4. Send response
    res.status(200).send(`
      <h1>Success!</h1>
      <p>Booking ID: ${booking._id} status set to <b>"in_progress"</b>.</p>
      <p>Two notifications created for User ID: ${booking.user}:</p>
      <ol>
        <li>Job started!</li>
        <li>Please settle remaining balance.</li>
      </ol>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
};


exports.testQuoteMedicineRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    // 1. Check ID
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).send('Invalid Request ID format');
    }

    // 2. Find the medicine request
    const request = await MedicineRequest.findById(requestId);
    if (!request) {
      return res.status(404).send(`MedicineRequest not found with ID: ${requestId}`);
    }

    // 3. Check status
    if (request.status !== 'pending') {
      return res.status(400).send(`<h1>Error</h1><p>Request status is already "<b>${request.status}</b>".</p>`);
    }

    // 4. Update status to 'quoted'
    request.status = 'quoted';
    await request.save();

    // 5. Create the notification for the user
    const notification = new Notification({
      user: request.user,
      medicineRequest: request._id,
      message: 'A pharmacy has responded to your medicine request.'
    });
    await notification.save();

    // 6. Send success response
    res.status(200).send(`
      <h1>Success!</h1>
      <p>MedicineRequest ID: ${request._id} status set to "<b>quoted</b>".</p>
      <p>Notification sent to User ID: ${request.user}</p>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
};


exports.testAcceptMedicineOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send('Invalid Order ID format');
    }

    const order = await MedicineOrder.findById(orderId);
    if (!order) {
      return res.status(404).send(`MedicineOrder not found with ID: ${orderId}`);
    }

    // 1. Update status
    order.status = 'ready_for_pickup';
    await order.save();

    // 2. Create notification
    const notification = new Notification({
      user: order.user,
      medicineOrder: order._id,
      message: `Your order from ${order.pharmacyName} is ready for pickup!`
    });
    await notification.save();

    res.status(200).send(`
      <h1>Success!</h1>
      <p>MedicineOrder ID: ${order._id} status set to "<b>ready_for_pickup</b>".</p>
      <p>Notification sent to User ID: ${order.user}</p>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
};


exports.testVerifyMedicinePayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send('Invalid Order ID format');
    }

    const order = await MedicineOrder.findById(orderId);
    if (!order) {
      return res.status(404).send(`MedicineOrder not found with ID: ${orderId}`);
    }

    if (order.status !== 'payment_pending_verification') {
       return res.status(400).send(`<h1>Error</h1><p>Order status is "<b>${order.status}</b>". Must be "payment_pending_verification".</p>`);
    }

    // 1. Update status
    order.status = 'completed';
    await order.save();

    // 2. Create notification
    const notification = new Notification({
      user: order.user,
      medicineOrder: order._id,
      message: `Your final payment for ${order.pharmacyName} is confirmed. Thank you!`
    });
    await notification.save();

    res.status(200).send(`
      <h1>Success!</h1>
      <p>MedicineOrder ID: ${order._id} status set to "<b>completed</b>".</p>
      <p>Final notification sent to User ID: ${order.user}</p>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
};
// ---------------------------

// --- Make sure to export all four ---
