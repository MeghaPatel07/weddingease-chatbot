const { searchCatalog } = require('./searchCatalog');
const { getDeliveryDate, checkDeliveryFeasibility } = require('./getDeliveryDate');
const { getItemDetails } = require('./getItemDetails');
const { sendContactVendor } = require('./sendContactVendor');
const { generateMoodboard } = require('./generateMoodboard');
const { saveToShortlist, viewShortlist, shareShortlist } = require('./createShortlist');

// Tool definitions for OpenAI function calling
const toolSchemas = [
  {
    type: 'function',
    function: {
      name: 'search_catalog',
      description: 'Search for wedding products and vendors. Use this to find jewelry, invitations, outfits, gifts, or stationery based on user preferences like budget, city, style, and category.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query describing what the user is looking for (e.g., "kundan bridal jewelry", "luxury invitations", "pastel lehenga")'
          },
          filters: {
            type: 'object',
            description: 'Optional filters to narrow down results',
            properties: {
              category: {
                type: 'string',
                enum: ['jewelry', 'invites', 'outfits', 'gifts', 'stationery'],
                description: 'Product category'
              },
              budget_min: {
                type: 'number',
                description: 'Minimum budget in INR'
              },
              budget_max: {
                type: 'number',
                description: 'Maximum budget in INR'
              },
              city: {
                type: 'string',
                description: 'City for vendor/product availability (e.g., "Mumbai", "Delhi", "Ahmedabad")'
              },
              style: {
                type: 'string',
                enum: ['traditional', 'modern', 'fusion'],
                description: 'Style preference'
              },
              weight: {
                type: 'string',
                enum: ['light', 'medium', 'heavy'],
                description: 'Weight preference for jewelry'
              }
            }
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_delivery_date',
      description: 'Check estimated delivery date for a product to a specific pincode. Use this when users ask about delivery timelines or whether an order will arrive on time.',
      parameters: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'Product ID from search results'
          },
          pincode: {
            type: 'string',
            description: '6-digit Indian postal pincode for delivery'
          }
        },
        required: ['item_id', 'pincode']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_item_details',
      description: 'Get complete details about a specific product including description, vendor information, and pricing.',
      parameters: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'Product ID to get details for'
          }
        },
        required: ['item_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_contact_vendor',
      description: 'Send an inquiry message to a vendor on behalf of the user. Use when users want to contact a vendor for custom orders, questions, or appointments.',
      parameters: {
        type: 'object',
        properties: {
          vendor_id: {
            type: 'string',
            description: 'Vendor ID to contact'
          },
          message: {
            type: 'string',
            description: 'Message to send to the vendor including user requirements'
          }
        },
        required: ['vendor_id', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_moodboard',
      description: 'Create a visual moodboard based on wedding style preferences. Use when users want to visualize their wedding aesthetic or need inspiration.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Description of the wedding style, colors, and theme (e.g., "Royal traditional with gold and burgundy", "Modern minimalist beach wedding")'
          }
        },
        required: ['prompt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_shortlist',
      description: 'Save selected wedding items to a shortlist that can be shared with family, partner, or vendors. This is a key feature for wedding planning and encourages user account creation.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Array of items to save. Each item should have: id, name, price, category, vendor, style',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Product ID' },
                name: { type: 'string', description: 'Product name' },
                price: { type: 'number', description: 'Price in INR' },
                category: { type: 'string', description: 'Product category' },
                vendor: { type: 'string', description: 'Vendor name' },
                style: { type: 'string', description: 'Style tag (e.g., traditional, modern, fusion)' }
              }
            }
          },
          title: {
            type: 'string',
            description: 'Optional title for the shortlist (e.g., "My Bridal Look")'
          },
          style: {
            type: 'string',
            description: 'Overall style theme of shortlist (traditional, modern, fusion)'
          },
          shortlistId: {
            type: 'string',
            description: 'Optional: ID of existing shortlist to add items to instead of creating new'
          }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'share_shortlist',
      description: 'Make a shortlist public and get shareable link for comparing with partner or family members.',
      parameters: {
        type: 'object',
        properties: {
          shortlistId: {
            type: 'string',
            description: 'ID of the shortlist to make public and share'
          }
        },
        required: ['shortlistId']
      }
    }
  }
];

/**
 * Execute a tool by name with given arguments
 * @param {string} toolName - Name of tool to execute
 * @param {object} args - Tool arguments
 * @returns {object} Tool execution result
 */
function executeTool(toolName, args) {
  switch (toolName) {
    case 'search_catalog':
      return searchCatalog(args.query, args.filters || {});
    
    case 'get_delivery_date':
      return getDeliveryDate(args.item_id, args.pincode);
    
    case 'get_item_details':
      return getItemDetails(args.item_id);
    
    case 'send_contact_vendor':
      return sendContactVendor(args.vendor_id, args.message);
    
    case 'generate_moodboard':
      return generateMoodboard(args.prompt);
    
    case 'create_shortlist':
      return saveToShortlist(args.items || [], {
        title: args.title,
        style: args.style,
        shortlistId: args.shortlistId
      });
    
    case 'share_shortlist':
      return shareShortlist(args.shortlistId);
    
    default:
      return { error: true, message: `Unknown tool: ${toolName}` };
  }
}

module.exports = {
  toolSchemas,
  executeTool,
  // Export individual tools for testing
  searchCatalog,
  getDeliveryDate,
  checkDeliveryFeasibility,
  getItemDetails,
  sendContactVendor,
  generateMoodboard,
  saveToShortlist,
  viewShortlist,
  shareShortlist
};
