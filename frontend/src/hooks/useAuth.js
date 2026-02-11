import { useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('weddingease_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Request OTP
  const requestOTP = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.requestOTP(email);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify OTP and login
  const verifyOTP = useCallback(async (email, otp, sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.verifyOTP(email, otp, sessionId);
      
      // Store token and user
      localStorage.setItem('weddingease_token', result.token);
      localStorage.setItem('weddingease_user', JSON.stringify(result.user));
      setUser(result.user);
      
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('weddingease_token');
    localStorage.removeItem('weddingease_user');
    setUser(null);
  }, []);

  // Check if authenticated
  const isAuthenticated = !!user;

  return {
    user,
    isAuthenticated,
    loading,
    error,
    requestOTP,
    verifyOTP,
    logout
  };
}
