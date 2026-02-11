import { useState } from 'react';
import './LoginModal.css';

function LoginModal({ isOpen, onClose, onSuccess, sessionId }) {
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      // Store dev OTP for testing
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, sessionId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }
      
      // Store token and user
      localStorage.setItem('weddingease_token', data.token);
      localStorage.setItem('weddingease_user', JSON.stringify(data.user));
      
      onSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
    setDevOtp('');
  };

  return (
    <div className="modal-overlay" onClick={() => { resetModal(); onClose(); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => { resetModal(); onClose(); }}>×</button>
        
        <div className="modal-header">
          <div className="modal-icon">💍</div>
          <h2>{step === 'email' ? 'Welcome to WeddingEase' : 'Enter Verification Code'}</h2>
          <p>
            {step === 'email' 
              ? 'Sign in to save your preferences and get more messages'
              : `We sent a code to ${email}`
            }
          </p>
        </div>

        {error && (
          <div className="modal-error">{error}</div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoFocus
              />
            </div>
            
            {devOtp && (
              <div className="dev-otp">
                <span>Dev Mode OTP:</span> <code>{devOtp}</code>
              </div>
            )}
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            
            <button 
              type="button" 
              className="btn-link" 
              onClick={() => setStep('email')}
            >
              ← Use different email
            </button>
          </form>
        )}

        <div className="modal-footer">
          <p>✨ Free accounts get 10 messages/day</p>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
