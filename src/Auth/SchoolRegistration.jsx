import React, { useState } from 'react';
import { School, User, MapPin, Phone, Mail, ArrowLeft, Save, X, Lock, Upload, Image, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

function SchoolRegistration({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    // School Information
    schoolName: '',
    schoolType: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    code: '',
    primaryCurriculum: '', // Added primary curriculum field
    hasStreams: false, // Added has streams field
    
    // Admin Information
    adminName: '',
    gender: '',
    adminEmail: '',
    adminPhone: '',
    password: ''
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const formDataToSend = new FormData();

      // 🏫 School Info
      formDataToSend.append("school[name]", formData.schoolName);
      formDataToSend.append("school[school_type]", formData.schoolType);
      formDataToSend.append("school[address]", formData.address);
      formDataToSend.append("school[city]", formData.city);
      formDataToSend.append("school[phone]", formData.phone);
      formDataToSend.append("school[email]", formData.email);
      formDataToSend.append("school[code]", formData.code);
      formDataToSend.append("school[primary_curriculum]", formData.primaryCurriculum); // Added primary curriculum
      formDataToSend.append("school[has_streams]", formData.hasStreams ? "1" : "0"); // Added has streams
      if (logo) formDataToSend.append("school[logo]", logo);

      // 👩‍💼 Admin Info
      formDataToSend.append("admin[full_name]", formData.adminName);
      formDataToSend.append("admin[gender]", formData.gender);
      formDataToSend.append("admin[email]", formData.adminEmail);
      formDataToSend.append("admin[phone]", formData.adminPhone);
      formDataToSend.append("admin[password]", formData.password);

      const response = await fetch(`${API_BASE_URL}/schools`, {
        method: "POST",
        body: formDataToSend,
        headers: { Accept: "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Validation errors:", data);

        if (response.status === 422 && data.errors) {
          setErrors(data.errors); // Laravel validation errors
          return;
        }

        throw new Error(data.message || "Failed to create school");
      }

      navigate('/login');

      if (onSave) onSave(data);
    } catch (error) {
      setErrors(error.message);
    }
  };

  const fieldLabels = {
    "school.name": "School Name",
    "school.email": "School Email",
    "school.phone": "School Phone",
    "school.address": "School Address",
    "school.code": "School Code",
    "school.city": "City",
    "school.primary_curriculum": "Primary Curriculum", // Added field label
    "school.has_streams": "Enable Streams", // Added field label
    "admin.full_name": "Admin Full Name",
    "admin.email": "Admin Email",
    "admin.phone": "Admin Phone",
    "admin.password": "Admin Password",
    "admin.gender": "Admin Gender"
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black dark:bg-white rounded-lg">
            <School className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h2 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              Create Your School
            </h2>
            <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
              Register your school and set up your administrator account
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Please fix the following errors:
            </h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
            {Object.entries(errors).map(([field, messages]) => (
              <li key={field}>
                <strong>{fieldLabels[field] || field}:</strong>{" "}
                {Array.isArray(messages) ? messages.join(", ") : messages}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Main Card Container */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-8 mb-6">
          
          {/* Logo Upload Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="School Logo" 
                    className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                    <School className="w-16 h-16 text-blue-400 dark:text-blue-500" />
                  </div>
                )}
              </div>
              {logoPreview && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                  title="Remove logo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <label className="absolute -bottom-2 -right-2 z-10">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="p-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-full cursor-pointer hover:bg-slate-600 dark:hover:bg-slate-500 transition-colors shadow-lg">
                  <Upload className="w-4 h-4" />
                </div>
              </label>
            </div>
            <div>
              <h3 className="font-medium text-[#0d141b] dark:text-white mb-1">School Logo</h3>
              <p className="text-sm text-[#4c739a] dark:text-slate-400">
                Upload a new logo. Max size: 2MB. Recommended: 256×256px
              </p>
            </div>
          </div>

          {/* School Information */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black dark:bg-white rounded-lg">
                <School className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h2 className="text-xl font-semibold text-[#0d141b] dark:text-white">School Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="e.g., Northwood High School"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  School Type *
                </label>
                <select
                  name="schoolType"
                  value={formData.schoolType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Primary">Primary School</option>
                  <option value="Secondary">Secondary School</option>
                </select>
              </div>

              {/* Added Primary Curriculum Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Primary Curriculum *
                </label>
                <select
                  name="primaryCurriculum"
                  value={formData.primaryCurriculum}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select curriculum</option>
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  School Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., NHS2024"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Education Lane"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Northwood"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., (123) 456-7890"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., contact@northwood.edu"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>

            {/* Added Has Streams Field */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <input
                    type="checkbox"
                    id="hasStreams"
                    name="hasStreams"
                    checked={formData.hasStreams}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="hasStreams" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Enable Streams for this School
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Check this box if your school uses stream-based organization (e.g., Class A, Class B, etc.). 
                    This will allow you to create streams and assign teachers and students to them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Information */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black dark:bg-white rounded-lg">
                <User className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h2 className="text-xl font-semibold text-[#0d141b] dark:text-white">Administrator Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Jane Smith"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="e.g., admin@northwood.edu"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  placeholder="e.g., (123) 456-7890"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent pr-10 transition-colors"
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Password must be at least 8 characters long
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              <Save className="w-4 h-4" />
              Create School
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SchoolRegistration;