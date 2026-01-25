import React, { useEffect, useState } from 'react';
import { 
  User, 
  Save, 
  Loader, 
  Mail, 
  Phone, 
  UserCircle, 
  Shield, 
  Calendar, 
  X, 
  Check,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';

function UserProfile() {
  const [profile, setProfile] = useState({
    school_id: null,
    role_id: '',
    role: '',
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    status: '',
    email_verified_at: null,
    must_change_password: false,
    created_at: '',
    updated_at: ''
  });
  
  const [editableProfile, setEditableProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('auth/user', 'GET');
      console.log('Profile API Response:', response); // Debug log
      
      // Safe mapping with type checking
      const mappedProfile = {
        school_id: response.school_id || null,
        role_id: response.role_id || '',
        role: response.role || '',
        full_name: response.full_name || '',
        email: response.email || '',
        phone: response.phone || '',
        gender: response.gender || '',
        status: response.status || '',
        email_verified_at: response.email_verified_at || null,
        must_change_password: response.must_change_password || false,
        created_at: response.created_at || '',
        updated_at: response.updated_at || ''
      };
      
      setProfile(mappedProfile);
      setEditableProfile({
        full_name: mappedProfile.full_name || '',
        email: mappedProfile.email || '',
        phone: mappedProfile.phone || '',
        gender: mappedProfile.gender || ''
      });
      setMessage({ text: '', type: '' });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({
        text: 'Failed to load profile. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!editableProfile.full_name?.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (!editableProfile.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editableProfile.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (editableProfile.phone && editableProfile.phone.length > 20) {
      errors.phone = 'Phone number is too long';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({
        text: 'Please fix the validation errors',
        type: 'error'
      });
      return;
    }
    
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await apiRequest('user/profile', 'PATCH', editableProfile);
      console.log('Update response:', response);
      
      if (response.user) {
        const updatedProfile = {
          school_id: response.user.school_id || profile.school_id,
          role_id: response.user.role_id || profile.role_id,
          role: response.user.role || profile.role,
          full_name: response.user.full_name || editableProfile.full_name,
          email: response.user.email || editableProfile.email,
          phone: response.user.phone || editableProfile.phone,
          gender: response.user.gender || editableProfile.gender,
          status: response.user.status || profile.status,
          email_verified_at: response.user.email_verified_at || profile.email_verified_at,
          must_change_password: response.user.must_change_password || profile.must_change_password,
          created_at: response.user.created_at || profile.created_at,
          updated_at: response.user.updated_at || new Date().toISOString()
        };
        
        setProfile(updatedProfile);
      }
      
      setIsEditing(false);
      setMessage({
        text: response.message || 'Profile updated successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      
      if (error.errors) {
        setValidationErrors(error.errors);
      }
      
      setMessage({
        text: error.message || 'Failed to update profile. Please try again.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditableProfile({
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      gender: profile.gender || ''
    });
    setIsEditing(false);
    setValidationErrors({});
    setMessage({ text: '', type: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = status === 'active' 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles}`}>
        <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'}`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}
      </span>
    );
  };

  const calculateDaysAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 'Today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  // Safe role display function
  const getRoleDisplay = () => {
    const role = profile.role;
    
    // If role is a string (like "super-admin")
    if (typeof role === 'string') {
      return role.replace('-', ' ').toUpperCase();
    }
    
    // If role is a number (role ID) or other type
    if (typeof role === 'number') {
      // Map role IDs to role names if needed
      const roleMap = {
        1: 'ADMIN',
        2: 'TEACHER',
        3: 'STUDENT',
        4: 'PARENT',
        5: 'SUPER ADMIN'
      };
      return roleMap[role] || `ROLE ${role}`;
    }
    
    // If role is null/undefined
    return 'No Role Assigned';
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-8 px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-slate-600 dark:text-slate-400 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[#0d141b] dark:text-white text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
                My Profile
              </h1>
              <p className="text-[#4c739a] dark:text-slate-400 text-sm sm:text-base font-normal leading-normal">
                View and update your personal information
              </p>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg sm:rounded-xl h-10 sm:h-11 px-4 sm:px-6 bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm sm:text-base flex-1">{message.text}</p>
            <button
              onClick={() => setMessage({ text: '', type: '' })}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-white dark:text-slate-900" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {profile.full_name || 'N/A'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  {getRoleDisplay()}
                </p>
                {getStatusBadge(profile.status)}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-slate-900 dark:text-white break-all">
                    {profile.email || 'No email'}
                  </span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-slate-900 dark:text-white">
                      {profile.phone}
                    </span>
                  </div>
                )}
                {profile.gender && (
                  <div className="flex items-center gap-3 text-sm">
                    <UserCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-slate-900 dark:text-white capitalize">
                      {profile.gender}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information Card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <button
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Account Information
                  </h3>
                </div>
                {showMoreInfo ? (
                  <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {showMoreInfo && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Role</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {getRoleDisplay()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Email Status</span>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile.email_verified_at ? 'Verified' : 'Pending'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Password Status</span>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile.must_change_password ? 'Change Required' : 'Updated'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Account Created</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(profile.created_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Editable Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6">
                {isEditing ? 'Edit Personal Information' : 'Personal Information'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Editable Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          id="full_name"
                          name="full_name"
                          value={editableProfile.full_name}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                            validationErrors.full_name 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-slate-300 dark:border-slate-600'
                          } bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                          required
                        />
                        {validationErrors.full_name && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {validationErrors.full_name}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-900 dark:text-white font-medium text-sm sm:text-base">
                          {profile.full_name || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email *
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={editableProfile.email}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                            validationErrors.email 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-slate-300 dark:border-slate-600'
                          } bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                          required
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {validationErrors.email}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-900 dark:text-white font-medium text-sm sm:text-base break-all">
                          {profile.email || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={editableProfile.phone}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                            validationErrors.phone 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-slate-300 dark:border-slate-600'
                          } bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                        />
                        {validationErrors.phone && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {validationErrors.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-900 dark:text-white font-medium text-sm sm:text-base">
                          {profile.phone || 'Not provided'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="gender" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        id="gender"
                        name="gender"
                        value={editableProfile.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-900 dark:text-white font-medium text-sm sm:text-base capitalize">
                          {profile.gender || 'Not specified'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg h-10 sm:h-11 px-4 sm:px-6 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg h-10 sm:h-11 px-4 sm:px-6 bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Account Summary */}
            <div className="mt-4 sm:mt-6 bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                Account Summary
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Account Age</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile.created_at ? 
                        `${Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24))} days` 
                        : '0 days'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {calculateDaysAgo(profile.updated_at)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email Status</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile.email_verified_at ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Security</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile.must_change_password ? 'Action Required' : 'Secure'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;