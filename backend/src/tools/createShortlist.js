// Shortlist tool for saving wedding items
// Allows users to save products to a shareable shortlist

const {
  createShortlist,
  addToShortlist,
  getShortlist,
  removeFromShortlist,
  makeShortlistPublic,
  getShortlistSummary
} = require('../services/shortlistService');

/**
 * Create or add items to a shortlist
 * @param {array} items - Items to shortlist [{id, name, price, category, vendor, style}]
 * @param {object} options - {shortlistId, title, style, budget}
 * @returns {object} Response with shortlist ID and summary
 */
function saveToShortlist(items, options = {}) {
  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        error: true,
        message: 'No items to save. Provide at least one item.'
      };
    }

    let shortlist;

    // If shortlistId provided, add to existing shortlist
    if (options.shortlistId) {
      shortlist = getShortlist(options.shortlistId);
      if (!shortlist) {
        return {
          error: true,
          message: `Shortlist ${options.shortlistId} not found`
        };
      }

      // Add each item
      for (const item of items) {
        addToShortlist(options.shortlistId, item);
      }

      shortlist = getShortlist(options.shortlistId);
    } else {
      // Create new shortlist
      const userId = options.userId || 'guest_' + Date.now();
      shortlist = createShortlist(userId, items, {
        title: options.title,
        style: options.style,
        budget: options.budget
      });
    }

    const summary = getShortlistSummary(shortlist.id);

    return {
      success: true,
      message: `✅ Saved ${items.length} item(s) to shortlist`,
      shortlist: {
        id: shortlist.id,
        title: shortlist.title,
        itemCount: shortlist.items.length,
        totalPrice: `₹${Math.round(shortlist.totalPrice).toLocaleString('en-IN')}`,
        shareableLink: shortlist.shareableLink,
        items: shortlist.items.map(i => ({
          name: i.name,
          price: `₹${Math.round(parseFloat(i.price)).toLocaleString('en-IN')}`,
          vendor: i.vendor,
          category: i.category
        }))
      },
      conversionMessage: `💝 Your shortlist is saved! Share this link with your partner or family:\n${shortlist.shareableLink}\n\nCreate a free WeddingEase account to:\n✓ Access shortlist anytime\n✓ Compare with partner\n✓ Get vendor introductions\n✓ Track budget`,
      nextSteps: [
        'Create a free account to save this shortlist permanently',
        `Share shortlist link: ${shortlist.shareableLink}`,
        'View delivery dates for selected items',
        'Contact vendors directly from shortlist'
      ]
    };
  } catch (error) {
    console.error('[Shortlist] Error:', error.message);
    return {
      error: true,
      message: `Failed to save shortlist: ${error.message}`
    };
  }
}

/**
 * Get shortlist details by ID (for viewing/sharing)
 * @param {string} shortlistId - Shortlist ID
 * @returns {object} Shortlist details
 */
function viewShortlist(shortlistId) {
  try {
    const shortlist = getShortlist(shortlistId);
    
    if (!shortlist) {
      return {
        error: true,
        message: `Shortlist ${shortlistId} not found`
      };
    }

    return {
      success: true,
      shortlist: {
        id: shortlist.id,
        title: shortlist.title,
        style: shortlist.style,
        itemCount: shortlist.items.length,
        totalPrice: `₹${Math.round(shortlist.totalPrice).toLocaleString('en-IN')}`,
        items: shortlist.items.map(i => ({
          name: i.name,
          price: `₹${Math.round(parseFloat(i.price)).toLocaleString('en-IN')}`,
          vendor: i.vendor,
          category: i.category,
          style: i.style
        })),
        createdAt: new Date(shortlist.createdAt).toLocaleDateString('en-IN'),
        shareableLink: shortlist.shareableLink
      }
    };
  } catch (error) {
    console.error('[Shortlist] Error:', error.message);
    return {
      error: true,
      message: `Failed to view shortlist: ${error.message}`
    };
  }
}

/**
 * Share shortlist (make public and get share message)
 * @param {string} shortlistId - Shortlist ID
 * @returns {object} Share details and message
 */
function shareShortlist(shortlistId) {
  try {
    const shortlist = getShortlist(shortlistId);
    
    if (!shortlist) {
      return {
        error: true,
        message: `Shortlist ${shortlistId} not found`
      };
    }

    makeShortlistPublic(shortlistId);
    const updated = getShortlist(shortlistId);

    return {
      success: true,
      message: '✅ Shortlist is now shareable!',
      shareDetails: {
        shortlistId: shortlist.id,
        title: shortlist.title,
        itemCount: shortlist.items.length,
        totalPrice: `₹${Math.round(shortlist.totalPrice).toLocaleString('en-IN')}`,
        shareableLink: updated.shareableLink,
        comparisonLink: updated.comparisonLink,
        shareMessage: `Check out my wedding picks! ${updated.comparisonLink}`,
        categories: [...new Set(shortlist.items.map(i => i.category))].join(', ')
      },
      instructions: [
        `Share this link with your partner: ${updated.comparisonLink}`,
        'Your partner can add their feedback',
        'Compare preferences side-by-side',
        'Finalize choices together'
      ]
    };
  } catch (error) {
    console.error('[Shortlist] Error:', error.message);
    return {
      error: true,
      message: `Failed to share shortlist: ${error.message}`
    };
  }
}

module.exports = {
  saveToShortlist,
  viewShortlist,
  shareShortlist
};
