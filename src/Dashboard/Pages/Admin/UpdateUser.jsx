import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Save } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { toast } from 'react-toastify';
import { useParams } from "react-router-dom";

function  UpdateUser() {
  const {id} = useParams()
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState([]);
    const [formData, setFormData] = useState({
      full_name: '',
      email: '',
      phone: '',
      role_id: '',  // changed from role
      gender: '',
      status: ''
    });

  const [loading, setLoading] = useState(false);

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiRequest('roles', 'GET');
        setRoles(response);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        toast.error('Failed to load roles.');
      }
    };
    fetchRoles();
  }, []);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await apiRequest(`users/${id}`, 'GET');
      setFormData({
        full_name: response.full_name,
        email: response.email,
        phone: response.phone,
        gender: response.gender,
        role_id: response.role_id,
        status: response.status,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load user.');
    }
  };
  fetchUser();
}, [id]);


  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    console.log(formData.role);
    
    e.preventDefault();
    setLoading(true);
    try {
     await apiRequest(`users/${id}`, 'PUT', formData);
    toast.success('User updated successfully!');
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error('Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg dark:bg-white">
            <User className="w-6 h-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">Create New User</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add a new user to system
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <User className="w-5 h-5 text-black dark:text-white" />
              </div>
              <h2 className="text-xl font-semibold text-black dark:text-white">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g., Jane Doe"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g., jane.doe@school.edu"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., (123) 456-7890"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full pl-5 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Role *</label>
                <select
                    name="role_id"   // changed here
                    value={formData.role_id}
                    onChange={handleChange}
                    className="w-full pl-5 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>

              </div>

                <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Status *</label>
                <select
                    name="status" 
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full pl-5 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none"
                    required
                  >
                    <option value="">choose</option>
                    <option value="active">Active</option>
                    <option value="inactive">In Active</option>
                  </select>

              </div>

            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
            {loading ? 'Updating...' : 'Update User'}

            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


export default UpdateUser;