import './MessageBubble.css';
import logo from '../../assets/logo.png';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  // Format message content with markdown-like rendering
  const formatContent = (content) => {
    if (!content) return '';

    // Simple markdown processing
    let formatted = content
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br/>');

    return formatted;
  };

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="avatar">
          <img src={logo} alt="Bot" style={{ width: '24px', height: '24px' }} />
        </div>
      )}

      <div className="message-content">
        <div
          className="message-text"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {/* Tool call results */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="tool-results">
            {message.toolCalls.map((tool, idx) => (
              <ToolResult key={idx} tool={tool} />
            ))}
          </div>
        )}

        {/* Nudge message */}
        {message.nudge && (
          <div className="nudge-message">
            {message.nudge.message}
          </div>
        )}

        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {isUser && (
        <div className="avatar user-avatar">
          <img src={logo} alt="Bot" style={{ width: '24px', height: '24px' }} />
        </div>
      )}
    </div>
  );
}

// Tool result card component
function ToolResult({ tool }) {
  if (!tool.result) return null;

  const copyToClipboard = (product) => {
    const text = `${product.name}\nPrice: ${product.formatted_price}\nVendor: ${product.vendor} • ${product.city}\nRating: ${product.rating}`;
    navigator.clipboard.writeText(text);
  };

  // Search results
  if (tool.tool === 'search_catalog' && tool.result.results) {
    return (
      <div className="tool-card search-results">
        <div className="tool-header">
          <span className="tool-icon">🔍</span>
          <span>Found {tool.result.total_count} results</span>
        </div>
        <div className="product-list">
          {tool.result.results.slice(0, 3).map((product, idx) => (
            <div key={idx} className="product-card">
              <div className="product-header">
                <div className="product-name">{product.name}</div>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(product)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <div className="product-meta">
                <span className="product-price">{product.formatted_price}</span>
                <span className="product-rating">⭐ {product.rating}</span>
              </div>
              <div className="product-vendor">{product.vendor} • {product.city}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Delivery date
  if (tool.tool === 'get_delivery_date' && !tool.result.error) {
    return (
      <div className="tool-card delivery-result">
        <div className="tool-header">
          <span className="tool-icon">📦</span>
          <span>Delivery Estimate</span>
        </div>
        <div className="delivery-info">
          <div className="delivery-date">
            {tool.result.is_feasible ? '✅' : '⚠️'} {tool.result.formatted_date}
          </div>
          <div className="delivery-details">
            {tool.result.total_days} days total
            ({tool.result.base_lead_time_days} day lead time + {tool.result.shipping_days} day shipping)
          </div>
        </div>
      </div>
    );
  }

  // Vendor contact
  if (tool.tool === 'send_contact_vendor' && tool.result.success) {
    return (
      <div className="tool-card contact-result">
        <div className="tool-header">
          <span className="tool-icon">📧</span>
          <span>Vendor Contacted</span>
        </div>
        <div className="contact-info">
          <div className="contact-vendor">{tool.result.vendor_name}</div>
          <div className="contact-id">Ref: {tool.result.confirmation_id}</div>
          <div className="contact-time">Expected response: {tool.result.expected_response_time}</div>
        </div>
      </div>
    );
  }

  // Moodboard
  if (tool.tool === 'generate_moodboard') {
    return (
      <div className="tool-card moodboard-result">
        <div className="tool-header">
          <span className="tool-icon">🎨</span>
          <span>Moodboard Created</span>
        </div>
        <div className="moodboard-preview">
          <div className="moodboard-tags">
            {tool.result.style_tags?.map((tag, idx) => (
              <span key={idx} className="style-tag">{tag}</span>
            ))}
          </div>
          <div className="color-palette">
            {tool.result.color_palette?.map((color, idx) => (
              <div
                key={idx}
                className="color-swatch"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default MessageBubble;
