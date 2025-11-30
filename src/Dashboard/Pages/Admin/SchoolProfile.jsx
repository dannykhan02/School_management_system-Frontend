import React, { useEffect, useState } from 'react';
import { Edit, MapPin, Phone, Mail, School, BookOpen, CheckSquare, Square } from 'lucide-react';
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
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-7 md:h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4 sm:mb-6"></div>
          <div className="h-48 sm:h-56 md:h-64 bg-slate-200 dark:bg-slate-800 rounded-lg sm:rounded-xl mb-4 sm:mb-6"></div>
          <div className="h-40 sm:h-44 md:h-48 bg-slate-200 dark:bg-slate-800 rounded-lg sm:rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg w-fit">
          <School className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-[#0d141b] dark:text-white">
            School Profile
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#4c739a] dark:text-slate-400 font-normal leading-normal mt-1">
            View and manage school information
          </p>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
              {schoolData.logo && !logoError ? (
                <img 
                  src={schoolData.logo} 
                  alt={`${schoolData.name} logo`}
                  className="w-full h-full object-contain p-2 sm:p-3 bg-white dark:bg-slate-900"
                  onError={(e) => {
                    console.error('Failed to load logo:', schoolData.logo);
                    setLogoError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                  <School className="w-10 sm:w-12 md:w-14 lg:w-16 h-10 sm:h-12 md:h-14 lg:h-16 text-blue-400 dark:text-blue-500" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#0d141b] dark:text-white mb-2 tracking-tight capitalize">
                {schoolData.name || 'School Name'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#4c739a] dark:text-slate-400 justify-center sm:justify-start">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <BookOpen className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="font-medium">{schoolData.school_type || 'School Type'}</span>
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
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
          <Link to={`/admin/edit-school-info/${schoolData.id}`} className="w-full sm:w-auto lg:flex-shrink-0">
            <button className="flex items-center justify-center gap-2 px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 w-full sm:w-auto text-xs sm:text-sm lg:text-base dark:bg-white dark:text-black dark:hover:bg-gray-200">
              <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0d141b] dark:text-white mb-1">
            School Information
          </h2>
          <p className="text-xs sm:text-sm text-[#4c739a] dark:text-slate-400">
            Basic details and contact information
          </p>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Column 1 */}
          <div className="space-y-4 sm:space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                School Code
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.code || 'N/A'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                School Type
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.school_type || 'N/A'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Primary Curriculum
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.primary_curriculum || 'Not Set'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Stream Configuration
              </label>
              <div className="flex items-center gap-2">
                {schoolData.has_streams ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                      Streams Enabled
                    </span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                      Streams Disabled
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {schoolData.has_streams 
                  ? "This school can create and manage streams for classrooms." 
                  : "This school does not use stream-based organization."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Address
              </label>
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-[#4c739a] dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.address || 'Address not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4 sm:space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                City
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.city || 'N/A'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Phone
              </label>
              <div className="flex items-start gap-2 sm:gap-3">
                <Phone className="w-4 sm:w-5 h-4 sm:h-5 text-[#4c739a] dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.phone || 'N/A'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Email
              </label>
              <div className="flex items-start gap-2 sm:gap-3">
                <Mail className="w-4 sm:w-5 h-4 sm:h-5 text-[#4c739a] dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
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