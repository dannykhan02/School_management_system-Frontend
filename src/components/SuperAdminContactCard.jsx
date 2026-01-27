import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, Shield, Loader, Mail, Phone, X } from 'lucide-react';
import { apiRequest } from '../utils/api';

const SuperAdminContactCard = ({ show, onClose }) => {
  const [superAdmins, setSuperAdmins] = useState([]);
  const [loadingSuperAdmins, setLoadingSuperAdmins] = useState(false);
  const [superAdminError, setSuperAdminError] = useState('');

  const fetchSuperAdmins = async () => {
    try {
      setLoadingSuperAdmins(true);
      setSuperAdminError('');
      const response = await apiRequest('users/super-admins', 'GET');
      console.log('Super admins API response:', response);
      
      // Handle different response structures
      if (response && response.data) {
        if (response.data.super_admins) {
          setSuperAdmins(response.data.super_admins || []);
        } else if (Array.isArray(response.data)) {
          setSuperAdmins(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setSuperAdmins(response.data.data);
        } else {
          console.warn('Unexpected response structure:', response.data);
          setSuperAdmins([]);
        }
      } else if (Array.isArray(response)) {
        setSuperAdmins(response);
      } else if (response && response.super_admins) {
        setSuperAdmins(response.super_admins || []);
      } else {
        console.warn('Unexpected API response:', response);
        setSuperAdmins([]);
      }
    } catch (error) {
      console.error('Failed to fetch super admins:', error);
      setSuperAdminError('Failed to load super admin contacts. Please try again later.');
      setSuperAdmins([]);
    } finally {
      setLoadingSuperAdmins(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchSuperAdmins();
    }
  }, [show]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="super-admin-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md md:max-w-lg lg:max-w-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0 mt-0.5">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                id="super-admin-modal-title"
                className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white"
              >
                Need to Change School Profile?
              </h3>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                School structure fields (Type, Curriculum, Levels) are locked for system integrity.
                Please contact a Super Administrator for assistance.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 md:px-6 pt-4 flex-shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <strong className="font-semibold">Locked Fields:</strong> School Type, Primary/Secondary Curriculum, Curriculum Levels, Grade/Class Levels, Stream Configuration
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6 flex-grow overflow-y-auto">
          {loadingSuperAdmins ? (
            <div className="flex flex-col items-center justify-center py-8 md:py-10">
              <Loader className="w-8 h-8 md:w-10 md:h-10 animate-spin text-slate-600 dark:text-slate-400" />
              <p className="mt-3 text-sm md:text-base text-slate-500 dark:text-slate-400">Loading super admins...</p>
            </div>
          ) : superAdminError ? (
            <div className="text-center py-8 md:py-10">
              <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm md:text-base text-red-600 dark:text-red-400 mb-4">{superAdminError}</p>
            </div>
          ) : superAdmins.length > 0 ? (
            <div className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <h4 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                  Available Super Administrators ({superAdmins.length})
                </h4>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {superAdmins.map((admin, index) => (
                  <div
                    key={admin.id || index}
                    className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-slate-900 dark:text-white text-sm sm:text-base mb-3">
                          {admin.name || admin.full_name || 'Super Admin'}
                        </h5>
                        
                        <div className="space-y-2.5">
                          {(admin.email || admin.Email) && (
                            <div className="flex items-start gap-2">
                              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                              <a 
                                href={`mailto:${admin.email || admin.Email}`}
                                className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline break-all"
                                title={admin.email || admin.Email}
                              >
                                {admin.email || admin.Email}
                              </a>
                            </div>
                          )}
                          
                          {(admin.phone || admin.Phone) && (
                            <div className="flex items-start gap-2">
                              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                              <a 
                                href={`tel:${admin.phone || admin.Phone}`}
                                className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline"
                                title={admin.phone || admin.Phone}
                              >
                                {admin.phone || admin.Phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 md:py-10">
              <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-4">
                No super administrators are currently available in the system.
              </p>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                Please contact system support directly.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 md:p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 sm:py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminContactCard;