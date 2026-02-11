const { processChat, extractContext } = require('../services/llmService');
const { 
  createSession, 
  getSession, 
  addMessage, 
  updateContext,
  getConversationHistory 
} = require('../services/sessionService');
const { incrementUsage, checkUsageLimit } = require('../services/usageService');
const { validateInput, validateOutput, addExpertSuggestion } = require('../middleware/policyLayer');

/**
 * Handle chat message
 */
async function handleChat(req, res) {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message required',
        message: 'Please provide a message.'
      });
    }
    
    // Validate input
    const inputValidation = validateInput(message);
    if (!inputValidation.valid) {
      return res.status(400).json({
        error: 'Invalid message',
        message: inputValidation.reason
      });
    }
    
    // Get or create session
    let session;
    if (sessionId) {
      session = getSession(sessionId);
    }
    if (!session) {
      session = createSession(req.user?.id || null);
    }
    
    // Get usage info
    const identifier = req.user?.id || req.ip || 'unknown';
    const tier = req.userTier || 'guest';
    
    // Add user message to session
    addMessage(session.id, 'user', inputValidation.sanitized);
    
    // Extract context from message
    const newContext = extractContext(inputValidation.sanitized);
    if (Object.keys(newContext).length > 0) {
      updateContext(session.id, newContext);
    }
    
    // Get conversation history
    const history = getConversationHistory(session.id);
    
    // Process with LLM
    const response = await processChat(
      inputValidation.sanitized,
      history.slice(-10), // Keep last 10 messages for context
      session.context
    );
    
    // Validate and enhance output
    const outputValidation = validateOutput(response.message);
    let finalMessage = outputValidation.enhanced;
    
    // Add expert suggestion if needed
    finalMessage = addExpertSuggestion(finalMessage, inputValidation.sanitized);
    
    // Add assistant message to session
    addMessage(session.id, 'assistant', finalMessage, {
      toolCalls: response.toolCalls
    });
    
    // Increment usage
    const usage = incrementUsage(identifier, tier);
    
    // Prepare response
    const chatResponse = {
      sessionId: session.id,
      message: finalMessage,
      toolCalls: response.toolCalls || [],
      context: session.context,
      usage: {
        remaining: usage.remaining,
        limit: usage.limit,
        tier: usage.tier
      }
    };
    
    // Add soft paywall nudge after several messages
    if (tier === 'guest' && session.messages.length >= 6) {
      chatResponse.nudge = {
        type: 'signup',
        message: '💡 Create a free account to save your preferences and get more messages!'
      };
    } else if (tier === 'free' && session.messages.length >= 12) {
      chatResponse.nudge = {
        type: 'upgrade',
        message: '⭐ Upgrade to Premium for unlimited messages and expert assistance!'
      };
    }
    
    res.json(chatResponse);
    
  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({
      error: 'Chat error',
      message: 'Something went wrong. Please try again.'
    });
  }
}

/**
 * Get session info
 */
function getSessionInfo(req, res) {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({
      error: 'Session not found',
      message: 'Session expired or does not exist.'
    });
  }
  
  res.json({
    sessionId: session.id,
    context: session.context,
    messageCount: session.messages.length,
    createdAt: session.createdAt
  });
}

/**
 * Create new session
 */
function createNewSession(req, res) {
  const session = createSession(req.user?.id || null);
  
  res.json({
    sessionId: session.id,
    message: 'New session created'
  });
}

/**
 * Get usage status
 */
function getUsageStatus(req, res) {
  const identifier = req.user?.id || req.ip || 'unknown';
  const tier = req.userTier || 'guest';
  const usage = checkUsageLimit(identifier, tier);
  
  res.json(usage);
}

module.exports = {
  handleChat,
  getSessionInfo,
  createNewSession,
  getUsageStatus
};
