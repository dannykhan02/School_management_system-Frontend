import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // ✅ Memoize callbacks to prevent unnecessary re-renders
  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiRequest('auth/user', 'GET');
      
      // ✅ Normalize role before setting
      if (userData.role) {
        userData.role = userData.role.toLowerCase().replace(/[-\s]/g, '_');
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Check if user must change password
      if (userData.must_change_password) {
        setMustChangePassword(true);
      }
      
      return userData;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Only logout if it's a 401 error
      if (error.status === 401) {
        logout();
      }
      return null;
    }
  }, []); // No dependencies needed

  const login = useCallback((userData) => {
    // Ensure userData has token extracted
    const token = userData.token;
    
    // Store token separately
    if (token) {
      localStorage.setItem('auth_token', token);
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
    
    // Check if user must change password
    if (userData.must_change_password) {
      setMustChangePassword(true);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Try to call logout endpoint, but don't block on errors
      await apiRequest("auth/logout", "POST").catch(err => {
        console.error('Logout API error:', err);
      });
    } finally {
      // Always clear local state
      setUser(null);
      setMustChangePassword(false);
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('auth_token');
        
        if (savedUser && token) {
          const userData = JSON.parse(savedUser);
          
          // ✅ Normalize role if it exists
          if (userData.role) {
            userData.role = userData.role.toLowerCase().replace(/[-\s]/g, '_');
          }
          
          setUser(userData);
          
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
    loading,
    refreshUser,
    changePassword,
    getAuthHeaders,
    schoolId: user?.school_id,
    mustChangePassword
  }), [
    user,
    login,
    logout,
    loading,
    refreshUser,
    changePassword,
    getAuthHeaders,
    mustChangePassword
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