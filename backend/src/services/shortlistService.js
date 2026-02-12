// Shortlist management service
// Stores user shortlists and generates shareable links
// In production, this would use a database

const shortlistStore = new Map();

// Generate a unique shortlist ID
function generateShortlistId() {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SL-${date}-${random}`;
}

/**
 * Create a new shortlist with items
 * @param {string} userId - User ID (or session ID for guests)
 * @param {array} items - Array of item objects with id, name, price, category, etc.
 * @param {object} config - Config: {title, style, budget}
 * @returns {object} Created shortlist with ID and share link
 */
function createShortlist(userId, items, config = {}) {
  const shortlistId = generateShortlistId();
  const now = new Date().toISOString();
  
  const shortlist = {
    id: shortlistId,
    userId,
    createdAt: now,
    updatedAt: now,
    title: config.title || 'My Wedding Picks',
    style: config.style || 'mixed',
    budget: config.budget || null,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      vendor: item.vendor,
      category: item.category,
      style: item.style,
      addedAt: now
    })),
    totalPrice: items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0),
    shareableLink: `/shortlist/${shortlistId}`,
    isPublic: false
  };
  
  shortlistStore.set(shortlistId, shortlist);
  console.log(`[Shortlist] Created: ${shortlistId} with ${items.length} items`);
  
  return shortlist;
}

/**
 * Get shortlist by ID
 * @param {string} shortlistId - Shortlist ID
 * @returns {object} Shortlist object or null
 */
function getShortlist(shortlistId) {
  return shortlistStore.get(shortlistId) || null;
}

/**
 * Add item to existing shortlist
 * @param {string} shortlistId - Shortlist ID
 * @param {object} item - Item to add
 * @returns {object} Updated shortlist
 */
function addToShortlist(shortlistId, item) {
  const shortlist = shortlistStore.get(shortlistId);
  if (!shortlist) {
    return { error: true, message: `Shortlist ${shortlistId} not found` };
  }
  
  // Check if item already exists
  const existingItem = shortlist.items.find(i => i.id === item.id);
  if (existingItem) {
    return { error: true, message: 'Item already in shortlist', shortlist };
  }
  
  shortlist.items.push({
    id: item.id,
    name: item.name,
    price: item.price,
    vendor: item.vendor,
    category: item.category,
    style: item.style,
    addedAt: new Date().toISOString()
  });
  
  shortlist.totalPrice = shortlist.items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
  shortlist.updatedAt = new Date().toISOString();
  
  console.log(`[Shortlist] Added item ${item.id} to ${shortlistId}`);
  
  return shortlist;
}

/**
 * Remove item from shortlist
 * @param {string} shortlistId - Shortlist ID
 * @param {string} itemId - Item ID to remove
 * @returns {object} Updated shortlist
 */
function removeFromShortlist(shortlistId, itemId) {
  const shortlist = shortlistStore.get(shortlistId);
  if (!shortlist) {
    return { error: true, message: `Shortlist ${shortlistId} not found` };
  }
  
  const initialLength = shortlist.items.length;
  shortlist.items = shortlist.items.filter(item => item.id !== itemId);
  
  if (shortlist.items.length === initialLength) {
    return { error: true, message: 'Item not found in shortlist', shortlist };
  }
  
  shortlist.totalPrice = shortlist.items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
  shortlist.updatedAt = new Date().toISOString();
  
  console.log(`[Shortlist] Removed item ${itemId} from ${shortlistId}`);
  
  return shortlist;
}

/**
 * Make shortlist public/shareable
 * @param {string} shortlistId - Shortlist ID
 * @returns {object} Updated shortlist with public share link
 */
function makeShortlistPublic(shortlistId) {
  const shortlist = shortlistStore.get(shortlistId);
  if (!shortlist) {
    return { error: true, message: `Shortlist ${shortlistId} not found` };
  }
  
  shortlist.isPublic = true;
  shortlist.updatedAt = new Date().toISOString();
  
  // Add comparison link for sharing with partner
  shortlist.comparisonLink = `https://weddingease.com/compare/${shortlistId}`;
  
  console.log(`[Shortlist] Made public: ${shortlistId}`);
  
  return shortlist;
}

/**
 * Get all shortlists for a user
 * @param {string} userId - User ID
 * @returns {array} Array of shortlists
 */
function getUserShortlists(userId) {
  const userShortlists = [];
  for (const shortlist of shortlistStore.values()) {
    if (shortlist.userId === userId) {
      userShortlists.push(shortlist);
    }
  }
  return userShortlists;
}

/**
 * Generate a summary/preview of shortlist for sharing
 * @param {string} shortlistId - Shortlist ID
 * @returns {object} Summary with key info for sharing
 */
function getShortlistSummary(shortlistId) {
  const shortlist = getShortlist(shortlistId);
  if (!shortlist) {
    return { error: true, message: 'Shortlist not found' };
  }
  
  return {
    id: shortlist.id,
    title: shortlist.title,
    style: shortlist.style,
    itemCount: shortlist.items.length,
    totalPrice: shortlist.totalPrice,
    shareableLink: shortlist.shareableLink,
    comparisonLink: shortlist.comparisonLink || `https://weddingease.com/compare/${shortlist.id}`,
    categories: [...new Set(shortlist.items.map(i => i.category))],
    createdAt: shortlist.createdAt,
    preview: shortlist.items.slice(0, 3).map(i => `${i.name} (₹${i.price})`)
  };
}

/**
 * Cleanup old shortlists (older than 30 days)
 */
function cleanupOldShortlists() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  for (const [id, shortlist] of shortlistStore.entries()) {
    const createdDate = new Date(shortlist.createdAt);
    if (createdDate < thirtyDaysAgo) {
      shortlistStore.delete(id);
      console.log(`[Shortlist] Cleaned up old shortlist: ${id}`);
    }
  }
}

// Run cleanup every day at midnight
setInterval(cleanupOldShortlists, 24 * 60 * 60 * 1000);

module.exports = {
  createShortlist,
  getShortlist,
  addToShortlist,
  removeFromShortlist,
  makeShortlistPublic,
  getUserShortlists,
  getShortlistSummary,
  generateShortlistId
};
