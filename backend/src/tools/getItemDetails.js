const catalog = require('../data/mockCatalog.json');

/**
 * Get full details for a specific product
 * @param {string} itemId - Product ID
 * @returns {object} Full product details
 */
function getItemDetails(itemId) {
  const product = catalog.products.find(p => p.id === itemId);
  
  if (!product) {
    return {
      error: true,
      message: `Product with ID ${itemId} not found`
    };
  }
  
  // Find vendor details
  const vendor = catalog.vendors.find(v => v.id === product.vendor_id);
  
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    formatted_price: formatPrice(product.price),
    category: product.category,
    subcategory: product.subcategory,
    description: product.description,
    style: product.style,
    weight: product.weight || null,
    images: product.images,
    lead_time_days: product.lead_time_days,
    min_quantity: product.min_quantity || 1,
    rating: product.rating,
    vendor: vendor ? {
      id: vendor.id,
      name: vendor.name,
      rating: vendor.rating,
      response_time: vendor.response_time,
      cities: vendor.cities
    } : null,
    availability: product.lead_time_days > 14 ? 'made_to_order' : 'in_stock',
    source: product.source
  };
}

/**
 * Format price in Indian Rupees
 */
function formatPrice(price) {
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(1)} Lakh`;
  } else if (price >= 1000) {
    return `₹${(price / 1000).toFixed(0)}K`;
  }
  return `₹${price}`;
}

module.exports = { getItemDetails };
