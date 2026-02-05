import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  // ✅ CRITICAL FIX: Separate useEffect that only runs once when user is authenticated
  useEffect(() => {
    // Only run if user exists, auth is not loading, and we haven't redirected yet
    if (!user || authLoading || hasRedirectedRef.current) {
      return;
    }

    // Mark that we're redirecting
    hasRedirectedRef.current = true;
    
    // Normalize role by replacing hyphens with underscores
    const rawRole = user.role || user.role_name || 'admin';
    const role = rawRole.toLowerCase().replace(/[-\s]/g, '_');
    
    console.log('Login: Redirecting user', { 
      userId: user.id, 
      rawRole, 
      normalizedRole: role 
    });
    
    const targetPath = `/${role}/dashboard`;
    console.log('Login: Navigating to:', targetPath);
    
    // Use replace to prevent back button issues
    navigate(targetPath, { replace: true });
  }, [user, authLoading, navigate]);

  // ✅ Reset redirect flag when component unmounts or user logs out
  useEffect(() => {
    return () => {
      if (!user) {
        hasRedirectedRef.current = false;
      }
    };
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Backend expects 'login' field (not 'email')
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ 
          login: email,
          password: password 
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse.substring(0, 500));
        throw new Error('Server error. Please check if Laravel is running correctly.');
      }

      const data = await response.json();

      if (!response.ok) { 
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      const token = data.token;
      
      if (!token) {
        throw new Error('No authentication token received from server.');
      }

      // ✅ Validate Redis token format (should be 64 characters)
      if (token.length !== 64) {
        console.warn('Warning: Token length is not 64 characters. Expected Redis token format.');
      }
      
      // Extract role information
      const roleName = data.role_name || data.role || 'admin';
      const role = roleName.toLowerCase().replace(/[-\s]/g, '_');
      
      // Construct user info object from flat backend response
      const userInfo = {
        id: data.id,
        school_id: data.school_id,
        role_id: data.role_id,
        name: data.full_name || data.name || data.email,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        status: data.status,
        role: role,
        role_name: roleName,
        token: token,
        must_change_password: data.must_change_password || false,
        email_verified_at: data.email_verified_at,
        active_sessions: data.active_sessions || 1, // ✅ NEW: Track sessions
        token_expires_in: data.token_expires_in || 3600, // ✅ NEW: Track expiry (default 1 hour)
      };

      console.log('Login successful:', {
        userId: userInfo.id,
        role: userInfo.role,
        activeSessions: userInfo.active_sessions,
        tokenLength: token.length,
        expiresIn: userInfo.token_expires_in
      });

      // Reset redirect flag before login
      hasRedirectedRef.current = false;

      // Save to context and localStorage
      login(userInfo);
      
      // Navigation will happen in useEffect
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting screen if user is authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-6xl flex flex-col lg:flex-row rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg sm:shadow-xl lg:shadow-2xl">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-slate-800/50 p-4 sm:p-6 md:p-8 lg:p-12">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
              <div className="p-2 sm:p-3 bg-black dark:bg-white rounded-lg flex-shrink-0">
                <div className="w-5 sm:w-6 h-5 sm:h-6 text-white dark:text-black font-bold text-sm flex items-center justify-center">E</div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-[#0d141b] dark:text-white text-center sm:text-left">
                Evolve School Manager
              </h1>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0d141b] dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-sm sm:text-base text-[#4c739a] dark:text-slate-400 font-normal leading-normal px-2 sm:px-0">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start sm:items-center gap-2 text-red-700 dark:text-red-300 text-sm sm:text-base">
              <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-sm sm:text-base"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 sm:pl-10 pr-11 sm:pr-12 py-2 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-sm sm:text-base"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 sm:w-5 h-4 sm:h-5" /> : <Eye className="w-4 sm:w-5 h-4 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <a 
                href="/school-registration" 
                className="text-black dark:text-white font-medium hover:underline"
              >
                Register your school
              </a>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © 2024 Evolve School Manager. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side - Hero Section */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-br from-slate-900 to-black dark:from-slate-900 dark:to-black p-8 lg:p-12 items-center justify-center">
          <div className="text-center text-white dark:text-white max-w-md">
            <User className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-4 lg:mb-6 opacity-90" />
            <h3 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-4">
              School Management System
            </h3>
            <p className="text-sm lg:text-base text-slate-300 dark:text-slate-400 leading-relaxed mb-6 lg:mb-8">
              Streamline your school administration with our comprehensive management platform. Track students, manage teachers, and monitor attendance all in one place.
            </p>
            
            <div className="grid grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span>Student Management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                <span>Teacher Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                <span>Attendance Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                <span>Grade Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;