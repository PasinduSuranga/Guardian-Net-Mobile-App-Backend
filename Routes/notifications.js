const express = require('express');
const router = express.Router();
const { 
  getMyNotifications, 
  markAsRead 
} = require('../controllers/notificationController');
const protect = require('../Utils/authMiddleware');

// @route   GET /api/notifications
// @desc    Get all notifications for the logged-in user
// @access  Private
router.get('/', protect, getMyNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.put('/:id/read', protect, markAsRead);

module.exports = router;