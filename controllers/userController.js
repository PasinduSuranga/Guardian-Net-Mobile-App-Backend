const User = require('../Models/User'); // Adjust path if needed
const { s3Client } = require('../config/s3Client');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Booking = require('../Models/Booking'); // 👈 ADD THIS
const MedicineRequest = require('../Models/MedicineRequest'); // 👈 ADD THIS

// @desc    Get the logged-in user's profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  // req.user is now available because of our authMiddleware!
  if (req.user) {
    res.json(req.user); // Send all user data (except password)
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const generateUploadUrl = async (req, res) => {
  try {
    const { contentType } = req.body;
    if (!contentType) {
      return res.status(400).json({ message: 'contentType is required.' });
    }

    const userId = req.user.id;
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const extension = contentType.split('/')[1]; // e.g., 'jpeg'
    const key = `profiles/${userId}/${randomBytes}.${extension}`;

    const bucketName = process.env.R2_BUCKET_NAME;
    
    // Create the command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    // Get the presigned URL (expires in 10 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    // This is the public URL the file will have *after* upload
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.json({ uploadUrl, fileUrl });

  } catch (err) {
    console.error("Error generating upload URL:", err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update the logged-in user's profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    // The body is now simple JSON
    const { name, email, contactNumber, profilePhotoUrl } = req.body;

    // 1. Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.contactNumber = contactNumber || user.contactNumber;
    
    // If a new photo URL was provided, update it
    if (profilePhotoUrl) {
      user.profilePhotoUrl = profilePhotoUrl;
    }

    // 4. Save the updated user
    const updatedUser = await user.save();

    // 5. Send back the updated user data (minus password)
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      contactNumber: updatedUser.contactNumber,
      profilePhotoUrl: updatedUser.profilePhotoUrl,
      createdAt: updatedUser.createdAt,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};


const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Basic validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide current and new passwords' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    // 2. Get user from DB (we need the full user document, *with* password)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3. Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    // 4. Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 5. Save the user with the new password
    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- THIS IS THE FIX (Part 1) ---
// Changed 'exports.getUserActivities' to 'const getUserActivities'
const getUserActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch all caregiver bookings
    const bookings = await Booking.find({ user: userId })
      .populate('caregiver', 'name') // Get caregiver's name
      .sort({ createdAt: -1 });

    // 2. Fetch all medicine requests
    const medRequests = await MedicineRequest.find({ user: userId })
      .sort({ createdAt: -1 });

    // 3. Map bookings to a standard "activity" format
    const bookingActivities = bookings.map(b => ({
      _id: b._id,
      type: 'booking',
      status: b.status,
      paymentStatus: b.paymentStatus,
      // Create a user-friendly title
      title: `Booking: ${b.caregiver?.name || 'Caregiver'}`,
      // Create a user-friendly description
      description: `Status: ${b.status} | Payment: ${b.paymentStatus.replace('_', ' ')}`,
      createdAt: b.createdAt,
    }));

    // 4. Map medicine requests to the same "activity" format
    const medRequestActivities = medRequests.map(mr => ({
      _id: mr._id,
      type: 'medicine_request',
      status: mr.status,
      title: `Medicine Request: ${mr.medicineName || 'Prescription'}`,
      description: `Status: ${mr.status}`,
      createdAt: mr.createdAt,
    }));

    // 5. Combine both arrays
    const allActivities = [...bookingActivities, ...medRequestActivities];

    // 6. Sort the combined array by date (newest first)
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 7. Send the final list
    res.json(allActivities);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- THIS IS THE FIX (Part 2) ---
// You must add 'getUserActivities' to the module.exports
module.exports = {
  getProfile,
  updateProfile,
  generateUploadUrl,
  changePassword,
  getUserActivities, // 👈 ADDED THIS LINE
};