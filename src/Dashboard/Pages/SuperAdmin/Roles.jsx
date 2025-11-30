// Roles.jsx
import React, { useEffect, useState } from 'react';
import { Plus, Shield, Loader } from 'lucide-react';
import RoleForm from '../../../components/RoleForm';
import { apiRequest } from '../../../utils/api';

function Roles() {
  const [showForm, setShowForm] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiRequest('roles', 'GET');
        console.log(response);
        setRoles(response);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  return (
    <div className="w-full py-8">
      <div className="px-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg dark:bg-white">
              <Shield className="w-6 h-6 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Role Management</h1>
              <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
                Manage user roles and permissions across system
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-11 px-5 bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        </div>

        {/* Roles Table */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
            </div>
          ) : roles.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="border rounded-lg border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-4 font-medium">Role Details</th>
                      <th className="px-6 py-4 font-medium text-right">Role Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-[#0d141b] dark:text-white">{role.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 justify-end">
                            <p className="font-semibold text-[#0d141b] dark:text-white">{role.name}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-[#0d141b] dark:text-white mb-2">No roles found</p>
              <p className="text-[#4c739a] dark:text-slate-400 text-sm">No roles available in system</p>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && <RoleForm onClose={() => setShowForm(false)} />}
      </div>
    </div>
  );
}

export default Roles;