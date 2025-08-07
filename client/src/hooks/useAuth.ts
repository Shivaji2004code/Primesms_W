import { useState, useEffect } from 'react';
import { type User } from '../types';
import { apiRequest, setAuthStateUpdater } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastActivity: number;
}

// Remove hardcoded API URL - use relative paths for proxy

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    lastActivity: Date.now(),
  });

  // Register the auth state updater for global 401 handling
  useEffect(() => {
    setAuthStateUpdater(setAuthState);
    return () => setAuthStateUpdater(null);
  }, []);

  const updateLastActivity = () => {
    setAuthState(prev => ({
      ...prev,
      lastActivity: Date.now()
    }));
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user in localStorage as backup
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          lastActivity: Date.now(),
        });
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('user');
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        lastActivity: Date.now(),
      });
    }
  };

  const checkAuth = async () => {
    try {
      // First check localStorage for user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
          lastActivity: Date.now(),
        });
        // Still refresh from server to get latest data
        refreshUserData();
        return;
      }

      // Then check with server
      const response = await apiRequest('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          lastActivity: Date.now(),
        });
      } else {
        // Clear any stale localStorage data
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          lastActivity: Date.now(),
        });
      }
    } catch (error) {
      // Clear any stale localStorage data
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        lastActivity: Date.now(),
      });
    }
  };

  // [Claude AI] Credit System Enhancement — Aug 2025
  // Function to refresh user data (especially credit balance) from server
  const refreshUserData = async () => {
    try {
      const response = await apiRequest('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setAuthState(prev => ({
          ...prev,
          user: data.user,
        }));
        return data.user;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
    return null;
  };

  const signup = async (data: {
    name: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    phoneNumber?: string;
  }) => {
    try {
      const response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(responseData.user));
        
        setAuthState({
          user: responseData.user,
          isLoading: false,
          isAuthenticated: true,
          lastActivity: Date.now(),
        });
        return { success: true, user: responseData.user };
      } else {
        return { success: false, error: responseData.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    signup,
    checkAuth,
    updateLastActivity,
    refreshUserData,
  };
}