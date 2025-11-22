// src/Dashboard/Pages/SuperAdmin/SchoolProfile.jsx
import React, { useEffect, useState } from 'react';
import { Edit, MapPin, Phone, Mail, School, BookOpen } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { Link } from 'react-router-dom';

function SchoolProfile() {
  const [schoolData, setSchoolData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('schools', 'GET');
        setSchoolData(response.data);
        setLogoError(false);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl mb-6"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg">
          <School className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            School Profile
          </h2>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            View and manage school information
          </p>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 lg:w-36 lg:h-36 bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex-shrink-0">
              {schoolData.logo && !logoError ? (
                <img 
                  src={schoolData.logo} 
                  alt={`${schoolData.name} logo`}
                  className="w-full h-full object-contain p-3 bg-white dark:bg-slate-900"
                  onError={(e) => {
                    console.error('Failed to load logo:', schoolData.logo);
                    setLogoError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                  <School className="w-16 h-16 text-blue-400 dark:text-blue-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0d141b] dark:text-white mb-2 tracking-tight capitalize">
                {schoolData.name || 'School Name'}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-[#4c739a] dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">{schoolData.school_type || 'School Type'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{schoolData.city || 'City'}</span>
                </div>
              </div>
              {logoError && schoolData.logo && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ Logo could not be loaded from server
                </p>
              )}
            </div>
          </div>
          <Link to={`/admin/edit-school-info/${schoolData.id}`} className="w-full lg:w-auto">
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-black dark:bg-slate-700 text-white hover:bg-gray-800 dark:hover:bg-slate-600 w-full justify-center">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#0d141b] dark:text-white mb-1">
            School Information
          </h2>
          <p className="text-sm text-[#4c739a] dark:text-slate-400">
            Basic details and contact information
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1 */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-2 uppercase tracking-wide">
                School Code
              </label>
              <p className="text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.code || 'N/A'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-2 uppercase tracking-wide">
                School Type
              </label>
              <p className="text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.school_type || 'N/A'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-2 uppercase tracking-wide">
                Primary Curriculum
              </label>
              <p className="text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.primary_curriculum || 'Not Set'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-2 uppercase tracking-wide">
                Address
              </label>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#4c739a] dark:text-slate-400 mt-0.5" />
                <p className="text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.address || 'Address not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-2 uppercase tracking-wide">
                City
              </label>
              <p className="text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.city || 'N/A'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-2 uppercase tracking-wide">
                Phone
              </label>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#4c739a] dark:text-slate-400 mt-0.5" />
                <p className="text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.phone || 'N/A'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-2 uppercase tracking-wide">
                Email
              </label>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#4c739a] dark:text-slate-400 mt-0.5" />
                <p className="text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolProfile;