const express = require('express');
const router = express.Router();
const { verifyToken, requireAuth } = require('../middleware/auth');
const { getShortlist, getShortlistSummary, getUserShortlists } = require('../services/shortlistService');

/**
 * View a shortlist by ID (public endpoint - no auth required)
 * GET /api/shortlist/:shortlistId
 */
router.get('/view/:shortlistId', (req, res) => {
  try {
    const { shortlistId } = req.params;
    
    const shortlist = getShortlist(shortlistId);
    if (!shortlist) {
      return res.status(404).json({
        error: true,
        message: 'Shortlist not found'
      });
    }

    const summary = getShortlistSummary(shortlistId);

    return res.json({
      success: true,
      shortlist: {
        id: shortlist.id,
        title: shortlist.title,
        style: shortlist.style,
        itemCount: shortlist.items.length,
        totalPrice: `₹${Math.round(shortlist.totalPrice).toLocaleString('en-IN')}`,
        items: shortlist.items.map(item => ({
          id: item.id,
          name: item.name,
          price: `₹${Math.round(parseFloat(item.price)).toLocaleString('en-IN')}`,
          vendor: item.vendor,
          category: item.category,
          style: item.style,
          addedAt: new Date(item.addedAt).toLocaleDateString('en-IN')
        })),
        createdAt: new Date(shortlist.createdAt).toLocaleDateString('en-IN'),
        shareableLink: shortlist.shareableLink,
        comparisonLink: shortlist.comparisonLink,
        categories: [...new Set(shortlist.items.map(i => i.category))]
      },
      message: '📋 Shortlist Summary:'
    });
  } catch (error) {
    console.error('[Shortlist Route] Error:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to retrieve shortlist'
    });
  }
});

/**
 * Get shortlist preview for sharing (minimal details)
 * GET /api/shortlist/:shortlistId/preview
 */
router.get('/preview/:shortlistId', (req, res) => {
  try {
    const { shortlistId } = req.params;

    const summary = getShortlistSummary(shortlistId);
    if (summary.error) {
      return res.status(404).json(summary);
    }

    return res.json({
      success: true,
      preview: summary,
      actionUrl: `https://weddingease.com/shortlist/${shortlistId}`,
      shareMessage: `📱 Check out this wedding shortlist: ${summary.title}\n💰 Total: ${summary.totalPrice}\n📦 ${summary.itemCount} items curated`
    });
  } catch (error) {
    console.error('[Shortlist Route] Error:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to retrieve shortlist preview'
    });
  }
});

/**
 * Get all shortlists for authenticated user
 * GET /api/shortlist/my-lists
 */
router.get('/my-lists', (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: true,
        message: 'User not authenticated'
      });
    }

    const userShortlists = getUserShortlists(userId);
    console.log(userShortlists)
    const shortlistsFormatted = userShortlists.map(list => ({
      id: list.id,
      title: list.title,
      style: list.style,
      itemCount: list.items.length,
      totalPrice: `₹${Math.round(list.totalPrice).toLocaleString('en-IN')}`,
      createdAt: list.createdAt,
      isPublic: list.isPublic,
      shareableLink: list.shareableLink
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Most recent first

    return res.json({
      success: true,
      shortlists: shortlistsFormatted,
      count: shortlistsFormatted.length,
      message: '📋 Your saved shortlists'
    });
  } catch (error) {
    console.error('[Shortlist Route] Error:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to retrieve your shortlists'
    });
  }
});

/**
 * Conversion endpoint: encourage account creation when user shares shortlist
 * POST /api/shortlist/:shortlistId/convert
 */
router.post('/convert/:shortlistId', verifyToken, (req, res) => {
  try {
    const { shortlistId } = req.params;

    const shortlist = getShortlist(shortlistId);
    if (!shortlist) {
      return res.status(404).json({
        error: true,
        message: 'Shortlist not found'
      });
    }

    // Log conversion event
    console.log(`[Analytics] User ${req.user?.id} converted from shortlist ${shortlistId}`);

    return res.json({
      success: true,
      message: 'Account verified - shortlist saved to your profile',
      nextSteps: [
        'Share shortlist link with family/partner',
        'Compare items side-by-side',
        'Get vendor recommendations',
        'Track your budget'
      ]
    });
  } catch (error) {
    console.error('[Shortlist Route] Error:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to process conversion'
    });
  }
});

module.exports = router;
