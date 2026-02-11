/**
 * Policy layer for safety and trust
 * Validates inputs and outputs then adds citations/fallbacks
 */

const BLOCKED_PATTERNS = [
  /\b(hack|exploit|sql\s*inject|script\s*inject)\b/i,
  /<script[\s\S]*?>/i,
  /\{\{[\s\S]*?\}\}/  // Template injection
];

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Validate user input for safety
 * @param {string} message - User message
 * @returns {object} { valid: boolean, sanitized: string, reason: string|null }
 */
function validateInput(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, sanitized: '', reason: 'Message is required' };
  }
  
  // Length check
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { 
      valid: false, 
      sanitized: message.substring(0, MAX_MESSAGE_LENGTH),
      reason: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`
    };
  }
  
  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(message)) {
      return {
        valid: false,
        sanitized: message.replace(pattern, '[blocked]'),
        reason: 'Message contains invalid content'
      };
    }
  }
  
  // Basic sanitization (remove excess whitespace)
  const sanitized = message.trim().replace(/\s+/g, ' ');
  
  return { valid: true, sanitized, reason: null };
}

/**
 * Validate and enhance LLM output
 * @param {string} response - LLM response
 * @returns {object} { valid: boolean, enhanced: string }
 */
function validateOutput(response) {
  if (!response || typeof response !== 'string') {
    return {
      valid: false,
      enhanced: "I apologize, but I couldn't generate a response. Please try rephrasing your question."
    };
  }
  
  let enhanced = response;
  
  // Check for hallucination markers (confidence phrases without backing)
  const uncertainPhrases = [
    /I'm (absolutely |100% )?certain that/gi,
    /I guarantee/gi,
    /This will definitely/gi
  ];
  
  for (const phrase of uncertainPhrases) {
    enhanced = enhanced.replace(phrase, 'Based on available information,');
  }
  
  // Add fallback if response seems uncertain or empty
  if (enhanced.length < 50 || /I don't know|I'm not sure|I cannot/i.test(enhanced)) {
    enhanced += "\n\n💡 **Need more help?** I can:\n- Search our catalog with different criteria\n- Connect you with a wedding expert\n- Show you popular options in your category";
  }
  
  return { valid: true, enhanced };
}

/**
 * Check if response needs expert escalation
 * @param {string} userMessage - User's question
 * @param {string} response - Bot's response
 * @returns {boolean}
 */
function needsExpertEscalation(userMessage, response) {
  const expertTriggers = [
    /legal|contract|refund|dispute/i,
    /custom.*design|bespoke|unique.*creation/i,
    /budget.*crore|very\s+high.*budget/i,
    /celebrity|vip|destination.*abroad/i
  ];
  
  const messageLower = userMessage.toLowerCase();
  return expertTriggers.some(pattern => pattern.test(messageLower));
}

/**
 * Add expert suggestion to response if needed
 */
function addExpertSuggestion(response, userMessage) {
  if (needsExpertEscalation(userMessage, response)) {
    return response + "\n\n🌟 **This sounds like it might benefit from expert guidance!** Would you like me to connect you with one of our wedding planning specialists? They can provide personalized advice for complex requirements.";
  }
  return response;
}

module.exports = {
  validateInput,
  validateOutput,
  needsExpertEscalation,
  addExpertSuggestion
};
