import React, { useEffect, useState } from "react";
import { Save, School, Upload, AlertCircle, X, Eye, EyeOff, History, CheckSquare, Square, ChevronDown, ChevronUp, GraduationCap, Award } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../../utils/api";
import { toast } from "react-toastify";

function EditSchoolProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    schoolName: "",
    schoolType: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    code: "",
    primary_curriculum: "Both",
    secondary_curriculum: "Both",
    has_streams: false,
    has_pre_primary: false,
    has_primary: false,
    has_junior_secondary: false,
    has_senior_secondary: false,
    has_secondary: false,
    senior_secondary_pathways: [],
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await apiRequest(`schools/${id}`, "GET");
        const data = response.data;

        const schoolData = {
          schoolName: data.name || "",
          schoolType: data.school_type || "",
          address: data.address || "",
          city: data.city || "",
          phone: data.phone || "",
          email: data.email || "",
          code: data.code || "",
          primary_curriculum: data.primary_curriculum || "Both",
          secondary_curriculum: data.secondary_curriculum || "Both",
          has_streams: data.has_streams || false,
          has_pre_primary: data.has_pre_primary || false,
          has_primary: data.has_primary || false,
          has_junior_secondary: data.has_junior_secondary || false,
          has_senior_secondary: data.has_senior_secondary || false,
          has_secondary: data.has_secondary || false,
          senior_secondary_pathways: data.senior_secondary_pathways || [],
        };

        setFormData(schoolData);
        setOriginalData(schoolData);

        if (data.logo) {
          setLogoPreview(data.logo);
          setLogoError(false);
        }
      } catch (err) {
        console.error("Failed to fetch school:", err);
        toast.error("Failed to load school data");
      }
    };

    fetchSchool();
  }, [id]);

  // Update secondary curriculum when primary curriculum changes
  useEffect(() => {
    if (formData.primary_curriculum === 'Both') {
      setFormData(prev => ({ ...prev, secondary_curriculum: 'Both' }));
    } else if (formData.primary_curriculum === 'CBC' || formData.primary_curriculum === '8-4-4') {
      setFormData(prev => ({ ...prev, secondary_curriculum: prev.secondary_curriculum || formData.primary_curriculum }));
    }
  }, [formData.primary_curriculum]);
  
  // Update level checkboxes based on curriculum
  useEffect(() => {
    if (formData.primary_curriculum === 'CBC') {
      setFormData(prev => ({
        ...prev,
        has_secondary: false // Reset 8-4-4 secondary when CBC is selected
      }));
    } else if (formData.primary_curriculum === '8-4-4') {
      setFormData(prev => ({
        ...prev,
        has_pre_primary: false, // Reset CBC pre-primary when 8-4-4 is selected
        has_junior_secondary: false, // Reset CBC junior secondary when 8-4-4 is selected
        has_senior_secondary: false, // Reset CBC senior secondary when 8-4-4 is selected
      }));
    }
  }, [formData.primary_curriculum]);
  
  // Update pathways based on senior secondary selection
  useEffect(() => {
    if (!formData.has_senior_secondary) {
      setFormData(prev => ({ ...prev, senior_secondary_pathways: [] }));
    }
  }, [formData.has_senior_secondary]);

  // Track unsaved changes
  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData) || logoFile !== null;
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, logoFile, originalData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePathwayChange = (pathway) => {
    setFormData(prev => {
      const pathways = [...prev.senior_secondary_pathways];
      if (pathways.includes(pathway)) {
        return { ...prev, senior_secondary_pathways: pathways.filter(p => p !== pathway) };
      } else {
        return { ...prev, senior_secondary_pathways: [...pathways, pathway] };
      }
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size should not exceed 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      setLogoFile(file);
      setLogoError(false);

      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.schoolName);
      formDataToSend.append("school_type", formData.schoolType);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("code", formData.code);
      formDataToSend.append("primary_curriculum", formData.primary_curriculum);
      formDataToSend.append("secondary_curriculum", formData.secondary_curriculum);
      formDataToSend.append("has_streams", formData.has_streams ? "1" : "0");
      
      // Curriculum Levels
      formDataToSend.append("has_pre_primary", formData.has_pre_primary ? "1" : "0");
      formDataToSend.append("has_primary", formData.has_primary ? "1" : "0");
      formDataToSend.append("has_junior_secondary", formData.has_junior_secondary ? "1" : "0");
      formDataToSend.append("has_senior_secondary", formData.has_senior_secondary ? "1" : "0");
      formDataToSend.append("has_secondary", formData.has_secondary ? "1" : "0");
      
      // Senior Secondary Pathways
      if (formData.senior_secondary_pathways.length > 0) {
        formData.senior_secondary_pathways.forEach(pathway => {
          formDataToSend.append("senior_secondary_pathways[]", pathway);
        });
      }

      if (logoFile) formDataToSend.append("logo", logoFile);

      formDataToSend.append("_method", "PUT");

      const response = await apiRequest(`schools/${id}`, "POST", formDataToSend);
      toast.success("Updated school successfully");
      setHasUnsavedChanges(false);
      
      // Navigate after a short delay to show success message
      setTimeout(() => navigate("/schools"), 1500);
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.data.errors || { general: err.data.message });
        toast.error("Validation failed. Please check the form.");
      } else {
        toast.error("Failed to update school. Please try again.");
        console.error("Failed to update school:", err.data || err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldLabels = {
    name: "School Name",
    school_type: "School Type",
    address: "Address",
    city: "City",
    phone: "Phone",
    email: "Email",
    code: "School Code",
    logo: "School Logo",
    primary_curriculum: "Primary Curriculum",
    secondary_curriculum: "Secondary Curriculum",
    has_streams: "Enable Streams",
    has_pre_primary: "Pre-Primary Level",
    has_primary: "Primary Level",
    has_junior_secondary: "Junior Secondary Level",
    has_senior_secondary: "Senior Secondary Level",
    has_secondary: "Secondary Level (8-4-4)",
    senior_secondary_pathways: "Senior Secondary Pathways",
  };

  const curriculumOptions = [
    { value: 'CBC', label: 'CBC (Competency-Based Curriculum)' },
    { value: '8-4-4', label: '8-4-4 System' },
    { value: 'Both', label: 'Both Systems' }
  ];

  const pathwayOptions = [
    { value: 'STEM', label: 'STEM (Science, Technology, Engineering, Mathematics)' },
    { value: 'Arts', label: 'Arts & Sports Science' },
    { value: 'Social Sciences', label: 'Social Sciences' }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              Edit School Profile
            </h2>
            <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
              Update school information and details
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
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
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                {logoPreview && !logoError ? (
                  <img 
                    src={logoPreview} 
                    alt="School Logo" 
                    className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900"
                    onError={(e) => {
                      console.error('Failed to load image:', logoPreview);
                      setLogoError(true);
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                    <School className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-blue-400 dark:text-blue-500" />
                  </div>
                )}
              </div>
              {logoPreview && !logoError && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
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
              {logoError && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Logo could not be loaded. Please upload a new one.
                </p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                School Name *
              </label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter school name"
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
                <option value="Mixed">Mixed (Primary & Secondary)</option>
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter school code"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Primary Curriculum *
              </label>
              <select
                name="primary_curriculum"
                value={formData.primary_curriculum}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                required
              >
                <option value="">Select curriculum</option>
                {curriculumOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Secondary Curriculum *
              </label>
              <select
                name="secondary_curriculum"
                value={formData.secondary_curriculum}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                required
                disabled={formData.primary_curriculum === 'Both'}
              >
                <option value="">Select curriculum</option>
                {curriculumOptions.map(option => (
                  <option key={option.value} value={option.value} disabled={formData.primary_curriculum === 'Both' && option.value !== 'Both'}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formData.primary_curriculum === 'Both' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Secondary curriculum is automatically set to "Both" when primary curriculum is "Both"
                </p>
              )}
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white mb-4">Contact Information</h3>
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter street address"
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter city"
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter phone number"
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Has Streams Field */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white mb-4">Stream Configuration</h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <input
                    type="checkbox"
                    id="has_streams"
                    name="has_streams"
                    checked={formData.has_streams}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="has_streams" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Enable Streams for this School
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Check this box if your school uses stream-based organization (e.g., Class A, Class B, etc.). 
                    This will allow you to create streams and assign teachers and students to them.
                  </p>
                  {formData.has_streams && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ✓ Stream functionality is enabled for this school
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Levels Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black dark:bg-white rounded-lg">
                  <GraduationCap className="w-5 h-5 text-white dark:text-black" />
                </div>
                <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white">Curriculum Levels</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showAdvancedOptions ? (
                  <>
                    Hide Advanced Options
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show Advanced Options
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CBC Levels */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">CBC Levels</h3>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id="has_pre_primary"
                        name="has_pre_primary"
                        checked={formData.has_pre_primary}
                        onChange={handleChange}
                        disabled={formData.primary_curriculum === '8-4-4'}
                        className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="has_pre_primary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        Pre-Primary (PP1-PP2)
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Early childhood education for ages 4-6
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id="has_primary"
                        name="has_primary"
                        checked={formData.has_primary}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="has_primary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        Primary (Grade 1-6)
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Primary education for ages 6-12
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id="has_junior_secondary"
                        name="has_junior_secondary"
                        checked={formData.has_junior_secondary}
                        onChange={handleChange}
                        disabled={formData.primary_curriculum === '8-4-4'}
                        className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="has_junior_secondary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        Junior Secondary (Grade 7-9)
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Lower secondary education for ages 12-15
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id="has_senior_secondary"
                        name="has_senior_secondary"
                        checked={formData.has_senior_secondary}
                        onChange={handleChange}
                        disabled={formData.primary_curriculum === '8-4-4'}
                        className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="has_senior_secondary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        Senior Secondary (Grade 10-12)
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Upper secondary education for ages 15-18
                      </p>
                    </div>
                  </div>
                </div>

                {/* Senior Secondary Pathways */}
                {formData.has_senior_secondary && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Senior Secondary Pathways
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Select the pathways your school offers for Senior Secondary students
                    </p>
                    <div className="space-y-2">
                      {pathwayOptions.map(option => (
                        <div key={option.value} className="flex items-start gap-3">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              id={`pathway_${option.value}`}
                              checked={formData.senior_secondary_pathways.includes(option.value)}
                              onChange={() => handlePathwayChange(option.value)}
                              className="w-5 h-5 text-purple-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-2"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor={`pathway_${option.value}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                              {option.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 8-4-4 Levels */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">8-4-4 Levels</h3>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id="has_secondary"
                        name="has_secondary"
                        checked={formData.has_secondary}
                        onChange={handleChange}
                        disabled={formData.primary_curriculum === 'CBC'}
                        className="w-5 h-5 text-green-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="has_secondary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        Secondary (Form 1-4)
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Secondary education for ages 13-17
                      </p>
                    </div>
                  </div>
                </div>

                {showAdvancedOptions && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Advanced Options
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Additional settings for curriculum configuration will be available here in future updates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Profile Preview
            </h3>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden flex-shrink-0">
                {logoPreview && !logoError ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                    <School className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400 dark:text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xl sm:text-2xl font-bold text-[#0d141b] dark:text-white mb-2">
                  {formData.schoolName || "School Name"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Type:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.schoolType || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Code:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.code || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">City:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.city || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Curriculum:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.primary_curriculum}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Streams:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">
                      {formData.has_streams ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Levels:</span>
                    <div className="ml-2 flex flex-wrap gap-2 mt-1">
                      {formData.has_pre_primary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Pre-Primary</span>
                      )}
                      {formData.has_primary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Primary</span>
                      )}
                      {formData.has_junior_secondary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Junior Secondary</span>
                      )}
                      {formData.has_senior_secondary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Senior Secondary</span>
                      )}
                      {formData.has_secondary && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">Secondary</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
                  navigate("/schools");
                }
              } else {
                navigate("/schools");
              }
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !hasUnsavedChanges}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSchoolProfile;