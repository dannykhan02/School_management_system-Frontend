import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import SchoolManagerComponent from '../../../components/SchoolManagerComponent';

function SchoolManager() {
  const { loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <SchoolManagerComponent />;
}

export default SchoolManager;