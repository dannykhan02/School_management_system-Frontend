import React, { useEffect, useState } from 'react';
import {
  User,
  Save,
  Loader,
  Mail,
  Phone,
  UserCircle,
  Calendar,
  X,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  LogOut,
  Smartphone,
  AlertTriangle,
  Shield,
  Globe,
  Crown
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function UserProfile() {
  const [profile, setProfile] = useState(null);

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

  // Session management state
  const [activeSessions, setActiveSessions] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchActiveSessions();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('auth/user', 'GET');
      setProfile(response);
      setEditableProfile({
        full_name: response.full_name || '',
        email: response.email || '',
        phone: response.phone || '',
        gender: response.gender || ''
      });
      setMessage({ text: '', type: '' });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({ text: 'Failed to load profile. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await apiRequest('auth/active-sessions', 'GET');
      setActiveSessions(response);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      setActiveSessions(null);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      return;
    }
    try {
      setLoggingOut(true);
      await apiRequest('auth/logout-all', 'POST');
      await logout();
      setMessage({ text: 'Successfully logged out from all devices. Redirecting...', type: 'success' });
      setTimeout(() => navigate('/login'), 1000);
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
      setMessage({
        text: error.message || 'Failed to logout from all devices. Please try again.',
        type: 'error'
      });
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleCancelLogout = () => setShowLogoutConfirm(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!editableProfile.full_name?.trim()) errors.full_name = 'Full name is required';
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
      setMessage({ text: 'Please fix the validation errors', type: 'error' });
      return;
    }
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await apiRequest('user/profile', 'PATCH', editableProfile);
      if (response.user) {
        setProfile(prev => ({ ...prev, ...response.user }));
        setEditableProfile({
          full_name: response.user.full_name || editableProfile.full_name,
          email: response.user.email || editableProfile.email,
          phone: response.user.phone || editableProfile.phone,
          gender: response.user.gender || editableProfile.gender,
        });
      }
      setIsEditing(false);
      setMessage({ text: response.message || 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error.errors) setValidationErrors(error.errors);
      setMessage({ text: error.message || 'Failed to update profile. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditableProfile({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      gender: profile?.gender || ''
    });
    setIsEditing(false);
    setValidationErrors({});
    setMessage({ text: '', type: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const isActive = status === 'active';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isActive
          ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-500 dark:bg-cyan-400' : 'bg-red-500 dark:bg-red-400'}`}></span>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
      </span>
    );
  };

  const getRoleDisplay = (role) => {
    if (!role) return 'No Role Assigned';
    return role.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-8 px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 text-[#4c739a] animate-spin" />
          <p className="text-[#4c739a] dark:text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const totalSessions = activeSessions?.total_sessions ?? profile?.active_sessions ?? 0;
  const currentSession = profile?.current_session;

  return (
    <div className="w-full py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl h-10 sm:h-11 px-5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Message Banner ── */}
        {message.text && (
          <div className={`mb-5 p-3 sm:p-4 rounded-xl flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success'
              ? <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              : <X className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="text-sm flex-1">{message.text}</p>
            <button onClick={() => setMessage({ text: '', type: '' })} className="flex-shrink-0 hover:opacity-60 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* ────── LEFT COLUMN ────── */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">

            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar — cyan accent, mirrors SuperAdminContactCard admin avatar */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 bg-cyan-50 dark:bg-cyan-900/30 border-2 border-cyan-100 dark:border-cyan-800/50">
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {profile?.full_name || 'N/A'}
                </h2>
                {/* Role pill — cyan accent */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                    <Crown className="w-3 h-3" />
                    {getRoleDisplay(profile?.role)}
                  </span>
                </div>
                {getStatusBadge(profile?.status)}
              </div>

              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 break-all">{profile?.email || '—'}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-800 dark:text-slate-200">{profile.phone}</span>
                  </div>
                )}
                {profile?.gender && (
                  <div className="flex items-center gap-3 text-sm">
                    <UserCircle className="w-4 h-4 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-800 dark:text-slate-200 capitalize">{profile.gender}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Sessions Card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                {/* Cyan accent icon — mirrors SuperAdminContactCard shield */}
                <div className="p-1 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Sessions</h3>
              </div>

              {sessionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="w-5 h-5 text-cyan-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Session count tile — cyan accent */}
                  <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/50 rounded-lg">
                    <span className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">Total Devices</span>
                    <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{totalSessions}</span>
                  </div>

                  {/* Current session details */}
                  {currentSession && (
                    <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      {currentSession.ip_address && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                          <span>IP: {currentSession.ip_address}</span>
                        </div>
                      )}
                      {currentSession.created_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                          <span>Since: {formatDate(currentSession.created_at)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logout all */}
                  {!showLogoutConfirm ? (
                    <button
                      onClick={handleLogoutAllDevices}
                      disabled={loggingOut || totalSessions === 0}
                      className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout All Devices</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Amber warning — matches SuperAdminContactCard info box style */}
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Are you sure?</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                              This will end all {totalSessions} active session{totalSessions !== 1 ? 's' : ''}.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelLogout}
                          disabled={loggingOut}
                          className="flex-1 flex items-center justify-center rounded-lg h-9 px-3 border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleLogoutAllDevices}
                          disabled={loggingOut}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg h-9 px-3 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {loggingOut ? <Loader className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                          <span>{loggingOut ? 'Logging out...' : 'Confirm'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={fetchActiveSessions}
                    disabled={sessionsLoading}
                    className="w-full text-xs text-[#4c739a] dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Refresh Sessions
                  </button>
                </div>
              )}
            </div>

            {/* Account Information — matches SchoolStructureInfo card style exactly */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-cyan-100 dark:border-slate-700 rounded-xl p-4 sm:p-5">
              <button
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="w-full flex items-center justify-between text-left mb-2"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex-shrink-0">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
                    Account Information
                  </h3>
                </div>
                {showMoreInfo
                  ? <ChevronUp className="w-4 h-4 text-[#4c739a]" />
                  : <ChevronDown className="w-4 h-4 text-[#4c739a]" />}
              </button>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Account details and security status for your profile.
              </p>

              {showMoreInfo && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <InfoRow label="Role" value={getRoleDisplay(profile?.role)} />
                  <InfoRow
                    label="Email Status"
                    value={profile?.email_verified_at ? 'Verified' : 'Not Verified'}
                  />
                  <InfoRow
                    label="Password"
                    value={profile?.must_change_password ? 'Change Required' : 'Up to Date'}
                    warn={profile?.must_change_password}
                  />
                  <InfoRow label="School ID" value={profile?.school_id ?? '—'} />
                </div>
              )}
            </div>
          </div>

          {/* ────── RIGHT COLUMN ────── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Password warning — amber accent, matches SuperAdminContactCard locked-fields box */}
            {profile?.must_change_password && (
              <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                <div className="flex gap-2 sm:gap-3">
                  <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      Password Change Required
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      For security reasons, you must update your password as soon as possible.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information Form */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6">
                {isEditing ? 'Edit Personal Information' : 'Personal Information'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                  <FormField
                    label="Full Name" required
                    error={validationErrors.full_name}
                    isEditing={isEditing}
                    displayValue={profile?.full_name || 'N/A'}
                  >
                    <input
                      type="text" id="full_name" name="full_name"
                      value={editableProfile.full_name}
                      onChange={handleInputChange}
                      className={inputCls(!!validationErrors.full_name)}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Email" required
                    error={validationErrors.email}
                    isEditing={isEditing}
                    displayValue={profile?.email || 'N/A'}
                  >
                    <input
                      type="email" id="email" name="email"
                      value={editableProfile.email}
                      onChange={handleInputChange}
                      className={inputCls(!!validationErrors.email)}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Phone Number"
                    error={validationErrors.phone}
                    isEditing={isEditing}
                    displayValue={profile?.phone || 'Not provided'}
                  >
                    <input
                      type="tel" id="phone" name="phone"
                      value={editableProfile.phone}
                      onChange={handleInputChange}
                      className={inputCls(!!validationErrors.phone)}
                    />
                  </FormField>

                  <FormField
                    label="Gender"
                    isEditing={isEditing}
                    displayValue={
                      profile?.gender
                        ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                        : 'Not specified'
                    }
                  >
                    <select
                      id="gender" name="gender"
                      value={editableProfile.gender}
                      onChange={handleInputChange}
                      className={inputCls(false)}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </FormField>

                </div>

                {isEditing && (
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl h-10 sm:h-11 px-5 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium text-sm disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl h-10 sm:h-11 px-5 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <><Loader className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                      ) : (
                        <><Save className="w-4 h-4" /><span>Save Changes</span></>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Account Summary */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                Account Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryTile
                  label="Active Sessions"
                  value={totalSessions}
                  accent="cyan"
                />
                <SummaryTile
                  label="Email Verified"
                  value={profile?.email_verified_at ? 'Yes' : 'No'}
                  accent={profile?.email_verified_at ? 'cyan' : 'amber'}
                />
                <SummaryTile
                  label="Password Status"
                  value={profile?.must_change_password ? 'Change Required' : 'Secure'}
                  accent={profile?.must_change_password ? 'amber' : 'cyan'}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── helpers ─────────────── */

function inputCls(hasError) {
  return `w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border ${
    hasError
      ? 'border-red-500 dark:border-red-500'
      : 'border-slate-300 dark:border-slate-600'
  } bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm shadow-sm`;
}

function FormField({ label, required, error, isEditing, displayValue, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {isEditing ? (
        <div>
          {children}
          {error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      ) : (
        <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-slate-900 dark:text-white font-medium text-sm break-all">{displayValue}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${warn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function SummaryTile({ label, value, accent = 'cyan' }) {
  const styles = {
    cyan:  'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/50 text-cyan-700 dark:text-cyan-300',
    amber: 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400',
  };
  return (
    <div className={`p-3 rounded-xl ${styles[accent]}`}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${accent === 'cyan' ? 'text-cyan-700 dark:text-cyan-300' : 'text-amber-700 dark:text-amber-400'}`}>
        {value}
      </p>
    </div>
  );
}

export default UserProfile;