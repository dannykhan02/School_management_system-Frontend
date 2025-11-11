import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { toast } from "react-toastify";

function RoleForm({ onClose }) {
  const [roleName, setRoleName] = useState('');
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // reset previous error
    setLoading(true);

    try {
      const response = await apiRequest('roles', 'POST', {
        name: roleName.trim(),
      });

     toast.success('Role created successfully');
      onClose(); 
    } catch (err) {
      setError(err.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg dark:bg-white">
              <Shield className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">Create New Role</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Define the name for this role
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Role Name */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Role Name
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name (e.g., Admin, Teacher)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:focus:ring-white"
                required
              />
            </div>

            {/* Display Error */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoleForm;
