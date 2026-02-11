const { v4: uuidv4 } = require('uuid');
const catalog = require('../data/mockCatalog.json');

/**
 * Simulate sending a message to a vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} message - Message to send
 * @returns {object} Confirmation details
 */
function sendContactVendor(vendorId, message) {
  const vendor = catalog.vendors.find(v => v.id === vendorId);
  
  if (!vendor) {
    return {
      success: false,
      error: true,
      message: `Vendor with ID ${vendorId} not found`
    };
  }
  
  // Simulate sending (in production, this would email/SMS the vendor)
  const confirmationId = `INQ-${uuidv4().substring(0, 8).toUpperCase()}`;
  
  console.log(`[VENDOR CONTACT] Sending to ${vendor.name}:`, {
    vendor_id: vendorId,
    message: message,
    confirmation_id: confirmationId,
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    confirmation_id: confirmationId,
    vendor_name: vendor.name,
    expected_response_time: vendor.response_time,
    message_preview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    next_steps: `${vendor.name} typically responds within ${vendor.response_time}. You'll receive their response via email.`
  };
}

module.exports = { sendContactVendor };
