import React, { useEffect, useState } from "react";
import { X, Save, School, Upload, AlertCircle } from "lucide-react";
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
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});


  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await apiRequest(`schools/${id}`, "GET");
        const data = response.data;

        setFormData({
          schoolName: data.name || "",
          schoolType: data.school_type || "",
          address: data.address || "",
          city: data.city || "",
          phone: data.phone || "",
          email: data.email || "",
          code: data.code || "",
        });

        if (data.logo) setLogoPreview(data.logo);
      } catch (err) {
        console.error("Failed to fetch school:", err);
      }
    };

    fetchSchool();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);

      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.schoolName);
      formDataToSend.append("school_type", formData.schoolType);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("code", formData.code);

      if (logoFile) formDataToSend.append("logo", logoFile);

      // Laravel PUT workaround
      formDataToSend.append("_method", "PUT");

      const response = await apiRequest(`schools/${id}`, "POST", formDataToSend);
        toast.success("Updated school successfully");
        navigate("/schools");
      } catch (err) {
        if (err.status === 422) {
          setErrors(err.data.errors || { general: err.data.message });
        } else {
          console.error("Failed to update school:", err.data || err.message);
        }
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
  };


  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black rounded-lg dark:bg-white">
          <School className="w-5 h-5 text-white dark:text-black" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">Edit School Profile</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Update school information and details
          </p>
        </div>
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
                <strong>{fieldLabels[field] || field}:</strong>{" "}
                {Array.isArray(messages) ? messages.join(", ") : messages}
              </li>
            ))}
          </ul>
        </div>
      )}


      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-8">
          {/* Logo Upload Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                 {logoPreview ? (
                <div className="relative w-full h-full">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <School className="w-8 h-8 text-gray-400" />
              )}
              </div>
              <label className="absolute -bottom-2 -right-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="p-2 bg-black text-white rounded-full cursor-pointer hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200">
                  <Upload className="w-3 h-3" />
                </div>
              </label>
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white mb-1">School Logo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload a new logo. Recommended size: 256×256px
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                School Name *
              </label>
              <input
                type="text"
                 name="schoolName"
                value={formData.schoolName}
              onChange={handleChange}
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

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                School Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                   onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                required
              />
            </div>
          </div>


          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                    onChange={handleChange}
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSchoolProfile;