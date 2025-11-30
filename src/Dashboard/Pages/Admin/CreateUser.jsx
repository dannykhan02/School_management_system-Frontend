// src/Dashboard/Pages/Admin/CreateUser.jsx
import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Save, Plus, X, Edit, Trash2, Loader, AlertCircle, Filter } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';

function CreateUser() {
  const { user: authUser, loading: authLoading } = useAuth();

  // Form states
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role_id: '',
    gender: '',
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRoleId, setFilterRoleId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch roles and users on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [rolesResponse, usersResponse] = await Promise.all([
          apiRequest('roles', 'GET'),
          apiRequest('users', 'GET')
        ]);
        
        const rolesData = rolesResponse?.data || rolesResponse || [];
        const usersData = usersResponse?.data || usersResponse || [];
        
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load roles and users.');
        setRoles([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchInitialData();
    }
  }, [authLoading]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Show create form
  const showCreateForm = () => {
    setView('create');
    setSelectedUser(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role_id: '',
      gender: '',
    });
  };

  // Show edit form
  const showEditForm = (userData) => {
    setView('edit');
    setSelectedUser(userData);
    setFormData({
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone || '',
      role_id: userData.role_id,
      gender: userData.gender || '',
    });
  };

  // Back to list view
  const backToList = () => {
    setView('list');
    setSelectedUser(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role_id: '',
      gender: '',
    });
  };

  // Fetch users with optional role filter
  const fetchUsers = async (roleId = '') => {
    setLoading(true);
    try {
      const url = roleId ? `users?role_id=${roleId}` : 'users';
      const response = await apiRequest(url, 'GET');
      const usersData = response?.data || response || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // Handle role filter change
  const handleFilterChange = (e) => {
    const roleId = e.target.value;
    setFilterRoleId(roleId);
    fetchUsers(roleId);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        role_id: parseInt(formData.role_id, 10),
        gender: formData.gender || null,
      };

      if (view === 'edit') {
        await apiRequest(`users/${selectedUser.id}`, 'PUT', payload);
        toast.success('User updated successfully!');
      } else {
        await apiRequest('users', 'POST', payload);
        toast.success('User created successfully!');
      }

      backToList();
      fetchUsers(filterRoleId);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err?.response?.data?.message || 'An error occurred';
      const validationErrors = err?.response?.data?.errors;

      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const messages = Array.isArray(validationErrors[key])
            ? validationErrors[key].join(', ')
            : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
      } else {
        toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} user: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setLoading(true);
      try {
        await apiRequest(`users/${userId}`, 'DELETE');
        toast.success('User deleted successfully!');
        fetchUsers(filterRoleId);
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete user';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // Get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render create/edit form
  const renderFormView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[#0d141b] dark:text-white">
            {view === 'edit' ? 'Edit User' : 'Create New User'}
          </h3>
          <button
            onClick={backToList}
            className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g., Jane Doe"
              required
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4c739a]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., jane.doe@school.edu"
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4c739a]" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., (123) 456-7890"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors appearance-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors appearance-none"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={backToList}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-w-[100px] justify-center dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin dark:border-black" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {view === 'edit' ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render list view
  const renderListView = () => (
    <>
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black rounded-lg dark:bg-white">
            <User className="w-6 h-6 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              User Management
            </h1>
            <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
              Manage users in your school
            </p>
          </div>
        </div>
        <button
          onClick={showCreateForm}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors self-end dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="w-5 h-5" />
          New User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters & Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Filter by Role
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4c739a]" />
              <select
                value={filterRoleId}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors appearance-none"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            />
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-[#4c739a] dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Full Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Gender</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin text-[#4c739a]" />
                      <span className="text-[#4c739a] dark:text-slate-400">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#0d141b] dark:text-white">
                      {user.full_name}
                    </td>
                    <td className="px-6 py-4 text-[#4c739a] dark:text-slate-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-[#4c739a] dark:text-slate-400">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-black/10 dark:bg-white/10 text-black dark:text-white rounded-full text-xs font-medium">
                        {user.role ? user.role.name : getRoleName(user.role_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#4c739a] dark:text-slate-400 capitalize">
                      {user.gender || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => showEditForm(user)}
                          className="p-2 text-[#4c739a] hover:text-black dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-[#4c739a] hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-[#4c739a]" />
                      <span className="text-[#4c739a] dark:text-slate-400">
                        {users.length === 0 ? 'No users found. Create one to get started.' : 'No users match your search.'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  if (authLoading) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-[#4c739a] animate-spin" />
          <p className="mt-4 text-[#4c739a] dark:text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="px-6">
        {view === 'list' && renderListView()}
        {(view === 'create' || view === 'edit') && renderFormView()}
      </div>
    </div>
  );
}

export default CreateUser;