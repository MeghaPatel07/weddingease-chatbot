const { checkUsageLimit } = require('../services/usageService');

/**
 * Rate limiting middleware based on usage quotas
 */
function rateLimitMiddleware(req, res, next) {
  // Get identifier (user ID or IP)
  const identifier = req.user?.id || req.ip || 'unknown';
  const tier = req.userTier || 'guest';
  
  const usage = checkUsageLimit(identifier, tier);
  
  // Add usage info to response headers
  res.set('X-RateLimit-Limit', usage.limit.toString());
  res.set('X-RateLimit-Remaining', usage.remaining.toString());
  res.set('X-RateLimit-Reset', usage.resetsAt);
  
  if (!usage.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: tier === 'guest' 
        ? 'You\'ve used all your free messages for today. Sign up for free to get 10 messages/day, or upgrade to Premium for unlimited access!'
        : 'You\'ve reached your daily message limit. Upgrade to Premium for unlimited access!',
      usage,
      upgrade_options: {
        free: {
          description: 'Create a free account',
          benefit: '10 messages per day + save preferences'
        },
        premium: {
          description: 'Upgrade to Premium',
          price: '₹499/month',
          benefits: [
            'Unlimited messages',
            'Priority vendor responses',
            'Expert human assistance',
            'Exclusive discounts'
          ]
        }
      }
    });
  }
  
  next();
}

module.exports = { rateLimitMiddleware };
