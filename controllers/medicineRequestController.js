const MedicineRequest = require('../Models/MedicineRequest');
const Notification = require('../Models/notification');
const { s3Client } = require('../config/s3Client');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require('crypto');
const mongoose = require('mongoose');

// @desc    Create a new medicine request
exports.createMedicineRequest = async (req, res) => {
  try {
    // 1. Get all data from the body
    const {
      medicineName,
      prescriptionUrl,
      additionalNotes,
    } = req.body;

    // 2. Crucial Validation: Check if one of the two is present
    if (!medicineName && !prescriptionUrl) {
      return res.status(400).json({ message: 'Either medicine name or prescription is required' });
    }

    // 3. Create the new request
    const newRequest = new MedicineRequest({
      user: req.user.id, // From 'protect' middleware
      medicineName,
      prescriptionUrl,
      additionalNotes,
      status: 'pending',
    });

    // 4. Save to DB
    await newRequest.save();

    // 5. Create a notification for the user
    const notification = new Notification({
      user: req.user.id,
      medicineRequest: newRequest._id, // 👈 Link to the medicine request
      message: 'Your medicine request has been sent to nearby pharmacies.'
    });
    await notification.save();

    res.status(201).json({ message: 'Medicine request submitted successfully.', request: newRequest });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// @desc    Generate a presigned URL for prescription upload
exports.generatePrescriptionUploadUrl = async (req, res) => {
  try {
    const { contentType } = req.body;
    if (!contentType) {
      return res.status(400).json({ message: 'contentType is required.' });
    }

    const randomBytes = crypto.randomBytes(16).toString('hex');
    // Ensure extension is safe
    const extension = contentType.split('/')[1] ? contentType.split('/')[1].replace(/[^a-zA-Z0-9]/g, '') : 'dat';
    const key = `prescriptions/${req.user.id}/${randomBytes}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.json({ uploadUrl, fileUrl });

  } catch (err) {
    console.error("Error generating prescription URL:", err);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.getMedicineRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = await MedicineRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Security check: only the user who made it can see it
    if (request.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(request);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};