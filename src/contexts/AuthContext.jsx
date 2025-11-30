import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Function to refresh user data from API
  const refreshUser = async () => {
    try {
      const userData = await apiRequest('auth/user', 'GET');
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
  };

  const login = (userData) => {
    // Ensure userData has token extracted
    const token = userData.token;
    
    // Store token separately
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    
    // Store user data (without token in user object for cleaner state)
    const userWithoutToken = { ...userData };
    delete userWithoutToken.token;
    
    setUser(userWithoutToken);
    localStorage.setItem('user', JSON.stringify(userWithoutToken));
    
    // Check if user must change password
    if (userData.must_change_password) {
      setMustChangePassword(true);
    }
  };

  const logout = async () => {
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
  };

  const changePassword = async (passwordData) => {
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
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('auth_token');
        
        if (savedUser && token) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Check if user must change password
          if (userData.must_change_password) {
            setMustChangePassword(true);
          }
          
          // Optional: Refresh user data on app load
          // This ensures we have the latest user info
          try {
            await refreshUser();
          } catch (error) {
            // If refresh fails, still use cached data
            console.warn('Could not refresh user on init, using cached data');
          }
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
  }, []);

  // Expose schoolId as a computed property for convenience
  const schoolId = user?.school_id;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      refreshUser,
      changePassword,
      getAuthHeaders,
      schoolId, // Added for easier access
      mustChangePassword // Added to track password change requirement
    }}>
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