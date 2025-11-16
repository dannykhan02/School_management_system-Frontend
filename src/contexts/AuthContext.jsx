import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data from the API
  const refreshUser = async () => {
    try {
      const userData = await apiRequest('auth/user', 'GET');
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
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
    // Ensure userData has the token extracted
    const token = userData.token;
    
    // Store token separately
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    
    // Store user data (without token in the user object for cleaner state)
    const userWithoutToken = { ...userData };
    delete userWithoutToken.token;
    
    setUser(userWithoutToken);
    localStorage.setItem('user', JSON.stringify(userWithoutToken));
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
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
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
      getAuthHeaders,
      schoolId // Added for easier access
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