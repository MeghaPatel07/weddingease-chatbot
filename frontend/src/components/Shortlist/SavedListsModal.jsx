import { useState, useEffect } from 'react';
import './SavedListsModal.css';

function SavedListsModal({ isOpen, onClose, userId }) {
  const [shortlists, setShortlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchShortlists();
    }
  }, [isOpen, userId]);

  const fetchShortlists = async () => {
    setLoading(true);
    setError('');
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('weddingease_token');
      
      const response = await fetch(`${API_BASE_URL}/shortlist/my-lists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shortlists');
      }

      const data = await response.json();
      setShortlists(data.shortlists || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching shortlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (shortlistId) => {
    const shareLink = `${window.location.origin}/shortlist/${shortlistId}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedId(shortlistId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const viewShortlist = (shortlistId) => {
    window.open(`/shortlist/${shortlistId}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortlist-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>💾 My Saved Lists</h2>
          <p className="modal-subtitle">
            {shortlists.length} {shortlists.length === 1 ? 'shortlist' : 'shortlists'} saved
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your lists...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="btn-retry" onClick={fetchShortlists}>Retry</button>
          </div>
        ) : shortlists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-title">No saved lists yet</p>
            <p className="empty-description">
              Ask the chatbot to save items to a shortlist. For example: "Save these to my shortlist"
            </p>
          </div>
        ) : (
          <div className="shortlists-list">
            {shortlists.map((list) => (
              <div key={list.id} className="shortlist-card">
                <div className="card-header">
                  <div className="card-title-section">
                    <h3 className="card-title">{list.title || 'Untitled List'}</h3>
                    <span className="list-id">ID: {list.id}</span>
                  </div>
                  <span className="item-count">{list.itemCount || 0} items</span>
                </div>

                <div className="card-body">
                  {list.style && (
                    <div className="list-meta">
                      <span className="meta-label">Style:</span>
                      <span className="meta-value">{list.style}</span>
                    </div>
                  )}
                  <div className="list-meta">
                    <span className="meta-label">Total Price:</span>
                    <span className="meta-price">{list.totalPrice || '₹0'}</span>
                  </div>
                  {list.createdAt && (
                    <div className="list-meta">
                      <span className="meta-label">Created:</span>
                      <span className="meta-value">{new Date(list.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="btn-view"
                    onClick={() => viewShortlist(list.id)}
                    title="View this list in a new tab"
                  >
                    👁️ View
                  </button>

                  <button
                    className={`btn-share ${copiedId === list.id ? 'copied' : ''}`}
                    onClick={() => copyShareLink(list.id)}
                    title="Copy share link to clipboard"
                  >
                    {copiedId === list.id ? '✓ Copied' : '🔗 Share'}
                  </button>
                </div>

                <div className="share-preview">
                  <span className="share-label">Share link:</span>
                  <code className="share-link">/shortlist/{list.id}</code>
                </div>
              </div>
            ))}
          </div>
        )}

        {shortlists.length > 0 && (
          <div className="modal-footer">
            <p className="footer-note">
              💡 Share these links with family or partners to collaborate on selections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedListsModal;
