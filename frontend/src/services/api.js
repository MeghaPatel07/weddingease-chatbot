import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('weddingease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('weddingease_token');
      localStorage.removeItem('weddingease_user');
    }
    return Promise.reject(error);
  }
);

// Chat API
export const chatAPI = {
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post('/chat', { message, sessionId });
    return response.data;
  },
  
  createSession: async () => {
    const response = await api.post('/chat/session');
    return response.data;
  },
  
  getSession: async (sessionId) => {
    const response = await api.get(`/chat/session/${sessionId}`);
    return response.data;
  },
  
  getUsage: async () => {
    const response = await api.get('/chat/usage');
    return response.data;
  }
};

// Auth API
export const authAPI = {
  requestOTP: async (email) => {
    const response = await api.post('/auth/request-otp', { email });
    return response.data;
  },
  
  verifyOTP: async (email, otp, sessionId = null) => {
    const response = await api.post('/auth/verify-otp', { email, otp, sessionId });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export default api;
