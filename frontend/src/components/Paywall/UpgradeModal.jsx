import './UpgradeModal.css';

function UpgradeModal({ isOpen, onClose, onLogin, usage }) {
  if (!isOpen) return null;

  const isGuest = usage?.tier === 'guest';

  return (
    <div className="upgrade-overlay" onClick={onClose}>
      <div className="upgrade-content" onClick={e => e.stopPropagation()}>
        <button className="upgrade-close" onClick={onClose}>×</button>
        
        <div className="upgrade-header">
          <div className="upgrade-icon">✨</div>
          <h2>You've used all your free messages!</h2>
          <p>Don't worry, you can continue your wedding planning journey.</p>
        </div>

        <div className="upgrade-options">
          {isGuest && (
            <div className="upgrade-card free">
              <div className="card-badge">Recommended</div>
              <h3>Create Free Account</h3>
              <div className="card-price">Free</div>
              <ul>
                <li>✓ 10 messages per day</li>
                <li>✓ Save your preferences</li>
                <li>✓ Shortlist favorites</li>
                <li>✓ Access from any device</li>
              </ul>
              <button className="btn-upgrade" onClick={onLogin}>
                Sign Up Free
              </button>
            </div>
          )}

          <div className="upgrade-card premium">
            <h3>Go Premium</h3>
            <div className="card-price">₹499<span>/month</span></div>
            <ul>
              <li>✓ Unlimited messages</li>
              <li>✓ Priority vendor responses</li>
              <li>✓ Expert human assistance</li>
              <li>✓ Exclusive discounts</li>
              <li>✓ Personalized recommendations</li>
            </ul>
            <button className="btn-upgrade premium-btn">
              Upgrade to Premium
            </button>
          </div>
        </div>

        <div className="upgrade-footer">
          <p>Your messages reset at midnight UTC</p>
          <button className="btn-dismiss" onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
