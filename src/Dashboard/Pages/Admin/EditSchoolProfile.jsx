// src/Dashboard/Pages/SuperAdmin/EditSchoolProfile.jsx
import React, { useEffect, useState } from "react";
import { Save, School, Upload, AlertCircle, X, Eye, EyeOff, History } from "lucide-react";
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
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [logoError, setLogoError] = useState(false);

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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
  };

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
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
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
        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-8 mb-6">
          
          {/* Logo Upload Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
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
                    <School className="w-16 h-16 text-blue-400 dark:text-blue-500" />
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
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                School Name *
              </label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter school name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                School Type *
              </label>
              <select
                name="schoolType"
                value={formData.schoolType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              >
                <option value="">Select type</option>
                <option value="Primary">Primary School</option>
                <option value="Secondary">Secondary School</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                School Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter school code"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                Primary Curriculum *
              </label>
              <select
                name="primary_curriculum"
                value={formData.primary_curriculum}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              >
                <option value="CBC">CBC</option>
                <option value="8-4-4">8-4-4</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter street address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-200 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Profile Preview
            </h3>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex-shrink-0">
                {logoPreview && !logoError ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                    <School className="w-12 h-12 text-blue-400 dark:text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-[#0d141b] dark:text-white mb-2">
                  {formData.schoolName || "School Name"}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-background-dark/50 rounded-b-xl">
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
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !hasUnsavedChanges}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-black dark:bg-slate-700 text-white hover:bg-gray-800 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
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