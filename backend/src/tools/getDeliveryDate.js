const catalog = require('../data/mockCatalog.json');

/**
 * Calculate estimated delivery date for an item to a pincode
 * @param {string} itemId - Product ID
 * @param {string} pincode - Delivery pincode
 * @returns {object} Delivery estimate details
 */
function getDeliveryDate(itemId, pincode) {
  // Find the product
  const product = catalog.products.find(p => p.id === itemId);
  
  if (!product) {
    return {
      error: true,
      message: `Product with ID ${itemId} not found`,
      is_feasible: false
    };
  }
  
  // Determine delivery zone based on pincode
  const zone = getDeliveryZone(pincode);
  const additionalDays = catalog.delivery_zones[zone].additional_days;
  
  // Calculate total lead time
  const totalDays = product.lead_time_days + additionalDays;
  
  // Calculate estimated delivery date
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + totalDays);
  
  // Format dates
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  
  return {
    item_id: itemId,
    item_name: product.name,
    pincode: pincode,
    zone: zone,
    base_lead_time_days: product.lead_time_days,
    shipping_days: additionalDays,
    total_days: totalDays,
    estimated_date: deliveryDate.toISOString().split('T')[0],
    formatted_date: deliveryDate.toLocaleDateString('en-IN', options),
    is_feasible: true,
    notes: getDeliveryNotes(product, zone, totalDays)
  };
}

/**
 * Determine delivery zone from pincode
 */
function getDeliveryZone(pincode) {
  const pincodeStr = pincode.toString();
  const firstDigit = pincodeStr[0];
  
  // Major metros
  const metros = {
    '11': 'metro', // Delhi
    '40': 'metro', // Mumbai
    '56': 'metro', // Bangalore
    '60': 'metro', // Chennai
    '70': 'metro', // Kolkata
    '50': 'metro'  // Hyderabad
  };
  
  const prefix = pincodeStr.substring(0, 2);
  if (metros[prefix]) {
    return 'metro';
  }
  
  // Tier 1 cities (simplified)
  const tier1 = ['38', '41', '30', '22', '16', '68'];
  if (tier1.includes(prefix)) {
    return 'tier1';
  }
  
  // Tier 2 based on first digit
  if (['4', '5', '6', '7'].includes(firstDigit)) {
    return 'tier2';
  }
  
  return 'remote';
}

/**
 * Generate delivery notes based on product and zone
 */
function getDeliveryNotes(product, zone, totalDays) {
  const notes = [];
  
  if (product.lead_time_days > 7) {
    notes.push('This is a made-to-order item and requires additional preparation time.');
  }
  
  if (zone === 'remote') {
    notes.push('Remote location - delivery may take longer than estimated.');
  }
  
  if (product.category === 'jewelry' && totalDays < 14) {
    notes.push('Express delivery available for jewelry items with additional charges.');
  }
  
  if (product.min_quantity) {
    notes.push(`Minimum order quantity: ${product.min_quantity} pieces.`);
  }
  
  return notes.join(' ');
}

/**
 * Check if delivery is feasible by a target date
 * @param {string} itemId - Product ID
 * @param {string} pincode - Delivery pincode
 * @param {string} targetDate - ISO date string for target delivery
 * @returns {object} Feasibility assessment
 */
function checkDeliveryFeasibility(itemId, pincode, targetDate) {
  const estimate = getDeliveryDate(itemId, pincode);
  
  if (estimate.error) {
    return estimate;
  }
  
  const target = new Date(targetDate);
  const estimated = new Date(estimate.estimated_date);
  const daysBuffer = Math.floor((target - estimated) / (1000 * 60 * 60 * 24));
  
  return {
    ...estimate,
    target_date: targetDate,
    is_feasible: daysBuffer >= 0,
    days_buffer: daysBuffer,
    feasibility_message: daysBuffer >= 0 
      ? `Yes, delivery is possible with ${daysBuffer} days to spare.`
      : `Delivery would be ${Math.abs(daysBuffer)} days late. Consider expedited options or alternative products.`
  };
}

module.exports = { getDeliveryDate, checkDeliveryFeasibility };
