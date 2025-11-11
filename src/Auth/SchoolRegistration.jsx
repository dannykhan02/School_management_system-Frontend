import React, { useState } from 'react';
import { School, User, MapPin, Phone, Mail,ArrowLeft, Save, X, Lock, Upload, Image,AlertCircle } from 'lucide-react';
import {Link, useNavigate } from 'react-router-dom'
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    formDataToSend.append("school[address]", formData.address);
    formDataToSend.append("school[school_type]", formData.schoolType);
    formDataToSend.append("school[city]", formData.city);
    formDataToSend.append("school[code]", formData.code);
    formDataToSend.append("school[phone]", formData.phone);
    formDataToSend.append("school[email]", formData.email);
    if (logo) formDataToSend.append("school[logo]", logo);

    // 👩‍💼 Admin Info
    formDataToSend.append("admin[full_name]", formData.adminName);
    formDataToSend.append("admin[email]", formData.adminEmail);
    formDataToSend.append("admin[phone]", formData.adminPhone);
    formDataToSend.append("admin[password]", formData.password);
    formDataToSend.append("admin[gender]", formData.gender);

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
    navigate('/login')

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
  "admin.full_name": "Admin Full Name",
  "admin.email": "Admin Email",
  "admin.phone": "Admin Phone",
  "admin.password": "Admin Password",
  "admin.gender": "Admin Gender",
};


  return (
    <div className="max-w-7xl mx-auto p-6  ">
      {/* Header */}

       <Link to='/login'>
         <button
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
       </Link>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg dark:bg-white">
            <School className="w-6 h-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">Create Your School</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fill in the details below to add a new school to the system
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>


{Object.keys(errors).length > 0 && (
  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
        Please fix the following errors:
      </h3>
    </div>
    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
      {Object.entries(errors).map(([field, messages]) => (
        <li key={field}>
          <strong>{fieldLabels[field] || field}:</strong> {Array.isArray(messages) ? messages.join(", ") : messages}
        </li>
      ))}
    </ul>
  </div>
)}

      <form onSubmit={handleSubmit}>
        <div className="space-y-8 border border-gray-300 rounded-sm shadow-md p-3">
          {/* Logo Upload Section */}
          <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <Image className="w-5 h-5 text-black dark:text-white" />
              </div>
              <h2 className="text-xl font-semibold text-black dark:text-white">School Logo</h2>
            </div>

            <div className=" gap-6">
              {/* Logo Preview */}
              <div className=" flex justify-center">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={logoPreview} 
                        alt="School logo preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">No logo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-black dark:text-white mb-2">
                      Upload School Logo
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Recommended: Square image, 300×300px or larger, PNG or JPG format
                    </p>
                    
                    <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-colors bg-gray-50 dark:bg-gray-900">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-black dark:text-white">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {logoPreview && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Logo uploaded successfully
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* School Information */}
          <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <School className="w-5 h-5 text-black dark:text-white" />
              </div>
              <h2 className="text-xl font-semibold text-black dark:text-white">School Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="e.g., Northwood High School"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  School Type *
                </label>
                <select
                  name="schoolType"
                  value={formData.schoolType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Primary">Primary School</option>
                  <option value="Secondary">Secondary School</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Education Lane"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Knowledge City"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., (123) 456-7890"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., contact@northwoodhigh.edu"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  School Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., NHS2024"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Admin Information */}
          <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <User className="w-5 h-5 text-black dark:text-white" />
              </div>
              <h2 className="text-xl font-semibold text-black dark:text-white">Administrator Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Jane Smith"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="e.g., j.smith@northwoodhigh.edu"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  placeholder="e.g., (987) 654-3210"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white pr-10"
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Password must be at least 8 characters long
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
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