const { v4: uuidv4 } = require('uuid');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP for email verification
 * @param {string} email
 * @returns {string} Generated OTP
 */
function createOTP(email) {
  const otp = generateOTP();
  const normalizedEmail = email.toLowerCase().trim();
  
  otpStore.set(normalizedEmail, {
    otp,
    createdAt: Date.now(),
    attempts: 0
  });
  
  // Cleanup after expiry
  setTimeout(() => {
    otpStore.delete(normalizedEmail);
  }, OTP_EXPIRY_MS);
  
  return otp;
}

/**
 * Verify OTP for email
 * @param {string} email
 * @param {string} otp
 * @returns {object} { valid: boolean, message: string }
 */
function verifyOTP(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);
  
  if (!record) {
    return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  }
  
  // Check expiry
  if (Date.now() - record.createdAt > OTP_EXPIRY_MS) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: 'OTP expired. Please request a new one.' };
  }
  
  // Rate limit attempts
  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
  }
  
  record.attempts += 1;
  
  if (record.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  // OTP verified successfully
  otpStore.delete(normalizedEmail);
  return { valid: true, message: 'Email verified successfully!' };
}

/**
 * Send OTP via email (simulated in development)
 * In production, use SendGrid, Resend, or similar
 * @param {string} email
 * @param {string} otp
 */
async function sendOTPEmail(email, otp) {
  // In development, just log the OTP
  console.log(`
  ================================================
  📧 OTP EMAIL to: ${email}
  ================================================
  
  Your WeddingEase verification code is: ${otp}
  
  This code expires in 10 minutes.
  
  ================================================
  `);
  
  // In production, integrate with email service:
  // await sendgrid.send({
  //   to: email,
  //   from: 'noreply@weddingease.com',
  //   subject: 'Your WeddingEase verification code',
  //   html: `<h1>Your code: ${otp}</h1><p>Expires in 10 minutes.</p>`
  // });
  
  return { sent: true };
}

module.exports = {
  createOTP,
  verifyOTP,
  sendOTPEmail
};
