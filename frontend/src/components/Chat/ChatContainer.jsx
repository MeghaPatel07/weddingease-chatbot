import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import './ChatContainer.css';
import logo from '../../assets/logo.png';

function ChatContainer({
  messages,
  loading,
  usage,
  error,
  onSendMessage,
  onClearChat,
  user,
  onOpenLogin,
  onLogout
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Suggested prompts for empty state
  const suggestions = [
    "I have a ₹5 Lakh budget for jewelry in Ahmedabad, traditional but not too heavy",
    "I need 200 invites delivered to Delhi within 2 weeks",
    "Show me some pastel lehengas for a summer wedding",
    "What are popular return gift options under ₹1000?"
  ];

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <h1>
            <img src={logo} alt="WeddingEase Logo" className="header-logo" style={{ height: '32px', marginRight: '10px', verticalAlign: 'middle' }} />
            WeddingEase
          </h1>
          <span className="tagline">Royal Wedding Concierge</span>
        </div>
        <div className="header-right">
          {usage && (
            <div className="usage-badge">
              <span className="usage-count">{usage.remaining}</span>
              <span className="usage-label">Left</span>
            </div>
          )}
          {user ? (
            <div className="user-menu">
              <span className="user-email">{user.email}</span>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn-login" onClick={onOpenLogin}>Sign In</button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <img src={logo} alt="WeddingEase" style={{ width: '64px' }} />
            </div>
            <h2>Namaste!</h2>
            <p>I am your royal wedding concierge. How may I assist you in planning your grand celebration today?</p>

            <div className="suggestions">
              <p className="suggestions-label">Curated Requests</p>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {loading && (
              <div className="typing-indicator">
                <div className="avatar">
                  <img src={logo} alt="Bot" style={{ width: '24px', height: '24px' }} />
                </div>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && error.type !== 'rate_limit' && (
        <div className="error-banner">
          {error.message}
        </div>
      )}

      {/* Input */}
      <form className="input-container" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about jewelry, venues, or apparel..."
            rows={1}
            disabled={loading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || loading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <div className="input-footer">
          <span className="char-count">{input.length}/2000</span>
          {messages.length > 0 && (
            <button type="button" className="btn-clear" onClick={onClearChat}>
              Start Anew
            </button>
          )}
        </div>
      </form>


    </div>
  );
}

export default ChatContainer;
