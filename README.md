# WeddingEase Pre-Shopping Concierge Chatbot

An AI-powered chatbot that helps users plan and shop for an Indian wedding, featuring LLM-based conversations with tool integrations, session memory, and a soft paywall system.

![WeddingEase](https://via.placeholder.com/800x400/c9a86c/ffffff?text=WeddingEase+Chatbot)

## 🌟 Features

- **AI-Powered Conversations**: Natural language chat with GPT-4 for personalized wedding shopping advice
- **Smart Tool Integrations**: Search products, check delivery dates, contact vendors, and generate moodboards
- **Session Memory**: Context-aware conversations that remember user preferences
- **Soft Paywall**: Free tier with usage limits, easy upgrade path
- **Email OTP Authentication**: Secure, passwordless login
- **Beautiful UI**: Wedding-themed design with smooth animations

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + Vite |
| **Styling** | Vanilla CSS |
| **Backend** | Node.js + Express |
| **LLM** | OpenAI GPT-4 |
| **Auth** | JWT + Email OTP |

## 📦 Project Structure

```
weddingease-chatbot/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/   # Chat, Auth, Paywall components
│   │   ├── hooks/        # useAuth, useChat
│   │   └── services/     # API client
│   └── index.html
│
├── backend/           # Express API
│   └── src/
│       ├── controllers/  # Chat, Auth handlers
│       ├── services/     # LLM, Session, Usage, Email
│       ├── tools/        # 5 tool implementations
│       ├── middleware/   # Auth, Rate limit, Policy
│       ├── routes/       # API routes
│       └── data/         # Mock catalog
│
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key (optional for demo mode)

### 1. Clone & Install

```bash
cd weddingease-chatbot

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (get free key from https://aistudio.google.com/apikey)
```

### 3. Run Development Servers

```bash
# Terminal 1: Start backend (port 3001)
cd backend && npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend && npm run dev
```

### 4. Open the App

Visit [http://localhost:5173](http://localhost:5173)

## 🔧 Available Tools

| Tool | Description |
|------|-------------|
| `search_catalog` | Search products by category, budget, city, style |
| `get_delivery_date` | Estimate delivery for item + pincode |
| `get_item_details` | Get full product information |
| `send_contact_vendor` | Send inquiry to vendor |
| `generate_moodboard` | Create style moodboard |

## 💰 Monetization

**Soft Paywall System:**
- **Guest**: 5 messages/day
- **Free Account**: 10 messages/day + saved preferences
- **Premium (₹499/mo)**: Unlimited + priority + expert help

## 🔒 Safety & Trust

- Input validation and sanitization
- Hallucination detection/mitigation
- Source citations for recommendations
- Expert escalation triggers
- Rate limiting

## 📝 API Endpoints

### Chat
- `POST /api/chat` - Send message
- `POST /api/chat/session` - Create session
- `GET /api/chat/usage` - Get usage status

### Auth
- `POST /api/auth/request-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify and login
- `GET /api/auth/me` - Get current user

## 🧪 Testing

See [docs/evaluation-set.md](docs/evaluation-set.md) for test prompts and expected responses.

## 📄 License

MIT
