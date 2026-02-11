const { v4: uuidv4 } = require('uuid');

/**
 * Generate a moodboard based on style prompt
 * @param {string} prompt - Style description
 * @returns {object} Moodboard details
 */
function generateMoodboard(prompt) {
  // Parse prompt for style keywords
  const styleKeywords = extractStyleKeywords(prompt);
  const colorPalette = generateColorPalette(styleKeywords);
  
  // In production, this could call DALL-E or a curated image service
  // For now, return a structured placeholder
  const moodboardId = `MB-${uuidv4().substring(0, 8)}`;
  
  return {
    moodboard_id: moodboardId,
    prompt: prompt,
    style_tags: styleKeywords,
    color_palette: colorPalette,
    // Placeholder URL - in production, generate actual images
    moodboard_url: `https://weddingease.com/moodboards/${moodboardId}`,
    elements: generateMoodboardElements(styleKeywords),
    note: 'This is a conceptual moodboard. Save it to your collection or share with vendors for reference.'
  };
}

/**
 * Extract style keywords from prompt
 */
function extractStyleKeywords(prompt) {
  const promptLower = prompt.toLowerCase();
  const keywords = [];
  
  // Style categories
  const styleMap = {
    traditional: ['traditional', 'classic', 'heritage', 'royal', 'regal', 'temple'],
    modern: ['modern', 'contemporary', 'minimalist', 'sleek', 'chic'],
    fusion: ['fusion', 'indo-western', 'mix', 'blend'],
    vintage: ['vintage', 'retro', 'old-world', 'antique'],
    bohemian: ['boho', 'bohemian', 'free-spirited', 'rustic']
  };
  
  for (const [style, words] of Object.entries(styleMap)) {
    if (words.some(w => promptLower.includes(w))) {
      keywords.push(style);
    }
  }
  
  // Color keywords
  const colors = ['red', 'gold', 'pink', 'pastel', 'ivory', 'white', 'burgundy', 'green', 'blue'];
  for (const color of colors) {
    if (promptLower.includes(color)) {
      keywords.push(color);
    }
  }
  
  // Theme keywords
  const themes = ['royal', 'garden', 'beach', 'palace', 'destination', 'intimate', 'grand'];
  for (const theme of themes) {
    if (promptLower.includes(theme)) {
      keywords.push(theme);
    }
  }
  
  // Default if no keywords found
  if (keywords.length === 0) {
    keywords.push('elegant', 'indian-wedding');
  }
  
  return keywords;
}

/**
 * Generate color palette based on style
 */
function generateColorPalette(styleKeywords) {
  const palettes = {
    traditional: ['#8B0000', '#D4AF37', '#FFD700', '#800020', '#F5E6CC'],
    modern: ['#E8D5B7', '#B8860B', '#FFFFFF', '#1C1C1C', '#C9A86C'],
    fusion: ['#DDA0DD', '#FFB6C1', '#D4AF37', '#F0E68C', '#E6E6FA'],
    vintage: ['#D4A76A', '#C19A6B', '#F5F5DC', '#8B4513', '#DEB887'],
    bohemian: ['#D2691E', '#F4A460', '#8FBC8F', '#DAA520', '#F5DEB3'],
    pink: ['#FFB6C1', '#FF69B4', '#FFC0CB', '#DB7093', '#F5E6E8'],
    gold: ['#FFD700', '#D4AF37', '#B8860B', '#DAA520', '#F5E6CC'],
    red: ['#8B0000', '#DC143C', '#B22222', '#800000', '#FFE4E1']
  };
  
  // Pick palette based on first matching keyword
  for (const keyword of styleKeywords) {
    if (palettes[keyword]) {
      return palettes[keyword];
    }
  }
  
  // Default elegant palette
  return ['#D4AF37', '#FFFAF0', '#8B0000', '#F5E6CC', '#2C2C2C'];
}

/**
 * Generate moodboard element suggestions
 */
function generateMoodboardElements(styleKeywords) {
  const elements = [];
  
  const suggestions = {
    traditional: [
      { type: 'decor', name: 'Marigold garlands', description: 'Classic orange and yellow florals' },
      { type: 'lighting', name: 'Brass diyas', description: 'Traditional oil lamps' },
      { type: 'fabric', name: 'Banarasi drapes', description: 'Rich silk with zari work' }
    ],
    modern: [
      { type: 'decor', name: 'Geometric centerpieces', description: 'Clean lines and metallic accents' },
      { type: 'lighting', name: 'Fairy light canopy', description: 'Minimalist warm lighting' },
      { type: 'fabric', name: 'Sheer white drapes', description: 'Elegant and understated' }
    ],
    fusion: [
      { type: 'decor', name: 'Acrylic mandap', description: 'Modern structure with floral accents' },
      { type: 'lighting', name: 'Crystal chandeliers', description: 'Blend of classic and contemporary' },
      { type: 'fabric', name: 'Ombre drapes', description: 'Gradient colors for drama' }
    ]
  };
  
  for (const keyword of styleKeywords) {
    if (suggestions[keyword]) {
      elements.push(...suggestions[keyword]);
    }
  }
  
  // Default elements
  if (elements.length === 0) {
    elements.push(
      { type: 'decor', name: 'Fresh floral arrangements', description: 'Seasonal blooms' },
      { type: 'lighting', name: 'Warm ambient lighting', description: 'Romantic atmosphere' },
      { type: 'fabric', name: 'Coordinated linens', description: 'Matching table settings' }
    );
  }
  
  return elements.slice(0, 5);
}

module.exports = { generateMoodboard };
