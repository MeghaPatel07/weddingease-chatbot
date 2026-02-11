const catalog = require('../data/mockCatalog.json');

/**
 * Search catalog for products matching query and filters
 * @param {string} query - Search query
 * @param {object} filters - Filter options
 * @returns {object} Search results with products and total count
 */
function searchCatalog(query, filters = {}) {
  let results = [...catalog.products];
  const queryLower = query.toLowerCase();
  
  // Text search across name, description, category
  results = results.filter(product => {
    const searchText = `${product.name} ${product.description} ${product.category} ${product.subcategory || ''} ${product.vendor_name}`.toLowerCase();
    return searchText.includes(queryLower);
  });
  
  // Apply category filter
  if (filters.category) {
    results = results.filter(p => p.category === filters.category.toLowerCase());
  }
  
  // Apply budget filters
  if (filters.budget_min !== undefined) {
    results = results.filter(p => p.price >= filters.budget_min);
  }
  if (filters.budget_max !== undefined) {
    results = results.filter(p => p.price <= filters.budget_max);
  }
  
  // Apply city filter
  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    results = results.filter(p => 
      p.city.toLowerCase() === cityLower || 
      p.city === 'Multiple'
    );
  }
  
  // Apply style filter
  if (filters.style) {
    results = results.filter(p => p.style === filters.style.toLowerCase());
  }
  
  // Apply weight filter (for jewelry)
  if (filters.weight) {
    results = results.filter(p => !p.weight || p.weight === filters.weight.toLowerCase());
  }
  
  // Sort by rating
  results.sort((a, b) => b.rating - a.rating);
  
  // Return top 5 results
  const topResults = results.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    formatted_price: formatPrice(p.price),
    category: p.category,
    vendor: p.vendor_name,
    city: p.city,
    style: p.style,
    rating: p.rating,
    lead_time_days: p.lead_time_days,
    source: p.source
  }));
  
  return {
    results: topResults,
    total_count: results.length,
    query: query,
    filters_applied: filters
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

module.exports = { searchCatalog };
