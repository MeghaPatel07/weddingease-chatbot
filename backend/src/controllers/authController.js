const { v4: uuidv4 } = require('uuid');
const { createOTP, verifyOTP, sendOTPEmail } = require('../services/emailService');
const { generateToken } = require('../middleware/auth');
const { linkSessionToUser } = require('../services/sessionService');

// Simple in-memory user store (use database in production)
const users = new Map();

/**
 * Request OTP for email verification
 */
async function requestOTP(req, res) {
  try {
    const { email } = req.body;
    
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address.'
      });
    }
    
    // Generate and send OTP
    const otp = createOTP(email);
    await sendOTPEmail(email, otp);
    
    res.json({
      success: true,
      message: 'OTP sent successfully! Check your email.',
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });
    
  } catch (error) {
    console.error('[Auth] OTP request error:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
      message: 'Please try again later.'
    });
  }
}

/**
 * Verify OTP and create/login user
 */
async function verifyOTPHandler(req, res) {
  try {
    const { email, otp, sessionId } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'Email and OTP are required.'
      });
    }
    
    // Verify OTP
    const result = verifyOTP(email, otp);
    
    if (!result.valid) {
      return res.status(400).json({
        error: 'Verification failed',
        message: result.message
      });
    }
    
    // Get or create user
    const normalizedEmail = email.toLowerCase().trim();
    let user = users.get(normalizedEmail);
    
    if (!user) {
      // Create new user
      user = {
        id: uuidv4(),
        email: normalizedEmail,
        tier: 'free',
        createdAt: Date.now()
      };
      users.set(normalizedEmail, user);
    }
    
    // Link session to user if provided
    if (sessionId) {
      linkSessionToUser(sessionId, user.id);
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier
      },
      token
    });
    
  } catch (error) {
    console.error('[Auth] OTP verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'Please try again.'
    });
  }
}

/**
 * Get current user info
 */
function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please log in.'
    });
  }
  
  res.json({
    user: req.user,
    tier: req.userTier
  });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  requestOTP,
  verifyOTPHandler,
  getCurrentUser
};
