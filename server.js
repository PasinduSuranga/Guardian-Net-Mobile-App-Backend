// ---------------------------------------------------------------
// Main Server (server.js)
// ---------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./Routes/auth');

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

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

