import { useState, useCallback, useEffect } from 'react';
import { chatAPI } from '../services/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => 
    localStorage.getItem('weddingease_session')
  );
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);

  // Send message
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    
    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await chatAPI.sendMessage(content.trim(), sessionId);
      
      // Update session ID
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem('weddingease_session', response.sessionId);
      }
      
      // Add bot message
      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message,
        toolCalls: response.toolCalls || [],
        nudge: response.nudge,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Update usage
      if (response.usage) {
        setUsage(response.usage);
      }
      
      return response;
    } catch (err) {
      const errorData = err.response?.data;
      
      // Check if rate limited
      if (err.response?.status === 429) {
        setError({
          type: 'rate_limit',
          message: errorData?.message || 'Rate limit exceeded',
          upgradeOptions: errorData?.upgrade_options
        });
      } else {
        setError({
          type: 'error',
          message: errorData?.message || 'Something went wrong'
        });
        // Remove failed message
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading]);

  // Clear chat
  const clearChat = useCallback(async () => {
    try {
      const response = await chatAPI.createSession();
      setSessionId(response.sessionId);
      localStorage.setItem('weddingease_session', response.sessionId);
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  }, []);

  // Get usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const usageData = await chatAPI.getUsage();
        setUsage(usageData);
      } catch (err) {
        console.error('Failed to fetch usage:', err);
      }
    };
    fetchUsage();
  }, []);

  return {
    messages,
    sessionId,
    loading,
    usage,
    error,
    sendMessage,
    clearChat,
    clearError: () => setError(null)
  };
}
