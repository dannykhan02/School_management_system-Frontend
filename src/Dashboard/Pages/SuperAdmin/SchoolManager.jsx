// src/Dashboard/Pages/SuperAdmin/SchoolManager.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Loader, 
  Users, 
  Building2,
  Plus, 
  X,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  School,
  Code
} from 'lucide-react';
import { toast } from "react-toastify";

function SchoolManager() {
  const { loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'view-details'
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolDetails, setSchoolDetails] = useState(null);

  // --- Data Fetching ---
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('schools/all', 'GET');
      // Handle API response structure: response.data is the array
      setSchools(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      toast.error('Failed to load schools. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // --- View Handlers ---
  const showSchoolDetails = async (school) => {
    setView('view-details');
    setSelectedSchool(school);
    setLoading(true);
    try {
      const response = await apiRequest(`schools/${school.id}`, 'GET');
      // Handle API response structure: response.data contains the school object
      setSchoolDetails(response?.data || null);
    } catch (error) {
      toast.error('Could not fetch school details.');
      setSchoolDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedSchool(null);
    setSchoolDetails(null);
    fetchSchools();
  };

  // --- Render Functions ---
  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            School Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            View and manage all registered schools in the system.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Schools</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{schools.length}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Secondary Schools</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {schools.filter(s => s.school_type === 'Secondary').length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <School className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {schools.reduce((acc, school) => acc + (school.users?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">
          All Schools
        </h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">School Info</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Users</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {schools.length > 0 ? (
                  schools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {school.logo ? (
                            <img 
                              src={school.logo} 
                              alt={school.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{school.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              {school.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {school.school_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-slate-500 dark:text-slate-400 text-xs">
                          {school.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{school.city}</span>
                            </div>
                          )}
                          {school.address && (
                            <div className="text-xs truncate max-w-[150px]" title={school.address}>
                              {school.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {school.phone && (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                              <Phone className="w-3 h-3" />
                              <span>{school.phone}</span>
                            </div>
                          )}
                          {school.email && (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[120px]" title={school.email}>
                                {school.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {school.users?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => showSchoolDetails(school)} 
                            className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No schools found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderDetailsView = () => {
    if (!schoolDetails) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading school details...</p>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={backToList}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4"
          >
            <X className="w-4 h-4" />
            Back to Schools List
          </button>
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            School Details
          </h1>
        </div>

        {/* Main Info Card */}
        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {schoolDetails.logo ? (
                <img 
                  src={schoolDetails.logo} 
                  alt={schoolDetails.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
                  <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{schoolDetails.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    <School className="w-3 h-3" />
                    {schoolDetails.school_type}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Code className="w-3 h-3" />
                    {schoolDetails.code}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-3">
                {schoolDetails.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.email}</p>
                    </div>
                  </div>
                )}
                {schoolDetails.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.phone}</p>
                    </div>
                  </div>
                )}
                {schoolDetails.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.address}</p>
                      {schoolDetails.city && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{schoolDetails.city}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* System Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Information</h3>
              <div className="space-y-3">
                {schoolDetails.created_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Registered On</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(schoolDetails.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {schoolDetails.updated_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(schoolDetails.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">School ID</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        {selectedSchool?.users && selectedSchool.users.length > 0 && (
          <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Registered Users ({selectedSchool.users.length})
            </h3>
            <div className="overflow-x-auto">
              <div className="border rounded-lg border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Phone</th>
                      <th className="px-4 py-3 text-left font-medium">Gender</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedSchool.users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {user.full_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {user.phone}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">
                          {user.gender}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {authLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      )}
      {!authLoading && loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Schools...</p>
        </div>
      )}
      {!authLoading && !loading && view === 'list' && renderListView()}
      {view === 'view-details' && renderDetailsView()}
    </div>
  );
}

export default SchoolManager;