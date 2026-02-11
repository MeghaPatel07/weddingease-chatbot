const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'weddingease_dev_secret';

/**
 * Verify JWT token middleware
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token - continue as guest
    req.user = null;
    req.userTier = 'guest';
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userTier = decoded.tier || 'free';
    next();
  } catch (error) {
    // Invalid token - continue as guest
    req.user = null;
    req.userTier = 'guest';
    next();
  }
}

/**
 * Require authentication middleware
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this feature.'
    });
  }
  next();
}

/**
 * Generate JWT token for user
 * @param {object} user - User data
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tier: user.tier || 'free'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  verifyToken,
  requireAuth,
  generateToken
};
