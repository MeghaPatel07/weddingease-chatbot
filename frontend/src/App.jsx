import { useState, useEffect } from 'react';
import ChatContainer from './components/Chat/ChatContainer';
import LoginModal from './components/Auth/LoginModal';
import UpgradeModal from './components/Paywall/UpgradeModal';
import { useChat } from './hooks/useChat';
import './index.css';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('weddingease_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const { 
    messages, 
    sessionId, 
    loading, 
    usage, 
    error, 
    sendMessage, 
    clearChat,
    clearError 
  } = useChat();

  // Show upgrade modal on rate limit
  useEffect(() => {
    if (error?.type === 'rate_limit') {
      setShowUpgrade(true);
    }
  }, [error]);

  const handleLogout = () => {
    localStorage.removeItem('weddingease_token');
    localStorage.removeItem('weddingease_user');
    setUser(null);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    setShowUpgrade(false);
    clearError();
  };

  return (
    <>
      <ChatContainer
        messages={messages}
        loading={loading}
        usage={usage}
        error={error}
        onSendMessage={sendMessage}
        onClearChat={clearChat}
        user={user}
        onOpenLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
      />
      
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        sessionId={sessionId}
      />
      
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          clearError();
        }}
        onLogin={() => {
          setShowUpgrade(false);
          setShowLogin(true);
        }}
        usage={usage}
      />
    </>
  );
}

export default App;
