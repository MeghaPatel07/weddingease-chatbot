const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { rateLimitMiddleware } = require('../middleware/rateLimit');
const { 
  handleChat, 
  getSessionInfo, 
  createNewSession,
  getUsageStatus
} = require('../controllers/chatController');

// Apply auth middleware to all routes
router.use(verifyToken);

// Chat endpoint with rate limiting
router.post('/', rateLimitMiddleware, handleChat);

// Session management
router.post('/session', createNewSession);
router.get('/session/:sessionId', getSessionInfo);

// Usage status
router.get('/usage', getUsageStatus);

module.exports = router;
