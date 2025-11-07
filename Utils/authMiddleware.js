const jwt = require('jsonwebtoken');
const User = require('../Models/User'); // Path to your User model

// This is the middleware function
const authMiddleware = async (req, res, next) => {
  let token;

  // Check if the request has an 'Authorization' header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get the token from the header (it's "Bearer [token]")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // --- THIS IS THE FIX ---
      // We look for the ID inside the 'user' object from the payload
      req.user = await User.findById(decoded.user.id).select('-password');
      // -------------------------

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next(); // All good, proceed to the next function (the controller)
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = authMiddleware;