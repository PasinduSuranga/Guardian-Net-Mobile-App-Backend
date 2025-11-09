// ---------------------------------------------------------------
// Main Server (server.js)
// ---------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./Routes/auth');
const userRoutes = require('./Routes/user');
const bookingRoutes = require('./Routes/booking');
const notificationRoutes = require('./Routes/notifications'); // 👈 ADD THIS
const testRoutes = require('./Routes/test');
const medicinRoutes = require('./Routes/medicineRequestRoutes');
const medicineOrderRoutes = require('./Routes/medicineOrderRoutes');

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors()); // Allow requests from your React Native app
app.use(bodyParser.json()); // Parse incoming JSON requests

// API Routes
// All auth routes will be prefixed with /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes); // 👈 ADD THIS
app.use('/api/test', testRoutes);
app.use('/api/medicine-requests', medicinRoutes);
app.use('/api/medicine-orders', medicineOrderRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

