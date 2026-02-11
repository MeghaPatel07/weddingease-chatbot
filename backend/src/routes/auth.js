const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { 
  requestOTP, 
  verifyOTPHandler, 
  getCurrentUser 
} = require('../controllers/authController');

// Request OTP
router.post('/request-otp', requestOTP);

// Verify OTP and login
router.post('/verify-otp', verifyOTPHandler);

// Get current user (requires auth)
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
