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
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg dark:bg-white">
              <Shield className="w-6 h-6 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">Role Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage user roles and permissions across the system
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
     <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
  {loading ? (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
    </div>
  ) : roles.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Role Details
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Role Name
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {roles.map((role) => (
            <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-black dark:text-white">{role.id}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3 justify-end">
                  <p className="font-semibold text-black dark:text-white">{role.name}</p>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="text-center py-16">
      <p className="text-lg font-medium text-black dark:text-white mb-2">No roles found</p>
      <p className="text-gray-600 dark:text-gray-400 text-sm">No roles available in the system</p>
    </div>
  )}
</div>


        {/* Form Modal */}
        {showForm && <RoleForm onClose={() => setShowForm(false)} />}
      </div>
    </main>
  );
}

export default Roles;