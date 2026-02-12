const { GoogleGenerativeAI } = require('@google/generative-ai');
const { toolSchemas, executeTool } = require('../tools');

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Available Gemini models in order of preference (based on available quotas)
// If one hits rate limit (429), automatically fallback to next
// Models with unlimited daily limits are prioritized
// NOTE: Only includes models confirmed to be available and support generateContent
const MODEL_LIST = [
  // Tier 1: Unlimited daily limit - VERIFIED WORKING
  'gemini-2.5-pro',              // Primary: Unlimited daily, best quality
  'gemini-2.0-flash',            // Secondary: Unlimited daily, stable & fast
  
  // Tier 2: Good availability - VERIFIED WORKING
  'gemini-2.0-flash-lite',       // Unlimited daily, lightweight
  'gemini-2.5-flash-lite',       // 3/10 used (7 requests remaining), lightweight
  'gemini-3-flash',              // 0/5 used, newest flash model
  
  // Tier 3: Approaching limit (use as last resort) - VERIFIED WORKING
  'gemini-2.5-flash',            // 3/5 used (only 2 requests left), approaching limit
];

// Model metadata for logging and debugging
const MODEL_METADATA = {
  'gemini-2.5-pro': { tier: 'pro', daily_limit: 'unlimited', requests_left: 'unlimited', status: '✅ Working' },
  'gemini-2.0-flash': { tier: 'flash', daily_limit: 'unlimited', requests_left: 'unlimited', status: '✅ Working' },
  'gemini-2.0-flash-lite': { tier: 'flash-lite', daily_limit: 'unlimited', requests_left: 'unlimited', status: '✅ Working' },
  'gemini-2.5-flash-lite': { tier: 'flash-lite', daily_limit: 250000, requests_left: '7', status: '✅ Working' },
  'gemini-3-flash': { tier: 'flash', daily_limit: 20, requests_left: '5', status: '✅ Working' },
  'gemini-2.5-flash': { tier: 'flash', daily_limit: 20, requests_left: '2', status: '⚠️ Limited' }
};

// Track current model index (can be updated on rate limit)
let currentModelIndex = 0;

const getCurrentModel = () => MODEL_LIST[currentModelIndex];

const switchToNextModel = () => {
  if (currentModelIndex < MODEL_LIST.length - 1) {
    currentModelIndex++;
    const newModel = getCurrentModel();
    const metadata = MODEL_METADATA[newModel];
    console.log(`[LLM] ⚠️ Switched to model: ${newModel}`);
    console.log(`[LLM] Model info: tier=${metadata?.tier}, daily_limit=${metadata?.daily_limit}, requests_remaining=${metadata?.requests_left}`);
    return true;
  }
  console.error('[LLM] ❌ No more models available in fallback list');
  return false;
};

const resetModelIndex = () => {
  currentModelIndex = 0;
  console.log(`[LLM] Model index reset to: gemini-2.5-pro (primary)`);
};

// Convert OpenAI tool schemas to Gemini format
function convertToolsToGemini(tools) {
  return tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters
  }));
}

const geminiTools = [{
  functionDeclarations: convertToolsToGemini(toolSchemas)
}];

// System prompt for the wedding concierge
const SYSTEM_PROMPT = `You are WeddingEase, a friendly and knowledgeable AI concierge helping users plan and shop for Indian weddings. You specialize in:
- Jewelry (bridal sets, kundan, polki, temple jewelry)
- Wedding invitations (printed, digital, eco-friendly)
- Outfits (lehengas, sherwanis, designer wear)
- Gifts and favors (return gifts, hampers)
- Stationery (complete suites, monograms)

IMPORTANT GUIDELINES:

1. **Ask Clarifying Questions**: Before searching, understand the user's:
   - Budget range
   - City/location for delivery
   - Style preference (traditional/modern/fusion)
   - Timeline (wedding date, when items are needed)
   - Any specific requirements

2. **Use Tools Effectively**: 
   - Use search_catalog to find products matching user criteria
   - Use get_delivery_date to check delivery feasibility
   - Use get_item_details for specific product information
   - Use send_contact_vendor when users want to inquire
   - Use generate_moodboard for visual inspiration

3. **Provide Structured Recommendations**:
   - Always explain WHY you're recommending something
   - Include price ranges in ₹ (Lakhs for expensive items)
   - Mention vendor repu
    tation and ratings
   - Note lead times and delivery estimates

4. **Citations & Honesty**:
   - Always cite sources: [Source: vendor-website.com]
   - If you don't have specific data, say: "I don't have exact information on this. Would you like me to help you search our catalog or connect with an expert?"
   - Never make up prices, vendor names, or delivery times

5. **Soft Paywall Integration**:
   - After 3-4 helpful responses, subtly mention: "By the way, creating a free account lets me remember your preferences and shortlist favorites!"
   - Don't be pushy about upgrades

6. **Indian Wedding Context**:
   - Understand regional preferences (South Indian, North Indian, etc.)
   - Know about major wedding seasons and festivals
   - Be aware of auspicious dates and muhurat considerations
   - Use appropriate terms (lehenga, kundan, meenakari, etc.)

Format your responses with clear sections when presenting multiple options. Use bullet points for easy scanning. Be warm, helpful, and professional.`;

/**
 * Process a chat message and generate a response
 * @param {string} userMessage - User's message
 * @param {array} conversationHistory - Previous messages
 * @param {object} context - Session context (budget, city, etc.)
 * @returns {object} Response with message and any tool calls made
 */
async function processChat(userMessage, conversationHistory = [], context = {}) {
  return await processChatWithModelFallback(userMessage, conversationHistory, context, 0);
}

/**
 * Internal function to handle model fallback on rate limit
 * @param {string} userMessage - User's message
 * @param {array} conversationHistory - Previous messages
 * @param {object} context - Session context
 * @param {number} attemptNumber - Retry attempt count
 * @returns {object} Response with message and any tool calls made
 */
async function processChatWithModelFallback(userMessage, conversationHistory = [], context = {}, attemptNumber = 0) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      // Return mock response for development without API key
      return getMockResponse(userMessage);
    }

    // Build context message
    let contextMessage = SYSTEM_PROMPT;
    if (Object.values(context).some(v => v)) {
      contextMessage += `\n\nUser context: ${JSON.stringify(context)}`;
    }

    const currentModel = getCurrentModel();
    const metadata = MODEL_METADATA[currentModel];
    const attemptInfo = attemptNumber > 0 ? ` [FALLBACK - Attempt ${attemptNumber + 1}/${MODEL_LIST.length}]` : '';
    console.log(`[LLM] 🤖 Using model: ${currentModel}${attemptInfo}`);
    if (metadata) {
      console.log(`[LLM] Model quota: tier=${metadata.tier}, daily_limit=${metadata.daily_limit}, remaining=${metadata.requests_left}`);
    }

    // Initialize the model with tools
    const model = genAI.getGenerativeModel({
      model: currentModel,
      systemInstruction: contextMessage,
      tools: geminiTools
    });

    // Convert conversation history to Gemini format
    const geminiHistory = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Start chat with history
    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    });

    // Send user message
    let result = await chat.sendMessage(userMessage);
    let response = result.response;
    const toolCalls = [];

    // Handle function calls in a loop
    let functionCalls = response.functionCalls?.();
    while (functionCalls && functionCalls.length > 0) {
      const functionResponses = [];

      for (const functionCall of functionCalls) {
        const toolName = functionCall.name;
        const toolArgs = functionCall.args;

        console.log(`[LLM] Calling tool: ${toolName}`, toolArgs);

        const toolResult = executeTool(toolName, toolArgs);
        toolCalls.push({
          tool: toolName,
          args: toolArgs,
          result: toolResult
        });

        functionResponses.push({
          name: toolName,
          response: toolResult
        });
      }

      // Send function results back to get next response
      result = await chat.sendMessage(functionResponses.map(fr => ({
        functionResponse: fr
      })));
      response = result.response;
      functionCalls = response.functionCalls?.();
    }

    // Extract text from response
    const responseText = response.text();

    return {
      message: responseText,
      toolCalls,
      usage: {
        prompt_tokens: result.response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: result.response.usageMetadata?.totalTokenCount || 0
      },
      model: currentModel
    };

  } catch (error) {
    console.error(`[LLM] Error with model ${getCurrentModel()}:`, error.message);

    // Handle model not found (404) - skip to next model
    if (error.status === 404 || error.message?.includes('not found')) {
      const currentModel = getCurrentModel();
      console.error(`[LLM] ❌ Model ${currentModel} is not available (404)`);
      console.error(`[LLM] This model may not support generateContent or is not available`);
      console.log(`[LLM] Remaining attempts: ${MODEL_LIST.length - currentModelIndex - 1}`);
      
      if (switchToNextModel()) {
        console.log(`[LLM] ✅ Retrying with next available model: ${getCurrentModel()}`);
        // Retry with the next model
        return await processChatWithModelFallback(userMessage, conversationHistory, context, attemptNumber + 1);
      } else {
        console.error('[LLM] ❌ All models exhausted - model not available');
        console.log('[LLM] Falling back to mock response due to no available models');
        return getMockResponse(userMessage);
      }
    }

    // Handle rate limit (429) - retry with next model
    if (error.status === 429) {
      const currentModel = getCurrentModel();
      const metadata = MODEL_METADATA[currentModel];
      console.error(`[LLM] ❌ Model ${currentModel} hit rate limit (429)`);
      console.error(`[LLM] Quota exceeded for: ${metadata?.tier} tier (daily: ${metadata?.daily_limit})`);
      console.log(`[LLM] Remaining attempts: ${MODEL_LIST.length - currentModelIndex - 1}`);
      
      if (switchToNextModel()) {
        console.log(`[LLM] ✅ Retrying with fallback model: ${getCurrentModel()}`);
        // Retry with the next model
        return await processChatWithModelFallback(userMessage, conversationHistory, context, attemptNumber + 1);
      } else {
        console.error('[LLM] ❌ All models exhausted after rate limit');
        console.log('[LLM] Falling back to mock response due to all models hitting quota');
        return getMockResponse(userMessage);
      }
    }

    // Fallback response for API key issues or other unexpected errors
    if (error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('API key')) {
      console.log('[LLM] Falling back to mock response due to API key error');
      return getMockResponse(userMessage);
    }

    throw error;
  }
}

/**
 * Generate mock response for development without API key
 */
function getMockResponse(userMessage) {
  const messageLower = userMessage.toLowerCase();

  // Jewelry query
  if (messageLower.includes('jewelry') || messageLower.includes('jewel') || messageLower.includes('kundan') || messageLower.includes('gold')) {
    const results = executeTool('search_catalog', {
      query: 'jewelry',
      filters: { category: 'jewelry' }
    });

    return {
      message: `I'd love to help you find the perfect wedding jewelry! 💍

Based on what's available, here are some stunning options:

${results.results.map((p, i) => `**${i + 1}. ${p.name}**
   - Price: ${p.formatted_price}
   - Vendor: ${p.vendor} (${p.city})
   - Style: ${p.style} | Rating: ⭐ ${p.rating}
   - [Source: ${p.source}]`).join('\n\n')}

To give you more personalized recommendations, could you tell me:
1. What's your budget range?
2. Which city are you shopping in?
3. Do you prefer traditional, modern, or fusion styles?
4. Any specific pieces you're looking for (bridal set, earrings, bangles)?`,
      toolCalls: [{ tool: 'search_catalog', args: { query: 'jewelry' }, result: results }]
    };
  }

  // Invitation query
  if (messageLower.includes('invite') || messageLower.includes('invitation') || messageLower.includes('card')) {
    const results = executeTool('search_catalog', {
      query: 'invitations',
      filters: { category: 'invites' }
    });

    return {
      message: `Wedding invitations set the tone for your celebration! 💌

Here are some beautiful options:

${results.results.map((p, i) => `**${i + 1}. ${p.name}**
   - Price: ${p.formatted_price} per piece
   - Vendor: ${p.vendor}
   - Style: ${p.style} | Lead time: ${p.lead_time_days} days
   - [Source: ${p.source}]`).join('\n\n')}

A few questions to help narrow down:
1. How many invites do you need?
2. What's your budget per invite?
3. When do you need them delivered and to which city?
4. Preference for printed, digital, or both?`,
      toolCalls: [{ tool: 'search_catalog', args: { query: 'invitations' }, result: results }]
    };
  }

  // Delivery query
  if (messageLower.includes('deliver') || messageLower.includes('within') || messageLower.includes('week') || messageLower.includes('time')) {
    return {
      message: `I can definitely help check delivery timelines! 📦

To give you accurate estimates, I need:
1. **What product** are you looking at? (or I can search based on your requirements)
2. **Your delivery pincode** - this helps calculate exact shipping times
3. **Your deadline** - when do you need items delivered?

For example, most jewelry items take 7-14 days, while custom invitations might need 10-14 days depending on quantity.

Share these details and I'll check if your timeline is realistic!`,
      toolCalls: []
    };
  }

  // Default welcome/general response
  return {
    message: `Namaste! 🙏 Welcome to WeddingEase - I'm your AI wedding shopping concierge.

I can help you with:
- 💍 **Jewelry** - Bridal sets, kundan, polki, temple jewelry
- 💌 **Invitations** - Printed, digital, eco-friendly options
- 👗 **Outfits** - Lehengas, sherwanis, designer wear
- 🎁 **Gifts** - Return gifts, wedding favors
- 📝 **Stationery** - Complete suites, monograms

**What are you shopping for today?**

To give you the best recommendations, it helps to know:
- Your approximate budget
- The city you're based in
- Your wedding date (if set)
- Your style preference (traditional/modern/fusion)

Feel free to ask me anything - like "I need traditional jewelry under ₹3 Lakhs in Ahmedabad" and I'll find perfect options for you!`,
    toolCalls: []
  };
}

/**
 * Extract context from user message (budget, city, style, etc.)
 */
function extractContext(message) {
  const context = {};
  const messageLower = message.toLowerCase();

  // Extract budget
  const budgetMatch = message.match(/₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lac|k|thousand|crore)?/i);
  if (budgetMatch) {
    let amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
    const unit = (budgetMatch[2] || '').toLowerCase();
    if (unit === 'lakh' || unit === 'lac') amount *= 100000;
    else if (unit === 'k' || unit === 'thousand') amount *= 1000;
    else if (unit === 'crore') amount *= 10000000;
    context.budget = amount;
  }

  // Extract cities
  const cities = ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'ahmedabad', 'pune', 'jaipur'];
  for (const city of cities) {
    if (messageLower.includes(city)) {
      context.city = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // Extract style
  if (messageLower.includes('traditional')) context.style = 'traditional';
  else if (messageLower.includes('modern') || messageLower.includes('contemporary')) context.style = 'modern';
  else if (messageLower.includes('fusion') || messageLower.includes('indo-western')) context.style = 'fusion';

  return context;
}

module.exports = {
  processChat,
  extractContext,
  // Model management (exported for testing/monitoring)
  getCurrentModel,
  switchToNextModel,
  resetModelIndex,
  MODEL_LIST,
  MODEL_METADATA
};
