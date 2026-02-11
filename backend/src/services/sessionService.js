const { v4: uuidv4 } = require('uuid');

// In-memory session store (use Redis in production)
const sessions = new Map();

// Session expiry time (24 hours)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Create a new chat session
 * @param {string|null} userId - User ID if authenticated
 * @returns {object} Session object
 */
function createSession(userId = null) {
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    userId,
    messages: [],
    context: {
      budget: null,
      city: null,
      style: null,
      weddingDate: null,
      categories: []
    },
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  };
  
  sessions.set(sessionId, session);
  cleanupExpiredSessions();
  
  return session;
}

/**
 * Get session by ID
 * @param {string} sessionId
 * @returns {object|null}
 */
function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  // Check if session has expired
  if (Date.now() - session.lastActiveAt > SESSION_EXPIRY_MS) {
    sessions.delete(sessionId);
    return null;
  }
  
  // Update last active time
  session.lastActiveAt = Date.now();
  return session;
}

/**
 * Add message to session history
 * @param {string} sessionId
 * @param {string} role - 'user' | 'assistant' | 'tool'
 * @param {string} content
 * @param {object} metadata - Additional metadata (tool calls, etc.)
 */
function addMessage(sessionId, role, content, metadata = {}) {
  const session = getSession(sessionId);
  if (!session) return null;
  
  const message = {
    id: uuidv4(),
    role,
    content,
    timestamp: Date.now(),
    ...metadata
  };
  
  session.messages.push(message);
  
  // Keep only last 50 messages to prevent memory issues
  if (session.messages.length > 50) {
    session.messages = session.messages.slice(-50);
  }
  
  return message;
}

/**
 * Update session context (extracted user preferences)
 * @param {string} sessionId
 * @param {object} contextUpdate
 */
function updateContext(sessionId, contextUpdate) {
  const session = getSession(sessionId);
  if (!session) return null;
  
  session.context = { ...session.context, ...contextUpdate };
  return session.context;
}

/**
 * Get conversation history formatted for LLM
 * @param {string} sessionId
 * @returns {array} Messages in OpenAI format
 */
function getConversationHistory(sessionId) {
  const session = getSession(sessionId);
  if (!session) return [];
  
  return session.messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
}

/**
 * Link session to authenticated user
 * @param {string} sessionId
 * @param {string} userId
 */
function linkSessionToUser(sessionId, userId) {
  const session = getSession(sessionId);
  if (session) {
    session.userId = userId;
  }
  return session;
}

/**
 * Delete expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActiveAt > SESSION_EXPIRY_MS) {
      sessions.delete(sessionId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  createSession,
  getSession,
  addMessage,
  updateContext,
  getConversationHistory,
  linkSessionToUser
};
