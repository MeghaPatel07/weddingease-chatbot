// Usage tracking for soft paywall
// In production, use a database

const usageStore = new Map();

const LIMITS = {
  guest: 5,      // 5 messages per day for unauthenticated users
  free: 10,      // 10 messages per day for logged-in free users
  premium: 1000  // Essentially unlimited for premium
};

/**
 * Get or create usage record for a user/IP
 * @param {string} identifier - User ID or IP address
 * @param {string} tier - 'guest', 'free', or 'premium'
 * @returns {object} Usage record
 */
function getUsageRecord(identifier, tier = 'guest') {
  const today = new Date().toISOString().split('T')[0];
  const key = `${identifier}:${today}`;
  
  if (!usageStore.has(key)) {
    usageStore.set(key, {
      identifier,
      tier,
      date: today,
      messageCount: 0,
      lastMessageAt: null
    });
  }
  
  const record = usageStore.get(key);
  record.tier = tier; // Update tier in case user logged in
  return record;
}

/**
 * Check if user has remaining messages
 * @param {string} identifier - User ID or IP
 * @param {string} tier - User tier
 * @returns {object} { allowed: boolean, remaining: number, limit: number }
 */
function checkUsageLimit(identifier, tier = 'guest') {
  const record = getUsageRecord(identifier, tier);
  const limit = LIMITS[tier] || LIMITS.guest;
  const remaining = Math.max(0, limit - record.messageCount);
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    used: record.messageCount,
    tier,
    resetsAt: getResetTime()
  };
}

/**
 * Increment usage count after a message
 * @param {string} identifier - User ID or IP
 * @param {string} tier - User tier
 * @returns {object} Updated usage status
 */
function incrementUsage(identifier, tier = 'guest') {
  const record = getUsageRecord(identifier, tier);
  record.messageCount += 1;
  record.lastMessageAt = Date.now();
  
  return checkUsageLimit(identifier, tier);
}

/**
 * Get time until usage resets (midnight UTC)
 */
function getResetTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Cleanup old usage records (call periodically)
 */
function cleanupOldRecords() {
  const today = new Date().toISOString().split('T')[0];
  for (const key of usageStore.keys()) {
    if (!key.includes(today)) {
      usageStore.delete(key);
    }
  }
}

// Cleanup every hour
setInterval(cleanupOldRecords, 60 * 60 * 1000);

module.exports = {
  checkUsageLimit,
  incrementUsage,
  LIMITS
};
