import React, { useEffect, useState } from 'react';
import { Edit, MapPin, Phone, Mail, School, BookOpen } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { Link } from 'react-router-dom';

function SchoolProfile() {
  const [schoolData, setSchoolData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('schools', 'GET');
        setSchoolData(response.data);
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
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm transition-all duration-300 ">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex items-center gap-8">
            {schoolData.logo ? (
              <div className="w-28 h-28 lg:w-36 lg:h-36 border-2 border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm">
                <img 
                  src={schoolData.logo} 
                  alt={`${schoolData.name} logo`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            ) : (
              <div className="w-28 h-28 lg:w-36 lg:h-36  from-gray-900 to-black dark:from-gray-100 dark:to-white rounded-2xl flex items-center justify-center shadow-lg">
                <School className="w-14 h-14 text-white dark:text-gray-900" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl lg:text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight capitalize">
                {schoolData.name || 'School Name'}
              </h1>
              <div className="flex flex-wrap gap-6 text-base text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">{schoolData.school_type || 'School Type'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">{schoolData.city || 'City'}</span>
                </div>
              </div>
            </div>
          </div>
          <Link to={`/admin/edit-school-info/${schoolData.id}`} className="w-full lg:w-auto">
            <button className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 dark:bg-white dark:text-black dark:hover:bg-gray-100 w-full justify-center shadow-sm hover:shadow-md">
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm transition-all duration-300">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            School Information
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
            Basic details and contact information
          </p>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1 */}
          <div className="space-y-8">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                School Code
              </label>
              <p className="text-xl text-gray-900 dark:text-white font-semibold">
                {schoolData.code || 'N/A'}
              </p>
            </div>

            <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                City
              </label>
              <p className="text-xl text-gray-900 dark:text-white font-semibold">
                {schoolData.city || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                Address
              </label>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <p className="text-lg text-gray-900 dark:text-white font-medium leading-relaxed">
                  {schoolData.address || 'Address not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-8">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                School Type
              </label>
              <p className="text-xl text-gray-900 dark:text-white font-semibold">
                {schoolData.school_type || 'N/A'}
              </p>
            </div>

       
              
           <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                Address
              </label>
              <div className="flex items-start gap-3">
                 <Phone  className="w-5 h-5 text-gray-400 mt-1" />
                <p className="text-lg text-gray-900 dark:text-white font-medium leading-relaxed">
                  {schoolData.phone || 'N/A'}
                </p>
              </div>
            </div>
            
           <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                Address
              </label>
              <div className="flex items-start gap-3">
                 <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <p className="text-lg text-gray-900 dark:text-white font-medium leading-relaxed">
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