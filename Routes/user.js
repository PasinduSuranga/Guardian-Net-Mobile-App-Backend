const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, generateUploadUrl, changePassword, getUserActivities, } = require('../controllers/userController');
const protect = require('../Utils/authMiddleware'); // Import our new middleware

// --- Profile Routes ---
// We use router.route() to chain the GET and PUT
// Notice how we put 'authMiddleware' *before* the controller.
// This forces all requests to go through the middleware first.

router.get('/profile', protect, getProfile);  // PUT /api/users/profile


router.post('/generate-upload-url', protect, generateUploadUrl);

// PUT /api/user/profile
// This route is now simple. It just takes JSON.
// We removed the 'upload' middleware.
router.put('/profile', protect, updateProfile);


router.put('/change-password', protect, changePassword);


router.get('/activities', protect, getUserActivities);

module.exports = router;