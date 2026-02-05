import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [activeSessions, setActiveSessions] = useState(0);

  // ✅ Check if token is expired
  const isTokenExpired = useCallback(() => {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    // Add 1 minute buffer to refresh before actual expiry
    return now >= new Date(expiryDate.getTime() - 60000);
  }, []);

  // ✅ Memoize callbacks to prevent unnecessary re-renders
  const refreshUser = useCallback(async () => {
    try {
      // Check if token is expired before making request
      if (isTokenExpired()) {
        console.log('Token expired, logging out');
        // Clear state directly instead of calling logout to avoid dependency
        setUser(null);
        setMustChangePassword(false);
        setActiveSessions(0);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expires_at');
        return null;
      }

      const userData = await apiRequest('auth/user', 'GET');
      
      // ✅ Normalize role before setting
      if (userData.role) {
        userData.role = userData.role.toLowerCase().replace(/[-\s]/g, '_');
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update active sessions count
      if (userData.active_sessions !== undefined) {
        setActiveSessions(userData.active_sessions);
      }
      
      // Check if user must change password
      if (userData.must_change_password) {
        setMustChangePassword(true);
      }
      
      return userData;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Only logout if it's a 401 error (unauthorized)
      if (error.status === 401) {
        // Clear state directly instead of calling logout to avoid dependency
        setUser(null);
        setMustChangePassword(false);
        setActiveSessions(0);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expires_at');
      }
      return null;
    }
  }, [isTokenExpired]); // Removed logout dependency

  const login = useCallback((userData) => {
    // Ensure userData has token extracted
    const token = userData.token;
    
    // Store token separately
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    
    // ✅ Store token expiration time
    if (userData.token_expires_in) {
      const expiresAt = new Date(Date.now() + userData.token_expires_in * 1000);
      localStorage.setItem('token_expires_at', expiresAt.toISOString());
    }
    
    // ✅ FIX: Normalize role before storing
    const userWithoutToken = { ...userData };
    delete userWithoutToken.token;
    
    // Normalize the role (convert hyphens to underscores for routing)
    if (userWithoutToken.role) {
      userWithoutToken.role = userWithoutToken.role.toLowerCase().replace(/[-\s]/g, '_');
    }
    
    setUser(userWithoutToken);
    localStorage.setItem('user', JSON.stringify(userWithoutToken));
    
    // Update active sessions count
    if (userData.active_sessions !== undefined) {
      setActiveSessions(userData.active_sessions);
    }
    
    // Check if user must change password
    if (userData.must_change_password) {
      setMustChangePassword(true);
    }
  }, []);

  const logout = useCallback(async () => {
    // First, clear local state immediately to prevent UI issues
    setUser(null);
    setMustChangePassword(false);
    setActiveSessions(0);
    
    const token = localStorage.getItem('auth_token');
    
    // Clear storage
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expires_at');
    
    // Try to invalidate token on server (best effort)
    // This may fail if token is already expired/invalid (401), which is fine
    if (token) {
      try {
        await apiRequest("auth/logout", "POST");
        console.log('Successfully logged out from server');
      } catch (err) {
        // Silently ignore errors - local logout is what matters
        // 401 means token was already invalid (expected)
        // Other errors mean server is down (also fine, we cleared local state)
        if (err.status !== 401) {
          console.debug('Logout API call failed (non-critical):', err.message);
        }
      }
    }
  }, []);

  // ✅ NEW: Logout from all devices
  const logoutAll = useCallback(async () => {
    // First, clear local state immediately
    setUser(null);
    setMustChangePassword(false);
    setActiveSessions(0);
    
    const token = localStorage.getItem('auth_token');
    
    // Clear storage
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expires_at');
    
    // Try to invalidate all tokens on server (best effort)
    if (token) {
      try {
        await apiRequest("auth/logout-all", "POST");
        console.log('Successfully logged out from all devices');
      } catch (err) {
        // Silently ignore errors - local logout is what matters
        if (err.status !== 401) {
          console.debug('Logout-all API call failed (non-critical):', err.message);
        }
      }
    }
  }, []);

  // ✅ NEW: Get active sessions
  const getActiveSessions = useCallback(async () => {
    try {
      const data = await apiRequest('auth/active-sessions', 'GET');
      setActiveSessions(data.active_sessions || 0);
      return data;
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return { active_sessions: 0 };
    }
  }, []);

  const changePassword = useCallback(async (passwordData) => {
    try {
      const response = await apiRequest('user/change-password', 'POST', passwordData);
      
      // Update user state to reflect password change
      setUser(prevUser => ({
        ...prevUser,
        must_change_password: false,
        last_password_changed_at: new Date().toISOString()
      }));
      
      setMustChangePassword(false);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to change password:', error);
      return { 
        success: false, 
        error: error.data?.message || 'Failed to change password',
        errors: error.data?.errors || {}
      };
    }
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }, []);

  // ✅ Token expiration check interval
  useEffect(() => {
    if (!user) return;

    // Check token expiration every 30 seconds
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        console.log('Token expired, logging out');
        // Clear state directly to avoid issues
        setUser(null);
        setMustChangePassword(false);
        setActiveSessions(0);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expires_at');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, isTokenExpired]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('auth_token');
        
        if (savedUser && token) {
          // Check if token is expired
          if (isTokenExpired()) {
            console.log('Stored token is expired, clearing auth');
            localStorage.removeItem('user');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token_expires_at');
            setLoading(false);
            return;
          }

          const userData = JSON.parse(savedUser);
          
          // ✅ Normalize role if it exists
          if (userData.role) {
            userData.role = userData.role.toLowerCase().replace(/[-\s]/g, '_');
          }
          
          setUser(userData);
          
          // Update active sessions count
          if (userData.active_sessions !== undefined) {
            setActiveSessions(userData.active_sessions);
          }
          
          // Check if user must change password
          if (userData.must_change_password) {
            setMustChangePassword(true);
          }
          
          // ✅ CRITICAL FIX: Don't call refreshUser on initialization
          // This prevents the user object from changing and causing re-renders
          // Only refresh when explicitly needed (e.g., after profile update)
          
          /* 
          // Optional: Uncomment if you need to refresh user data on every page load
          // Note: This might cause the redirect loop issue
          try {
            await refreshUser();
          } catch (error) {
            console.warn('Could not refresh user on init, using cached data');
          }
          */
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expires_at');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // ✅ Empty dependencies - only run once on mount

  // ✅ CRITICAL FIX: Memoize the context value
  // This prevents the entire context from being a new object on every render
  const value = useMemo(() => ({
    user,
    login,
    logout,
    logoutAll,
    loading,
    refreshUser,
    changePassword,
    getAuthHeaders,
    getActiveSessions,
    activeSessions,
    schoolId: user?.school_id,
    mustChangePassword,
    isTokenExpired
  }), [
    user,
    login,
    logout,
    logoutAll,
    loading,
    refreshUser,
    changePassword,
    getAuthHeaders,
    getActiveSessions,
    activeSessions,
    mustChangePassword,
    isTokenExpired
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};