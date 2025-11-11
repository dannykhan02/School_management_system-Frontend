import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // ✅ Laravel expects "login" not "email"
        body: JSON.stringify({ login: email, password }),
      });

      const data = await response.json();

      if (!response.ok) { 
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      console.log(data); 
      const { user: userData, token } = data;
      
      const role = userData.role_name?.toLowerCase().replace('-', '_');
      
      localStorage.setItem('auth_token', token);

      const userInfo = {
        id: userData.id,
        name: userData.name || userData.email,
        email: userData.email,
        role: role,
        token: token,
        must_change_password: userData.must_change_password
      };

      login(userInfo);
      navigate(`/${role}/dashboard`, { replace: true });
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-black dark:text-white mx-auto mb-4" />
          <p className="text-black dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated (will redirect via useEffect)
  if (user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-black dark:text-white mx-auto mb-4" />
          <p className="text-black dark:text-white">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-black p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-black dark:text-white">
                  Evolve School Manager
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to your account to continue
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-white"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin dark:border-black dark:border-t-transparent"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In' 
                )}
              </button>
            </form>

            {/* Additional Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                © 2024 Evolve School Manager. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Hero Section */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-900 to-black dark:from-gray-100 dark:to-white p-12 flex items-center justify-center">
          <div className="text-center text-white dark:text-black max-w-md">
            <User className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h3 className="text-2xl font-bold mb-4">
              School Management System
            </h3>
            <p className="text-gray-300 dark:text-gray-700 leading-relaxed">
              Streamline your school administration with our comprehensive management platform. 
              Manage students, teachers, classes, and attendance all in one place.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Student Management
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Teacher Portal
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Attendance Tracking
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Grade Management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
